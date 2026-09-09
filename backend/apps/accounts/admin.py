from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display  = ("username", "email", "get_full_name", "role", "faculte", "is_active", "date_joined")
    list_filter   = ("role", "is_active", "faculte")
    search_fields = ("username", "email", "first_name", "last_name")
    ordering      = ("-date_joined",)

    fieldsets = BaseUserAdmin.fieldsets + (
        ("DMN-BU", {"fields": ("role", "telephone", "photo", "bio", "faculte", "filiere", "date_adhesion")}),
        ("Notifications (admins)", {
            "fields": ("notify_soumission", "notify_compte", "notify_approbation", "notify_rejet"),
            "description": "Ces préférences ne s'appliquent qu'aux comptes Administrateur.",
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("DMN-BU", {"fields": ("role", "email", "first_name", "last_name", "telephone")}),
    )
