# railway/utils_parcel.py
from decimal import Decimal, ROUND_HALF_UP
from math import radians, sin, cos, sqrt, atan2
from datetime import datetime, timedelta
from django.utils import timezone

Q2 = Decimal("0.01")

def haversine_km(lat1, lon1, lat2, lon2):
    # returns float km
    R = 6371.0
    lat1 = radians(float(lat1)); lon1 = radians(float(lon1))
    lat2 = radians(float(lat2)); lon2 = radians(float(lon2))
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1)*cos(lat2)*sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c

def quant2(x: Decimal) -> Decimal:
    return x.quantize(Q2, rounding=ROUND_HALF_UP)

def get_stop_datetime(run_date, stop_time, day_offset):
    base_date = run_date + timedelta(days=int(day_offset or 0))
    naive = datetime.combine(base_date, stop_time)
    return timezone.make_aware(naive, timezone.get_current_timezone())

def get_depart_arrive_dt(trip, from_stop, to_stop):
    depart_dt = get_stop_datetime(trip.run_date, from_stop.departure_time, from_stop.day_offset)
    arrive_dt = get_stop_datetime(trip.run_date, to_stop.arrival_time, to_stop.day_offset)
    return depart_dt, arrive_dt