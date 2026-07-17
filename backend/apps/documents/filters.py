import django_filters
from .models import Document


class DocumentFilter(django_filters.FilterSet):
    annee     = django_filters.NumberFilter()
    annee_min = django_filters.NumberFilter(field_name="annee", lookup_expr="gte")
    annee_max = django_filters.NumberFilter(field_name="annee", lookup_expr="lte")
    faculte   = django_filters.UUIDFilter(field_name="faculte__id")
    filiere   = django_filters.UUIDFilter(field_name="filiere__id")
    niveau    = django_filters.UUIDFilter(field_name="niveau__id")

    class Meta:
        model = Document
        fields = ["type", "statut", "annee", "faculte", "filiere", "niveau"]
