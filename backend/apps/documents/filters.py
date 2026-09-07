import django_filters
from .models import Document


class DocumentFilter(django_filters.FilterSet):
    annee     = django_filters.NumberFilter()
    annee_min = django_filters.NumberFilter(field_name="annee", lookup_expr="gte")
    annee_max = django_filters.NumberFilter(field_name="annee", lookup_expr="lte")
    faculte   = django_filters.CharFilter(field_name="faculte__nom", lookup_expr="iexact")
    filiere   = django_filters.CharFilter(field_name="filiere__nom", lookup_expr="iexact")
    niveau    = django_filters.CharFilter(field_name="niveau__nom",  lookup_expr="iexact")
    statut    = django_filters.CharFilter()

    class Meta:
        model = Document
        fields = ["type", "statut", "annee", "faculte", "filiere", "niveau"]
