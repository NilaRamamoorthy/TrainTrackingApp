# railway/tasks_parcel.py
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from django.db import IntegrityError

from railway.models import ParcelBooking, Notification
from railway.utils_parcel import get_depart_arrive_dt

def create_notification_safe(*, user, title, message, icon, event_type, parcel_id):
    dedupe_key = f"{event_type}:parcel:{parcel_id}"
    try:
        Notification.objects.create(
            user=user,
            title=title,
            message=message,
            icon=icon,
            event_type=event_type,
            booking_id_ref=parcel_id,
            dedupe_key=dedupe_key,
        )
    except IntegrityError:
        pass

@shared_task
def update_parcel_status_and_notify():
    now = timezone.now()

    qs = ParcelBooking.objects.exclude(status=ParcelBooking.STATUS_CANCELLED).select_related(
        "trip","from_stop","to_stop","to_stop__station","from_stop__station","service__train"
    )

    for p in qs:
        depart_dt, arrive_dt = get_depart_arrive_dt(p.trip, p.from_stop, p.to_stop)

        # departed
        if p.status == ParcelBooking.STATUS_BOOKED and now >= depart_dt:
            p.status = ParcelBooking.STATUS_DEPARTED
            p.save(update_fields=["status","updated_at"])
            create_notification_safe(
                user=p.user,
                title="Parcel departed",
                message=f"Parcel {p.tracking_id} departed from {p.from_stop.station.name} at {depart_dt.strftime('%H:%M')}.",
                icon=getattr(Notification, "ICON_TRAIN", "train"),
                event_type="parcel_departed",
                parcel_id=p.id,
            )

        # arriving soon (30 min before)
        if p.status == ParcelBooking.STATUS_DEPARTED:
            soon = arrive_dt - timedelta(minutes=30)
            if soon <= now <= soon + timedelta(minutes=6):
                create_notification_safe(
                    user=p.user,
                    title="Parcel arriving soon",
                    message=f"Parcel {p.tracking_id} will reach {p.to_stop.station.name} by {arrive_dt.strftime('%H:%M')}.",
                    icon=getattr(Notification, "ICON_ALERT", "alert"),
                    event_type="parcel_arriving_soon",
                    parcel_id=p.id,
                )

        # delivered
        if p.status == ParcelBooking.STATUS_DEPARTED and now >= arrive_dt:
            p.status = ParcelBooking.STATUS_DELIVERED
            p.save(update_fields=["status","updated_at"])
            create_notification_safe(
                user=p.user,
                title="Parcel delivered",
                message=f"Parcel {p.tracking_id} delivered at {p.to_stop.station.name}.",
                icon=getattr(Notification, "ICON_TICKET", "ticket"),
                event_type="parcel_delivered",
                parcel_id=p.id,
            )