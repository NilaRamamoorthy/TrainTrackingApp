from datetime import timedelta
from celery import shared_task
from django.db import IntegrityError
from django.utils import timezone

from railway.models import Booking, Notification
from railway.utils_time import get_departure_datetime

@shared_task
def create_journey_reminders():
    now = timezone.now()
    lookahead = now + timedelta(days=2, hours=2)  # covers 24h reminder window

    # ✅ adjust these to match your booking status values
    # If your Booking.status uses "CANCELLED", keep it.
    qs = (
        Booking.objects.select_related("trip", "from_stop", "to_stop", "trip__service__train")
        .exclude(status="CANCELLED")
        .filter(trip__run_date__gte=now.date())
    )

    for b in qs:
        try:
            depart_dt = get_departure_datetime(b.trip, b.from_stop)
        except Exception:
            continue

        # ignore past or too far
        if depart_dt < now or depart_dt > lookahead:
            continue

        t_24h = depart_dt - timedelta(hours=24)
        t_1h = depart_dt - timedelta(hours=1)

        # Run every 5 mins → use a 6-min window to be safe
        if t_24h <= now <= t_24h + timedelta(minutes=6):
            _create_notification_safe(
                booking=b,
                event_type=Notification.EVENT_REMINDER_24H,
                icon=Notification.ICON_TRAIN,
                title="Journey reminder (24 hrs)",
                message=f"Your train departs tomorrow at {depart_dt.strftime('%H:%M')}. PNR: {b.pnr}",
            )

        if t_1h <= now <= t_1h + timedelta(minutes=6):
            _create_notification_safe(
                booking=b,
                event_type=Notification.EVENT_REMINDER_1H,
                icon=Notification.ICON_ALERT,
                title="Journey reminder (1 hr)",
                message=f"Your train departs in 1 hour at {depart_dt.strftime('%H:%M')}. PNR: {b.pnr}",
            )

def _create_notification_safe(*, booking, event_type, icon, title, message):
    dedupe_key = f"{event_type}:booking:{booking.id}"

    try:
        Notification.objects.create(
            user=booking.user,
            title=title,
            message=message,
            icon=icon,
            event_type=event_type,
            booking_id_ref=booking.id,
            dedupe_key=dedupe_key,
        )
    except IntegrityError:
        # already created
        pass