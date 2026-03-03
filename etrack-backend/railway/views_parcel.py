# railway/views_parcel.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from decimal import Decimal

from railway.models import Station, TrainService, RouteStop, Trip, ParcelBooking, Notification
from railway.serializers_parcel import (
    ParcelTrainOptionSerializer,
    ParcelBookingCreateSerializer,
    ParcelBookingDetailSerializer,
    ParcelBookingListSerializer,
)
from railway.utils_parcel import quant2, haversine_km, get_depart_arrive_dt

def runs_on_date(service: TrainService, run_date):
    # if you already have service.runs_on_date(date) use that
    if hasattr(service, "runs_on_date"):
        return service.runs_on_date(run_date)
    # fallback: allow all if missing
    return True

def covers_segment(service: TrainService, from_station_id: int, to_station_id: int):
    # if you already have service.covers_segment(from_id,to_id) use that
    if hasattr(service, "covers_segment"):
        return service.covers_segment(from_station_id, to_station_id)
    # fallback: try find RouteStops by station in this route
    stops = RouteStop.objects.filter(route=service.route).select_related("station")
    from_stop = stops.filter(station_id=from_station_id).first()
    to_stop = stops.filter(station_id=to_station_id).first()
    if not from_stop or not to_stop:
        return False
    return from_stop.stop_order < to_stop.stop_order

def get_segment_stops(service: TrainService, from_station_id: int, to_station_id: int):
    stops = RouteStop.objects.filter(route=service.route).select_related("station")
    from_stop = stops.filter(station_id=from_station_id).first()
    to_stop = stops.filter(station_id=to_station_id).first()
    if not from_stop or not to_stop or from_stop.stop_order >= to_stop.stop_order:
        return None, None
    return from_stop, to_stop

def calc_parcel_cost(from_station: Station, to_station: Station):
    rate = getattr(settings, "PARCEL_RATE_PER_KM", Decimal("35.00"))
    fixed = getattr(settings, "PARCEL_FIXED_FEE", Decimal("50.00"))
    vat_rate = getattr(settings, "PARCEL_VAT_RATE", Decimal("0.05"))

    dist = Decimal(str(haversine_km(from_station.lat, from_station.lng, to_station.lat, to_station.lng)))
    dist = quant2(dist)
    base = quant2(dist * rate + fixed)
    vat = quant2(base * vat_rate)
    total = quant2(base + vat)
    return dist, base, vat, total

class ParcelSearchAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from_id = request.query_params.get("from")
        to_id = request.query_params.get("to")
        date_str = request.query_params.get("date")

        # optional time filters (HH:MM)
        start_time = request.query_params.get("start_time")
        end_time = request.query_params.get("end_time")

        if not from_id or not to_id or not date_str:
            return Response({"error": "from, to and date are required"}, status=400)
        if from_id == to_id:
            return Response({"error": "from and to cannot be same"}, status=400)

        try:
            from_id = int(from_id); to_id = int(to_id)
        except ValueError:
            return Response({"error": "from/to must be station ids"}, status=400)

        try:
            run_date = timezone.datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response({"error": "date must be YYYY-MM-DD"}, status=400)

        from_station = Station.objects.filter(id=from_id).first()
        to_station = Station.objects.filter(id=to_id).first()
        if not from_station or not to_station:
            return Response({"error": "Invalid station"}, status=400)

        if from_station.lat is None or from_station.lng is None or to_station.lat is None or to_station.lng is None:
            return Response({"error": "Stations must have lat/lng for parcel pricing"}, status=400)

        dist, base, vat, total = calc_parcel_cost(from_station, to_station)

        services = TrainService.objects.filter(is_active=True).select_related("train", "route")

        out = []
        for s in services:
            if not runs_on_date(s, run_date):
                continue
            if not covers_segment(s, from_id, to_id):
                continue

            from_stop, to_stop = get_segment_stops(s, from_id, to_id)
            if not from_stop or not to_stop:
                continue

            # time filter
            if start_time and str(from_stop.departure_time) < start_time:
                continue
            if end_time and str(from_stop.departure_time) > end_time:
                continue

            out.append({
                "service_id": s.id,
                "train_no": str(s.train.train_no),
                "train_name": s.train.name,
                "route_name": s.route.name,
                "depart_time": str(from_stop.departure_time)[:5],
                "arrive_time": str(to_stop.arrival_time)[:5],
                "distance_km": dist,
                "base": base,
                "vat": vat,
                "total": total,
            })

        ser = ParcelTrainOptionSerializer(out, many=True)
        return Response(ser.data)

class ParcelCreateBookingAPI(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        ser = ParcelBookingCreateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        service = TrainService.objects.filter(id=data["service_id"], is_active=True).select_related("train","route").first()
        if not service:
            return Response({"error": "Invalid service"}, status=400)

        run_date = data["date"]
        if not runs_on_date(service, run_date):
            return Response({"error": "Train not running on this date"}, status=400)

        from_stop, to_stop = get_segment_stops(service, data["from_station_id"], data["to_station_id"])
        if not from_stop or not to_stop:
            return Response({"error": "Route does not cover selected segment"}, status=400)

        from_station = from_stop.station
        to_station = to_stop.station
        if from_station.lat is None or from_station.lng is None or to_station.lat is None or to_station.lng is None:
            return Response({"error": "Stations must have lat/lng"}, status=400)

        # Create/Get trip (like tickets do)
        trip, _ = Trip.objects.get_or_create(service=service, run_date=run_date)

        dist, base, vat, total = calc_parcel_cost(from_station, to_station)

        parcel = ParcelBooking.objects.create(
            user=request.user,
            trip=trip,
            service=service,
            from_stop=from_stop,
            to_stop=to_stop,
            tracking_id=ParcelBooking.new_tracking_id(),
            receiver_name=data.get("receiver_name",""),
            receiver_phone=data.get("receiver_phone",""),
            distance_km=dist,
            base_amount=base,
            vat=vat,
            total_amount=total,
            status=ParcelBooking.STATUS_BOOKED,
        )

        # ✅ notification now
        Notification.objects.create(
            user=request.user,
            title="Parcel booked",
            message=f"Parcel {parcel.tracking_id} booked on Train {service.train.train_no}.",
            icon=getattr(Notification, "ICON_TICKET", "ticket"),
            event_type="parcel_booked",
            booking_id_ref=parcel.id,
            dedupe_key=f"parcel_booked:parcel:{parcel.id}",
        )

        return Response(ParcelBookingDetailSerializer(parcel).data, status=201)

class MyParcelsAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        typ = request.query_params.get("type","all").lower()
        qs = ParcelBooking.objects.filter(user=request.user).select_related("service__train","from_stop__station","to_stop__station","trip")

        if typ == "cancelled":
            qs = qs.filter(status=ParcelBooking.STATUS_CANCELLED)
        elif typ == "upcoming":
            qs = qs.exclude(status=ParcelBooking.STATUS_CANCELLED).exclude(status=ParcelBooking.STATUS_DELIVERED)
        elif typ == "history":
            qs = qs.filter(status=ParcelBooking.STATUS_DELIVERED)
        # else all

        return Response(ParcelBookingListSerializer(qs.order_by("-created_at"), many=True).data)

class ParcelDetailAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        obj = ParcelBooking.objects.filter(id=pk, user=request.user).select_related(
            "service__train","service__route","from_stop__station","to_stop__station","trip"
        ).first()
        if not obj:
            return Response({"error":"Parcel not found"}, status=404)
        return Response(ParcelBookingDetailSerializer(obj).data)

class ParcelCancelAPI(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, pk):
        obj = ParcelBooking.objects.filter(id=pk, user=request.user).select_related("service__train").first()
        if not obj:
            return Response({"error":"Parcel not found"}, status=404)
        if obj.status == ParcelBooking.STATUS_CANCELLED:
            return Response({"ok": True})

        obj.status = ParcelBooking.STATUS_CANCELLED
        obj.save(update_fields=["status","updated_at"])

        Notification.objects.create(
            user=request.user,
            title="Parcel cancelled",
            message=f"Parcel {obj.tracking_id} has been cancelled.",
            icon=getattr(Notification, "ICON_ALERT", "alert"),
            event_type="parcel_cancelled",
            booking_id_ref=obj.id,
            dedupe_key=f"parcel_cancelled:parcel:{obj.id}",
        )

        return Response({"ok": True})