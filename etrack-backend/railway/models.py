from django.conf import settings
from django.db import models
from django.utils import timezone
from datetime import datetime, timedelta
import random
import string

class Station(models.Model):
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=20, unique=True)  # e.g., MAS, MDU etc.
    city = models.CharField(max_length=120, blank=True)
    state = models.CharField(max_length=80, blank=True)

    # For map / tracking later
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Details screen (your Station Details UI)
    description = models.TextField(blank=True)
    address = models.CharField(max_length=255, blank=True)
    hours = models.CharField(max_length=80, blank=True)  # "Open - 24 Hours"
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    head_of_org = models.CharField(max_length=120, blank=True)
    image_url = models.URLField(blank=True)

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.code})"


class Route(models.Model):
    name = models.CharField(max_length=120)  # e.g., Chennai - Madurai
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class RouteStop(models.Model):
    """
    Ordered stops for a Route.
    day_offset: if route crosses midnight (0 = same day, 1 = next day)
    """
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name="stops")
    station = models.ForeignKey(Station, on_delete=models.PROTECT, related_name="route_stops")

    stop_order = models.PositiveIntegerField()
    arrival_time = models.TimeField(null=True, blank=True)
    departure_time = models.TimeField(null=True, blank=True)
    day_offset = models.PositiveSmallIntegerField(default=0)

    class Meta:
        unique_together = ("route", "stop_order")
        ordering = ["route", "stop_order"]

    def __str__(self):
        return f"{self.route.name} - {self.stop_order} - {self.station.name}"


class Train(models.Model):
    train_no = models.CharField(max_length=20, unique=True)  # e.g., 12678
    name = models.CharField(max_length=120)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["train_no"]

    def __str__(self):
        return f"{self.train_no} - {self.name}"


class TrainService(models.Model):
    """
    A Train running on a specific Route.
    running_days_mask: bitmask for days of week (Mon=1, Tue=2, Wed=4... Sun=64)
    For MVP you can set to 127 (all days).
    """
    train = models.ForeignKey(Train, on_delete=models.CASCADE, related_name="services")
    route = models.ForeignKey(Route, on_delete=models.PROTECT, related_name="services")

    running_days_mask = models.PositiveSmallIntegerField(default=127)  # 127 = all days
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("train", "route")

    def __str__(self):
        return f"{self.train.train_no} on {self.route.name}"

    @staticmethod
    def mask_for_weekday(weekday: int) -> int:
        # Python weekday: Mon=0..Sun=6
        return 1 << weekday

    def runs_on_date(self, d) -> bool:
        return bool(self.running_days_mask & self.mask_for_weekday(d.weekday()))

    def stop_index(self, station_id) -> int:
        qs = list(self.route.stops.values_list("station_id", flat=True))
        try:
            return qs.index(station_id)
        except ValueError:
            return -1

    def covers_segment(self, from_station_id, to_station_id) -> bool:
        a = self.stop_index(from_station_id)
        b = self.stop_index(to_station_id)
        return a != -1 and b != -1 and a < b


class Fare(models.Model):
    """
    Fare for a service between (from_stop -> to_stop) for a class.
    You can seed fares like your UI (1st/2nd/3rd class).
    """
    CLASS_FIRST = "first"
    CLASS_SECOND = "second"
    CLASS_THIRD = "third"
    CLASS_CHOICES = [
        (CLASS_FIRST, "1st Class"),
        (CLASS_SECOND, "2nd Class"),
        (CLASS_THIRD, "3rd Class"),
    ]

    service = models.ForeignKey(TrainService, on_delete=models.CASCADE, related_name="fares")
    from_stop = models.ForeignKey(RouteStop, on_delete=models.PROTECT, related_name="fare_from")
    to_stop = models.ForeignKey(RouteStop, on_delete=models.PROTECT, related_name="fare_to")
    travel_class = models.CharField(max_length=10, choices=CLASS_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        unique_together = ("service", "from_stop", "to_stop", "travel_class")

    def __str__(self):
        return f"{self.service} {self.from_stop.station.code}->{self.to_stop.station.code} {self.travel_class} {self.amount}"


class Trip(models.Model):
    """
    A date-specific run of a TrainService.
    We create/find Trip when searching/booking for a date.
    """
    service = models.ForeignKey(TrainService, on_delete=models.CASCADE, related_name="trips")
    run_date = models.DateField()

    # Optional capacity tracking (can be improved later)
    capacity_first = models.PositiveIntegerField(default=9999)
    capacity_second = models.PositiveIntegerField(default=9999)
    capacity_third = models.PositiveIntegerField(default=9999)

    booked_first = models.PositiveIntegerField(default=0)
    booked_second = models.PositiveIntegerField(default=0)
    booked_third = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("service", "run_date")
        ordering = ["-run_date"]

    def __str__(self):
        return f"{self.service.train.train_no} {self.run_date}"

    def seats_left(self, travel_class: str) -> int:
        if travel_class == Fare.CLASS_FIRST:
            return max(0, self.capacity_first - self.booked_first)
        if travel_class == Fare.CLASS_SECOND:
            return max(0, self.capacity_second - self.booked_second)
        return max(0, self.capacity_third - self.booked_third)

    def add_booked(self, travel_class: str, qty: int):
        if travel_class == Fare.CLASS_FIRST:
            self.booked_first += qty
        elif travel_class == Fare.CLASS_SECOND:
            self.booked_second += qty
        else:
            self.booked_third += qty
    def remove_booked(self, travel_class: str, qty: int):
        if travel_class == Fare.CLASS_FIRST:
            self.booked_first = max(0, self.booked_first - qty)
        elif travel_class == Fare.CLASS_SECOND:
            self.booked_second = max(0, self.booked_second - qty)
        else:
            self.booked_third = max(0, self.booked_third - qty)




# ... existing models above ...

class Booking(models.Model):
    # Existing status (keep)
    STATUS_PENDING = "pending"
    STATUS_CONFIRMED = "confirmed"
    STATUS_CANCELLED = "cancelled"
    STATUS_COMPLETED = "completed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_CONFIRMED, "Confirmed"),
        (STATUS_CANCELLED, "Cancelled"),
        (STATUS_COMPLETED, "Completed"),
    ]

    # ✅ IRCTC-like booking/current status
    BK_CNF = "CNF"
    BK_RAC = "RAC"
    BK_WL = "WL"
    BK_CAN = "CAN"
    BK_STATUS_CHOICES = [
        (BK_CNF, "Confirmed"),
        (BK_RAC, "RAC"),
        (BK_WL, "Waiting List"),
        (BK_CAN, "Cancelled"),
    ]

    QUOTA_GN = "GN"
    QUOTA_CHOICES = [(QUOTA_GN, "General")]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookings")
    trip = models.ForeignKey("Trip", on_delete=models.CASCADE, related_name="bookings")

    from_stop = models.ForeignKey("RouteStop", on_delete=models.PROTECT, related_name="book_from")
    to_stop = models.ForeignKey("RouteStop", on_delete=models.PROTECT, related_name="book_to")

    travel_class = models.CharField(max_length=10, choices=Fare.CLASS_CHOICES)
    seats = models.PositiveIntegerField(default=1)

    amount_per_seat = models.DecimalField(max_digits=10, decimal_places=2)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)

    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=STATUS_PENDING)

    created_at = models.DateTimeField(auto_now_add=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    # ✅ NEW: IRCTC-like fields
    pnr = models.CharField(max_length=10, unique=True, null=True, blank=True)  # auto-generated
    quota = models.CharField(max_length=3, choices=QUOTA_CHOICES, default=QUOTA_GN)

    booking_status = models.CharField(max_length=3, choices=BK_STATUS_CHOICES, default=BK_CNF)
    current_status = models.CharField(max_length=3, choices=BK_STATUS_CHOICES, default=BK_CNF)

    coach = models.CharField(max_length=5, blank=True)     # e.g., S3 / B1
    seat_no = models.PositiveIntegerField(null=True, blank=True)
    berth = models.CharField(max_length=3, blank=True)     # LB/MB/UB/SU/SL

    # ✅ Fare breakdown
    base_fare = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    service_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gst = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Booking#{self.id} {self.user_id} {self.trip} {self.status}"

    def ensure_pnr(self):
        if self.pnr:
            return
        # simple unique PNR generator
        for _ in range(20):
            candidate = "".join(random.choices(string.digits, k=10))
            if not Booking.objects.filter(pnr=candidate).exists():
                self.pnr = candidate
                return
        # fallback
        self.pnr = str(self.id).zfill(10)

    def journey_departure_dt(self) -> datetime:
        if not self.from_stop.departure_time:
            dep_time = datetime.min.time()
        else:
            dep_time = self.from_stop.departure_time
        base = datetime.combine(self.trip.run_date, dep_time)
        return base + timedelta(days=self.from_stop.day_offset)

    def can_cancel(self, now=None) -> bool:
        if self.status != self.STATUS_CONFIRMED:
            return False
        now = now or timezone.now()
        dep = self.journey_departure_dt()
        dep_aware = timezone.make_aware(dep, timezone.get_current_timezone())
        return dep_aware - now >= timedelta(days=2)

    @property
    def departure_dt(self):
        """
        Departure datetime for the booking's from_stop.
        """
        dep_time = self.from_stop.departure_time or timezone.datetime.min.time()
        dt = timezone.datetime.combine(self.trip.run_date, dep_time) + timedelta(days=self.from_stop.day_offset)
        return timezone.make_aware(dt, timezone.get_current_timezone())

    @property
    def arrival_dt(self):
        """
        Approx arrival datetime for booking's to_stop.
        """
        arr_time = self.to_stop.arrival_time or timezone.datetime.min.time()
        dt = timezone.datetime.combine(self.trip.run_date, arr_time) + timedelta(days=self.to_stop.day_offset)
        return timezone.make_aware(dt, timezone.get_current_timezone())

    @property
    def is_upcoming(self) -> bool:
        """
        Upcoming means: confirmed & departure is in the future.
        """
        if self.status != self.STATUS_CONFIRMED:
            return False
        return self.departure_dt >= timezone.now()

    @property
    def is_completed(self) -> bool:
        """
        Completed means: arrival is in the past OR status completed.
        """
        if self.status == self.STATUS_COMPLETED:
            return True
        return self.arrival_dt < timezone.now()
    def save(self, *args, **kwargs):
        if not self.pnr:
            self.ensure_pnr()
        super().save(*args, **kwargs)

class Passenger(models.Model):
    GENDER_M = "M"
    GENDER_F = "F"
    GENDER_O = "O"
    GENDER_CHOICES = [
        (GENDER_M, "Male"),
        (GENDER_F, "Female"),
        (GENDER_O, "Other"),
    ]

    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="passengers")
    name = models.CharField(max_length=120)
    age = models.PositiveIntegerField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)

    # optional seat assignment per passenger later
    seat_no = models.PositiveIntegerField(null=True, blank=True)
    berth = models.CharField(max_length=3, blank=True)

    def __str__(self):
        return f"{self.name} ({self.age})"
    
class Payment(models.Model):
    STATUS_INITIATED = "initiated"
    STATUS_SUCCESS = "success"
    STATUS_FAILED = "failed"
    STATUS_REFUNDED = "refunded"
    STATUS_CHOICES = [
        (STATUS_INITIATED, "Initiated"),
        (STATUS_SUCCESS, "Success"),
        (STATUS_FAILED, "Failed"),
        (STATUS_REFUNDED, "Refunded"),
    ]

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name="payment")
    provider = models.CharField(max_length=40, default="mock")
    txn_ref = models.CharField(max_length=120, blank=True)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=STATUS_INITIATED)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Payment#{self.id} booking={self.booking_id} {self.status}"


from django.conf import settings
from django.db import models

class Notification(models.Model):
    # Icons
    ICON_TICKET = "ticket"
    ICON_TRAIN = "train"
    ICON_ALERT = "alert"
    ICON_WEB = "web"

    # Event types
    EVENT_BOOKING_CONFIRMED = "booking_confirmed"
    EVENT_REMINDER_24H = "reminder_24h"
    EVENT_REMINDER_1H = "reminder_1h"
    EVENT_BOOKING_CANCELLED = "booking_cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    title = models.CharField(max_length=120)
    message = models.TextField()
    icon = models.CharField(max_length=30, default=ICON_TICKET)

    # ✅ add these fields
    event_type = models.CharField(max_length=50, default="", blank=True)
    booking_id_ref = models.IntegerField(null=True, blank=True)
    dedupe_key = models.CharField(
    max_length=120,
    unique=True,
    null=True,      # 👈 allow null temporarily
    blank=True
)

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user_id} - {self.title}"


# railway/models.py
from django.conf import settings
from django.db import models
from django.utils import timezone
from decimal import Decimal
import uuid

# ... keep your existing models above ...

class ParcelBooking(models.Model):
    STATUS_BOOKED = "BOOKED"
    STATUS_DEPARTED = "DEPARTED"
    STATUS_DELIVERED = "DELIVERED"
    STATUS_CANCELLED = "CANCELLED"

    STATUS_CHOICES = [
        (STATUS_BOOKED, "Booked"),
        (STATUS_DEPARTED, "Departed"),
        (STATUS_DELIVERED, "Delivered"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="parcels")

    # same rails as tickets
    trip = models.ForeignKey("Trip", on_delete=models.CASCADE, related_name="parcel_bookings")
    service = models.ForeignKey("TrainService", on_delete=models.CASCADE, related_name="parcel_bookings")
    from_stop = models.ForeignKey("RouteStop", on_delete=models.PROTECT, related_name="parcel_from")
    to_stop = models.ForeignKey("RouteStop", on_delete=models.PROTECT, related_name="parcel_to")

    tracking_id = models.CharField(max_length=30, unique=True, db_index=True)

    receiver_name = models.CharField(max_length=120, blank=True, default="")
    receiver_phone = models.CharField(max_length=30, blank=True, default="")

    distance_km = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    base_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    vat = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_BOOKED)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.tracking_id} ({self.status})"

    @staticmethod
    def new_tracking_id():
        # short but unique
        return "PCL-" + uuid.uuid4().hex[:10].upper()

    @property
    def is_cancelled(self):
        return self.status == self.STATUS_CANCELLED