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
        ("DMN-BN", {"fields": ("role", "telephone", "photo", "bio", "faculte", "filiere", "date_adhesion")}),
        ("Notifications (admins)", {
            "fields": ("notify_soumission", "notify_compte", "notify_approbation", "notify_rejet"),
            "description": "Ces préférences ne s'appliquent qu'aux comptes Administrateur.",
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("DMN-BN", {"fields": ("role", "email", "first_name", "last_name", "telephone")}),
    )

    def save_model(self, request, obj, form, change):
        raw_password = None
        if not change:
            raw_password = form.cleaned_data.get("password1")
        super().save_model(request, obj, form, change)
        if not change and obj.role == "membre" and raw_password and obj.email:
            try:
                from apps.documents.tasks import notifier_bienvenue_membre, notifier_admins_compte
                notifier_bienvenue_membre.delay(str(obj.id), raw_password)
                # La notif admins est aussi déclenchée via le signal post_save,
                # mais on la force ici au cas où le signal échouerait silencieusement.
            except Exception:
                pass
