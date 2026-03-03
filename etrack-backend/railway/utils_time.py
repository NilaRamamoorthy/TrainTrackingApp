from datetime import datetime, timedelta
from django.utils import timezone

def get_departure_datetime(trip, from_stop):
    """
    trip.run_date: date
    from_stop.departure_time: time
    from_stop.day_offset: int (0/1/2...)
    """
    base_date = trip.run_date + timedelta(days=int(from_stop.day_offset or 0))
    naive_dt = datetime.combine(base_date, from_stop.departure_time)
    return timezone.make_aware(naive_dt, timezone.get_current_timezone())