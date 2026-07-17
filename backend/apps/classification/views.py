from rest_framework import viewsets, permissions
from .models import Faculte, Niveau
from .serializers import FaculteSerializer, NiveauSerializer


class FaculteViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Faculte.objects.prefetch_related("filieres").all()
    serializer_class = FaculteSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None


class NiveauViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Niveau.objects.all()
    serializer_class = NiveauSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
