from django.utils import timezone
from django.db.models import Count
from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Document, StatutDocument
from .serializers import DocumentListSerializer, DocumentDetailSerializer, DocumentSoumissionSerializer
from .filters import DocumentFilter


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.select_related("faculte", "filiere", "niveau", "soumis_par")
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = DocumentFilter
    search_fields   = ["titre", "auteur", "resume", "mots_cles"]
    ordering_fields = ["date_soumission", "annee", "titre"]
    ordering        = ["-date_soumission"]

    def get_serializer_class(self):
        if self.action == "list":
            return DocumentListSerializer
        if self.action in ("create", "update", "partial_update"):
            return DocumentSoumissionSerializer
        return DocumentDetailSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        if self.action == "create":
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if not user.is_authenticated or user.role != "admin":
            if user.is_authenticated:
                from django.db.models import Q
                qs = qs.filter(Q(statut="approuve") | Q(soumis_par=user))
            else:
                qs = qs.filter(statut="approuve")
        mes = self.request.query_params.get("mes") == "true"
        if user.is_authenticated and mes:
            qs = qs.filter(soumis_par=user)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        statut = "approuve" if user.role == "admin" else "en_attente"
        serializer.save(soumis_par=user, statut=statut)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminRole])
    def approuver(self, request, pk=None):
        doc = self.get_object()
        doc.statut = StatutDocument.APPROUVE
        doc.approuve_par = request.user
        doc.date_approbation = timezone.now()
        doc.raison_rejet = ""
        doc.save(update_fields=["statut", "approuve_par", "date_approbation", "raison_rejet"])
        return Response({"statut": "approuve"})

    @action(detail=True, methods=["post"], permission_classes=[IsAdminRole])
    def rejeter(self, request, pk=None):
        doc = self.get_object()
        doc.statut = StatutDocument.REJETE
        doc.raison_rejet = request.data.get("raison", "")
        doc.save(update_fields=["statut", "raison_rejet"])
        return Response({"statut": "rejete"})

    @action(detail=True, methods=["get"])
    def download(self, request, pk=None):
        doc = self.get_object()
        if not doc.fichier:
            return Response({"detail": "Aucun fichier."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"url": doc.fichier.url})


class StatsView(generics.GenericAPIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        from apps.accounts.models import User as UserModel
        debut_mois = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        approuves = Document.objects.filter(statut="approuve").count()
        en_attente = Document.objects.filter(statut="en_attente").count()
        approuves_mois = Document.objects.filter(statut="approuve", date_approbation__gte=debut_mois).count()
        total_membres = UserModel.objects.filter(role="membre").count()
        top_facultes = (
            Document.objects.filter(statut="approuve")
            .values("faculte__nom")
            .annotate(count=Count("id"))
            .order_by("-count")[:6]
        )
        docs_par_annee = (
            Document.objects.filter(statut="approuve")
            .values("annee")
            .annotate(count=Count("id"))
            .order_by("annee")
        )
        return Response({
            "totalDocuments": approuves,
            "soumissionsEnAttente": en_attente,
            "totalMembres": total_membres,
            "documentsApprouvesCeMois": approuves_mois,
            "topFacultes": [{"nom": r["faculte__nom"] or "", "count": r["count"]} for r in top_facultes],
            "documentsParAnnee": [{"annee": r["annee"], "count": r["count"]} for r in docs_par_annee],
        })
