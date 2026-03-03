# railway/serializers_parcel.py
from rest_framework import serializers
from django.conf import settings
from decimal import Decimal
from railway.models import ParcelBooking, Trip, TrainService, RouteStop, Station
from railway.utils_parcel import quant2, haversine_km, get_depart_arrive_dt

class ParcelTrainOptionSerializer(serializers.Serializer):
    service_id = serializers.IntegerField()
    train_no = serializers.CharField()
    train_name = serializers.CharField()
    route_name = serializers.CharField()
    depart_time = serializers.CharField()
    arrive_time = serializers.CharField()
    distance_km = serializers.DecimalField(max_digits=10, decimal_places=2)
    base = serializers.DecimalField(max_digits=12, decimal_places=2)
    vat = serializers.DecimalField(max_digits=12, decimal_places=2)
    total = serializers.DecimalField(max_digits=12, decimal_places=2)

class ParcelBookingCreateSerializer(serializers.Serializer):
    service_id = serializers.IntegerField()
    date = serializers.DateField()
    from_station_id = serializers.IntegerField()
    to_station_id = serializers.IntegerField()
    receiver_name = serializers.CharField(required=False, allow_blank=True)
    receiver_phone = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs["from_station_id"] == attrs["to_station_id"]:
            raise serializers.ValidationError("from_station_id and to_station_id cannot be same")
        return attrs

class ParcelBookingDetailSerializer(serializers.ModelSerializer):
    train_no = serializers.CharField(source="service.train.train_no", read_only=True)
    train_name = serializers.CharField(source="service.train.name", read_only=True)
    route_name = serializers.CharField(source="service.route.name", read_only=True)

    from_station_id = serializers.IntegerField(source="from_stop.station.id", read_only=True)
    from_station_name = serializers.CharField(source="from_stop.station.name", read_only=True)
    to_station_id = serializers.IntegerField(source="to_stop.station.id", read_only=True)
    to_station_name = serializers.CharField(source="to_stop.station.name", read_only=True)

    depart_datetime = serializers.SerializerMethodField()
    arrive_datetime = serializers.SerializerMethodField()

    class Meta:
        model = ParcelBooking
        fields = [
            "id","tracking_id","status",
            "train_no","train_name","route_name",
            "from_station_id","from_station_name",
            "to_station_id","to_station_name",
            "depart_datetime","arrive_datetime",
            "distance_km","base_amount","vat","total_amount",
            "receiver_name","receiver_phone",
            "created_at",
        ]

    def get_depart_datetime(self, obj):
        depart_dt, _ = get_depart_arrive_dt(obj.trip, obj.from_stop, obj.to_stop)
        return depart_dt.isoformat()

    def get_arrive_datetime(self, obj):
        _, arrive_dt = get_depart_arrive_dt(obj.trip, obj.from_stop, obj.to_stop)
        return arrive_dt.isoformat()

class ParcelBookingListSerializer(serializers.ModelSerializer):
    from_station_name = serializers.CharField(source="from_stop.station.name", read_only=True)
    to_station_name = serializers.CharField(source="to_stop.station.name", read_only=True)
    train_no = serializers.CharField(source="service.train.train_no", read_only=True)
    train_name = serializers.CharField(source="service.train.name", read_only=True)
    depart_datetime = serializers.SerializerMethodField()
    arrive_datetime = serializers.SerializerMethodField()

    class Meta:
        model = ParcelBooking
        fields = [
            "id","tracking_id","status",
            "from_station_name","to_station_name",
            "train_no","train_name",
            "depart_datetime","arrive_datetime",
            "total_amount","distance_km",
            "created_at",
        ]

    def get_depart_datetime(self, obj):
        depart_dt, _ = get_depart_arrive_dt(obj.trip, obj.from_stop, obj.to_stop)
        return depart_dt.isoformat()

    def get_arrive_datetime(self, obj):
        _, arrive_dt = get_depart_arrive_dt(obj.trip, obj.from_stop, obj.to_stop)
        return arrive_dt.isoformat()