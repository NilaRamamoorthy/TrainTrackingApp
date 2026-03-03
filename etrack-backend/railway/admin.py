from django.contrib import admin
from .models import Station, Route, RouteStop, Train, TrainService, Fare, Trip, Booking, Payment


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 0


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "is_active")
    inlines = [RouteStopInline]


@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "city", "state", "is_active")
    search_fields = ("name", "code", "city", "state")


@admin.register(Train)
class TrainAdmin(admin.ModelAdmin):
    list_display = ("id", "train_no", "name", "is_active")
    search_fields = ("train_no", "name")


@admin.register(TrainService)
class TrainServiceAdmin(admin.ModelAdmin):
    list_display = ("id", "train", "route", "running_days_mask", "is_active")
    list_filter = ("is_active",)


@admin.register(Fare)
class FareAdmin(admin.ModelAdmin):
    list_display = ("id", "service", "from_stop", "to_stop", "travel_class", "amount")
    list_filter = ("travel_class",)


@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ("id", "service", "run_date")
    list_filter = ("run_date",)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "trip", "travel_class", "seats", "total_amount", "status", "created_at")
    list_filter = ("status", "travel_class")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "booking", "provider", "status", "created_at")
    list_filter = ("status", "provider")

from .models import Passenger
admin.site.register(Passenger)