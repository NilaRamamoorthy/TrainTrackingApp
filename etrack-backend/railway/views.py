from datetime import datetime, timedelta
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from railway.models import Notification
from .models import Station, TrainService, RouteStop, Fare, Trip, Booking, Payment
from .serializers import (
    StationSerializer,
    TrainSearchResultSerializer,
    BookingCreateSerializer,
    BookingSerializer,
)


def _find_stop(route, station_id) -> RouteStop | None:
    return route.stops.filter(station_id=station_id).order_by("stop_order").first()


def _segment_times(from_stop: RouteStop, to_stop: RouteStop):
    """
    Returns ("HH:MM", "HH:MM") strings. For MVP UI.
    Uses departure of from_stop and arrival of to_stop (fallback to departure).
    """
    dep = from_stop.departure_time or from_stop.arrival_time
    arr = to_stop.arrival_time or to_stop.departure_time
    dep_s = dep.strftime("%H:%M") if dep else "--:--"
    arr_s = arr.strftime("%H:%M") if arr else "--:--"
    return dep_s, arr_s


class StationsListAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Station.objects.filter(is_active=True).order_by("name")
        return Response(StationSerializer(qs, many=True).data, status=status.HTTP_200_OK)


class TrainSearchAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from_id = request.query_params.get("from")
        to_id = request.query_params.get("to")
        date_str = request.query_params.get("date")

        if not from_id or not to_id or not date_str:
            return Response(
                {"error": "from, to and date are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if from_id == to_id:
            return Response({"error": "from and to cannot be same"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from_id = int(from_id)
            to_id = int(to_id)
        except ValueError:
            return Response({"error": "from/to must be station ids"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            run_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"error": "date must be YYYY-MM-DD"}, status=status.HTTP_400_BAD_REQUEST)

        # validate stations exist
        if not Station.objects.filter(id=from_id, is_active=True).exists():
            return Response({"error": "from station not found"}, status=status.HTTP_404_NOT_FOUND)
        if not Station.objects.filter(id=to_id, is_active=True).exists():
            return Response({"error": "to station not found"}, status=status.HTTP_404_NOT_FOUND)

        results = []

        services = TrainService.objects.select_related("train", "route").filter(is_active=True, train__is_active=True, route__is_active=True)

        # Filter by date running day + segment coverage
        for svc in services:
            if not svc.runs_on_date(run_date):
                continue
            if not svc.covers_segment(from_id, to_id):
                continue

            from_stop = _find_stop(svc.route, from_id)
            to_stop = _find_stop(svc.route, to_id)
            if not from_stop or not to_stop:
                continue

            depart_s, arrive_s = _segment_times(from_stop, to_stop)

            # fares lookup
            fares = {}
            fare_qs = Fare.objects.filter(service=svc, from_stop=from_stop, to_stop=to_stop)
            for f in fare_qs:
                fares[f.travel_class] = f.amount

            # if fares not seeded yet, still return empty dict (frontend can handle)
            eta_text = "On time"  # placeholder until tracking module

            results.append(
                {
                    "service_id": svc.id,
                    "train_no": svc.train.train_no,
                    "train_name": svc.train.name,
                    "route_name": svc.route.name,
                    "from_station_id": from_id,
                    "to_station_id": to_id,
                    "depart_time": depart_s,
                    "arrive_time": arrive_s,
                    "eta_text": eta_text,
                    "fares": fares,
                }
            )

        serializer = TrainSearchResultSerializer(results, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

from .models import TrainService, Fare, Trip, Booking, Payment, Passenger
from .serializers import BookingCreateSerializer, BookingSerializer

# uses your helpers:
# _find_stop(route, station_id)

from decimal import Decimal
from datetime import datetime, timedelta

from django.db import transaction
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

# make sure these imports exist in your file
from .models import (
    TrainService, Fare, Trip, Booking, Passenger, Payment, Notification
)
from .serializers import BookingCreateSerializer, BookingSerializer

# helper you already use
# def _find_stop(route, station_id): ...


class BookingCreateAPI(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        ser = BookingCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        service_id = data["service_id"]
        run_date = data["date"]
        from_station_id = data["from_station_id"]
        to_station_id = data["to_station_id"]
        travel_class = data["travel_class"]
        seats = int(data["seats"])
        passengers = data.get("passengers") or []

        # ✅ if passengers present, must match seats
        if passengers and len(passengers) != seats:
            return Response(
                {"error": "Passengers count must match seats."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        svc = (
            TrainService.objects.select_related("train", "route")
            .filter(
                id=service_id,
                is_active=True,
                train__is_active=True,
                route__is_active=True,
            )
            .first()
        )
        if not svc:
            return Response({"error": "service not found"}, status=status.HTTP_404_NOT_FOUND)

        if not svc.runs_on_date(run_date):
            return Response({"error": "train does not run on this date"}, status=status.HTTP_400_BAD_REQUEST)

        if not svc.covers_segment(from_station_id, to_station_id):
            return Response({"error": "train does not cover selected segment"}, status=status.HTTP_400_BAD_REQUEST)

        from_stop = _find_stop(svc.route, from_station_id)
        to_stop = _find_stop(svc.route, to_station_id)
        if not from_stop or not to_stop:
            return Response({"error": "invalid from/to for this route"}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Block booking within 1 hour of departure
        if not from_stop.departure_time:
            return Response({"error": "departure time not configured"}, status=status.HTTP_400_BAD_REQUEST)

        dep_dt = datetime.combine(run_date, from_stop.departure_time) + timedelta(days=from_stop.day_offset)
        dep_dt = timezone.make_aware(dep_dt, timezone.get_current_timezone())

        if dep_dt - timezone.now() < timedelta(hours=1):
            return Response(
                {"error": "Online booking closes 1 hour before departure."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        fare = Fare.objects.filter(
            service=svc, from_stop=from_stop, to_stop=to_stop, travel_class=travel_class
        ).first()
        if not fare:
            return Response(
                {"error": "fare not configured for this segment/class"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ✅ create/get Trip and lock it for safe seat update
        trip, _ = Trip.objects.get_or_create(service=svc, run_date=run_date)
        trip = Trip.objects.select_for_update().get(id=trip.id)

        left = int(trip.seats_left(travel_class))

        # ✅ IRCTC-like availability
        if left >= seats:
            bk_status = Booking.BK_CNF
        elif left > 0:
            bk_status = Booking.BK_RAC
        else:
            bk_status = Booking.BK_WL

        # For MVP, block WL booking
        if bk_status == Booking.BK_WL:
            return Response({"error": "No seats available (WL)."}, status=status.HTTP_400_BAD_REQUEST)

        # If RAC: allow booking only up to remaining seats
        if bk_status == Booking.BK_RAC and seats > left:
            return Response({"error": f"Only {left} seats left (RAC)."}, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Fare breakup (Decimal-safe)
        amount_per_seat = fare.amount  # Decimal
        base_fare = (amount_per_seat * Decimal(seats)).quantize(Decimal("0.01"))
        service_fee = Decimal("20.00")
        gst = ((base_fare + service_fee) * Decimal("0.05")).quantize(Decimal("0.01"))
        total_amount = (base_fare + service_fee + gst).quantize(Decimal("0.01"))

        booking = Booking.objects.create(
            user=request.user,
            trip=trip,
            from_stop=from_stop,
            to_stop=to_stop,
            travel_class=travel_class,
            seats=seats,
            amount_per_seat=amount_per_seat,
            base_fare=base_fare,
            service_fee=service_fee,
            gst=gst,
            total_amount=total_amount,
            status=Booking.STATUS_CONFIRMED,
            booking_status=bk_status,
            current_status=bk_status,
            quota=Booking.QUOTA_GN,
        )

        # ✅ PNR + Coach/Seat/Berth
        booking.ensure_pnr()
        coach_prefix = "S" if travel_class == Fare.CLASS_THIRD else ("B" if travel_class == Fare.CLASS_SECOND else "A")
        booking.coach = f"{coach_prefix}{(booking.id % 5) + 1}"
        booking.seat_no = (booking.id % 72) + 1

        berths = ["LB", "MB", "UB", "SL", "SU"]
        booking.berth = berths[booking.seat_no % len(berths)]
        booking.save(update_fields=["pnr", "coach", "seat_no", "berth"])

        # ✅ Save passengers
        if passengers:
            for idx, p in enumerate(passengers):
                Passenger.objects.create(
                    booking=booking,
                    name=p["name"],
                    age=p["age"],
                    gender=p["gender"],
                    seat_no=(booking.seat_no or 1) + idx,
                    berth=booking.berth,
                )
        else:
            Passenger.objects.create(
                booking=booking,
                name=getattr(request.user, "name", None)
                or getattr(request.user, "username", None)
                or "Passenger",
                age=25,
                gender=Passenger.GENDER_O,
                seat_no=booking.seat_no,
                berth=booking.berth,
            )

        # ✅ Payment (mock)
        Payment.objects.create(
            booking=booking,
            provider="mock",
            txn_ref=f"MOCK-{booking.id}",
            status=Payment.STATUS_SUCCESS,
        )

        # ✅ book seats
        trip.add_booked(travel_class, seats)
        trip.save(update_fields=["booked_first", "booked_second", "booked_third"])

        # ✅ Create notification (safe constants + dedupe)
        icon_ticket = getattr(Notification, "ICON_TICKET", "ticket")
        event_type = getattr(Notification, "EVENT_BOOKING_CONFIRMED", "booking_confirmed")
        dedupe_key = f"{event_type}:{request.user.id}:booking:{booking.id}"

        Notification.objects.get_or_create(
            dedupe_key=dedupe_key,
            defaults={
                "user": request.user,
                "title": "Ticket purchase successful",
                "message": (
                    f"PNR {booking.pnr} booked: {svc.train.train_no} {svc.train.name} "
                    f"({from_stop.station.name} → {to_stop.station.name}) on {run_date}."
                ),
                "icon": icon_ticket,
                "event_type": event_type,
                "booking_id_ref": booking.id,
            },
        )

        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class MyBookingsAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        t = (request.query_params.get("type") or "upcoming").lower()

        qs = (
            Booking.objects.select_related(
                "trip", "trip__service", "trip__service__train", "trip__service__route",
                "from_stop", "from_stop__station",
                "to_stop", "to_stop__station",
            )
            .filter(user=request.user)
            .order_by("-created_at")
        )

        today = timezone.localdate()  # date only (MVP)

        if t == "upcoming":
            # confirmed bookings in today or future
            qs = qs.filter(status=Booking.STATUS_CONFIRMED, trip__run_date__gte=today)

        elif t == "history":
            # completed trips (past date) excluding cancelled
            qs = qs.exclude(status=Booking.STATUS_CANCELLED).filter(trip__run_date__lt=today)

        elif t == "cancelled":
            qs = qs.filter(status=Booking.STATUS_CANCELLED)

        else:
            return Response({"error": "type must be upcoming|history|cancelled"}, status=status.HTTP_400_BAD_REQUEST)

        return Response(BookingSerializer(qs, many=True).data, status=status.HTTP_200_OK)


class CancelBookingAPI(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, booking_id: int):
        booking = (
            Booking.objects.select_related("trip", "trip__service")
            .filter(id=booking_id, user=request.user)
            .first()
        )
        if not booking:
            return Response({"error": "booking not found"}, status=status.HTTP_404_NOT_FOUND)

        if not booking.can_cancel():
            return Response(
                {"error": "Cancellation is allowed only 2 days before the journey (confirmed bookings only)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        trip = Trip.objects.select_for_update().get(id=booking.trip_id)

        booking.status = Booking.STATUS_CANCELLED
        booking.cancelled_at = timezone.now()
        booking.save(update_fields=["status", "cancelled_at"])

        # release seats back
        trip.remove_booked(booking.travel_class, booking.seats)
        trip.save(update_fields=["booked_first", "booked_second", "booked_third"])

        # optional: mark payment refunded (mock)
        if hasattr(booking, "payment"):
            booking.payment.status = Payment.STATUS_REFUNDED
            booking.payment.save(update_fields=["status"])

        return Response(BookingSerializer(booking).data, status=status.HTTP_200_OK)
    
from rest_framework.generics import RetrieveAPIView

class BookingDetailAPI(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookingSerializer

    def get_queryset(self):
        return Booking.objects.select_related(
            "trip", "trip__service", "trip__service__train", "trip__service__route",
            "from_stop", "from_stop__station", "to_stop", "to_stop__station"
        ).filter(user=self.request.user)

# Notification
class MyNotificationsAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = request.user.notifications.all()[:100]
        data = [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "icon": n.icon,
                "is_read": n.is_read,
                "created_at": n.created_at,
            }
            for n in qs
        ]
        return Response(data, status=200)
class NotificationBadgeAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        unread = request.user.notifications.filter(is_read=False).count()
        return Response({"unread": unread}, status=200)
class MarkNotificationReadAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        n = request.user.notifications.filter(id=pk).first()
        if not n:
            return Response({"error": "not found"}, status=404)
        n.is_read = True
        n.save(update_fields=["is_read"])
        return Response({"ok": True}, status=200)
    
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Payment
from .serializers import PaymentListSerializer

class MyPaymentsAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Payment.objects.select_related("booking").filter(booking__user=request.user).order_by("-created_at")
        return Response(PaymentListSerializer(qs, many=True).data)