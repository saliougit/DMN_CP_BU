from django.contrib import admin
from django.utils.html import format_html
from .models import Document, StatutDocument


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display  = ("titre", "auteur", "type", "statut_badge", "faculte", "niveau", "annee", "date_soumission")
    list_filter   = ("statut", "type", "faculte", "niveau", "annee")
    search_fields = ("titre", "auteur", "resume", "mots_cles")
    ordering      = ("-date_soumission",)
    readonly_fields = ("date_soumission", "date_approbation", "date_modification", "soumis_par", "approuve_par")

    fieldsets = (
        ("Identification", {"fields": ("titre", "auteur", "type", "statut", "raison_rejet")}),
        ("Classification", {"fields": ("faculte", "filiere", "niveau", "annee")}),
        ("Contenu",        {"fields": ("resume", "mots_cles", "directeur", "pages", "fichier")}),
        ("Workflow",       {"fields": ("soumis_par", "approuve_par", "date_soumission", "date_approbation", "date_modification")}),
    )

    actions = ["approuver_selectionnes", "rejeter_selectionnes"]

    @admin.display(description="Statut")
    def statut_badge(self, obj):
        colors = {
            StatutDocument.APPROUVE:   "green",
            StatutDocument.EN_ATTENTE: "orange",
            StatutDocument.REJETE:     "red",
        }
        color = colors.get(obj.statut, "grey")
        return format_html('<span style="color:{}; font-weight:bold;">{}</span>', color, obj.get_statut_display())

    @admin.action(description="Approuver les documents sélectionnés")
    def approuver_selectionnes(self, request, queryset):
        from django.utils import timezone
        updated = queryset.filter(statut=StatutDocument.EN_ATTENTE).update(
            statut=StatutDocument.APPROUVE,
            approuve_par=request.user,
            date_approbation=timezone.now(),
        )
        self.message_user(request, f"{updated} document(s) approuvé(s).")

    @admin.action(description="Rejeter les documents sélectionnés")
    def rejeter_selectionnes(self, request, queryset):
        updated = queryset.filter(statut=StatutDocument.EN_ATTENTE).update(statut=StatutDocument.REJETE)
        self.message_user(request, f"{updated} document(s) rejeté(s).")
