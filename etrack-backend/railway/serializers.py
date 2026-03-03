from rest_framework import serializers
from .models import Station, TrainService, RouteStop, Fare, Trip, Booking
from .models import Passenger

class StationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Station
        fields = [
            "id", "name", "code", "city", "state",
            "lat", "lng",
            "description", "address", "hours", "phone", "email", "head_of_org", "image_url",
        ]


class TrainSearchResultSerializer(serializers.Serializer):
    service_id = serializers.IntegerField()
    train_no = serializers.CharField()
    train_name = serializers.CharField()
    route_name = serializers.CharField()

    from_station_id = serializers.IntegerField()
    to_station_id = serializers.IntegerField()

    depart_time = serializers.CharField()
    arrive_time = serializers.CharField()
    eta_text = serializers.CharField()

    fares = serializers.DictField(child=serializers.DecimalField(max_digits=10, decimal_places=2))

class PassengerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Passenger
        fields = ["id", "name", "age", "gender", "seat_no", "berth"]

from rest_framework import serializers
from .models import Booking, Passenger

class PassengerCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    age = serializers.IntegerField(min_value=1, max_value=120)
    gender = serializers.ChoiceField(choices=["M", "F", "O"])

class BookingCreateSerializer(serializers.Serializer):
    service_id = serializers.IntegerField()
    date = serializers.DateField()
    from_station_id = serializers.IntegerField()
    to_station_id = serializers.IntegerField()
    travel_class = serializers.ChoiceField(choices=["first", "second", "third"])
    seats = serializers.IntegerField(min_value=1, max_value=10)

    passengers = PassengerCreateSerializer(many=True, required=False)

    def validate(self, attrs):
        seats = attrs["seats"]
        passengers = attrs.get("passengers") or []
        if passengers and len(passengers) != seats:
            raise serializers.ValidationError("Passengers count must match seats")
        return attrs

class BookingSerializer(serializers.ModelSerializer):
    train_no = serializers.SerializerMethodField()
    train_name = serializers.SerializerMethodField()
    route_name = serializers.SerializerMethodField()
    passenger_name = serializers.SerializerMethodField()
    from_station_name = serializers.SerializerMethodField()
    to_station_name = serializers.SerializerMethodField()

    depart_datetime = serializers.SerializerMethodField()
    arrive_datetime = serializers.SerializerMethodField()

    can_cancel = serializers.SerializerMethodField()
    passengers = PassengerSerializer(many=True, read_only=True)
    class Meta:
        model = Booking
        fields = [
            "id",
            "status",
            "created_at",
            "cancelled_at",
            "travel_class",
            "seats",
            "amount_per_seat",
            "total_amount",
            "train_no",
            "train_name",
            "route_name",
            "from_station_name",
            "to_station_name",
            "depart_datetime",
            "arrive_datetime",
            "can_cancel",
            "passenger_name",
            "pnr",
            "quota",
            "booking_status",
            "current_status",
            "coach",
            "seat_no",
            "berth",
            "base_fare",
            "service_fee",
            "gst",
            "passengers",
        ]

    def get_train_no(self, obj):
        return obj.trip.service.train.train_no

    def get_train_name(self, obj):
        return obj.trip.service.train.name

    def get_route_name(self, obj):
        return obj.trip.service.route.name

    def get_from_station_name(self, obj):
        return obj.from_stop.station.name

    def get_to_station_name(self, obj):
        return obj.to_stop.station.name

    def get_depart_datetime(self, obj):
        # ISO string
        from django.utils import timezone
        dt = timezone.make_aware(obj.journey_departure_dt(), timezone.get_current_timezone())
        return dt.isoformat()

    def get_arrive_datetime(self, obj):
        # arrival time of to_stop (or departure if missing)
        from datetime import datetime, timedelta
        from django.utils import timezone

        t = obj.to_stop.arrival_time or obj.to_stop.departure_time
        if not t:
            base = datetime.combine(obj.trip.run_date, datetime.min.time())
        else:
            base = datetime.combine(obj.trip.run_date, t)

        base = base + timedelta(days=obj.to_stop.day_offset)
        dt = timezone.make_aware(base, timezone.get_current_timezone())
        return dt.isoformat()

    def get_can_cancel(self, obj):
        return obj.can_cancel()
    def get_passenger_name(self, obj):
       user = obj.user

    # Try common fields safely (custom user models vary)
       for attr in ["full_name", "name", "first_name", "username", "email", "phone", "mobile"]:
        val = getattr(user, attr, None)
        if val:
            val = str(val).strip()
            if val:
                # If first_name exists and last_name exists, combine
                if attr == "first_name":
                    last = getattr(user, "last_name", "")
                    full = f"{val} {last}".strip()
                    return full
                return val

    # fallback
       return f"User {user.pk}"
    
from rest_framework import serializers
from .models import Payment

class PaymentListSerializer(serializers.ModelSerializer):
    booking_id = serializers.IntegerField(source="booking.id", read_only=True)
    pnr = serializers.CharField(source="booking.pnr", read_only=True)
    total_amount = serializers.DecimalField(source="booking.total_amount", max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Payment
        fields = ["id", "provider", "txn_ref", "status", "created_at", "booking_id", "pnr", "total_amount"]