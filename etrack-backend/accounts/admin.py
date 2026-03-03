from django.contrib import admin
from django.contrib.auth import get_user_model

User = get_user_model()

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "name", "phone", "nic_number", "is_staff", "is_active")
    search_fields = ("email", "name", "phone", "nic_number")