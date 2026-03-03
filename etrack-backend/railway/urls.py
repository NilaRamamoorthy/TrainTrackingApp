from django.urls import path
from .views import (
    StationsListAPI,
    TrainSearchAPI,
    BookingCreateAPI,
    MyBookingsAPI,
    CancelBookingAPI,
    BookingDetailAPI,
    MyNotificationsAPI,
    NotificationBadgeAPI,
    MarkNotificationReadAPI,
)
from railway import views_parcel
from .views import MyPaymentsAPI

urlpatterns = [
    path("stations/", StationsListAPI.as_view(), name="stations_list"),
    path("search-trains/", TrainSearchAPI.as_view(), name="search_trains"),
    path("bookings/", BookingCreateAPI.as_view(), name="create_booking"),
    path("my-bookings/", MyBookingsAPI.as_view(), name="my_bookings"),
    path("bookings/<int:booking_id>/cancel/", CancelBookingAPI.as_view(), name="cancel_booking"),
    path("bookings/<int:pk>/", BookingDetailAPI.as_view(), name="booking_detail"),

    path("my-payments/", MyPaymentsAPI.as_view()),


    path("my-notifications/", MyNotificationsAPI.as_view()),
    path("notification-badge/", NotificationBadgeAPI.as_view()),
    path("my-notifications/<int:pk>/read/", MarkNotificationReadAPI.as_view()),


    path("parcel/search/", views_parcel.ParcelSearchAPI.as_view()),
    path("parcel/bookings/", views_parcel.ParcelCreateBookingAPI.as_view()),
    path("my-parcels/", views_parcel.MyParcelsAPI.as_view()),
    path("parcel/bookings/<int:pk>/", views_parcel.ParcelDetailAPI.as_view()),
    path("parcel/bookings/<int:pk>/cancel/", views_parcel.ParcelCancelAPI.as_view()),
]