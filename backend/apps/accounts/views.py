from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import User
from .serializers import UserSerializer, RegisterSerializer

_token_generator = PasswordResetTokenGenerator()


class IsAdminRole(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == "admin"


class MembresListView(generics.ListCreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return User.objects.all().select_related("faculte", "filiere").order_by("-date_joined")

    def create(self, request, *args, **kwargs):
        """Admin créé un membre/admin directement. Envoie email bienvenue si membre."""
        data = request.data
        email    = data.get("email", "").strip().lower()
        password = data.get("password", "")
        role     = data.get("role", "membre")

        if not email or not password:
            return Response({"detail": "Email et mot de passe requis."}, status=status.HTTP_400_BAD_REQUEST)
        if len(password) < 8:
            return Response({"password": "8 caractères minimum."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email__iexact=email).exists():
            return Response({"email": "Cet email est déjà utilisé."}, status=status.HTTP_400_BAD_REQUEST)

        user = User(
            email=email,
            username=email,
            first_name=data.get("prenom", ""),
            last_name=data.get("nom", ""),
            role=role,
        )
        # Faculté / filière / niveau optionnels
        from apps.classification.models import Faculte, Filiere, Niveau as NiveauModel
        faculte_nom = data.get("faculte", "")
        filiere_nom = data.get("filiere", "")
        niveau_nom  = data.get("niveau", "")
        if faculte_nom:
            try:
                user.faculte = Faculte.objects.get(nom=faculte_nom)
            except Faculte.DoesNotExist:
                pass
        if filiere_nom:
            try:
                user.filiere = Filiere.objects.get(nom=filiere_nom)
            except Exception:
                pass
        if niveau_nom:
            try:
                user.niveau = NiveauModel.objects.get(nom=niveau_nom)
            except Exception:
                pass
        user.set_password(password)
        user.save()

        if email:
            try:
                from apps.documents.tasks import notifier_bienvenue_membre
                notifier_bienvenue_membre.delay(str(user.id), password)
            except Exception:
                pass

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class PasswordResetRequestView(APIView):
    """Génère un token et envoie l'email de réinitialisation."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Réponse générique pour ne pas révéler si l'email existe
            return Response({"detail": "Si un compte existe, un email a été envoyé."})

        uid   = urlsafe_base64_encode(force_bytes(user.pk))
        token = _token_generator.make_token(user)

        from django.conf import settings as _s
        frontend_url = getattr(_s, "FRONTEND_URL", "http://localhost")
        reset_url = f"{frontend_url}/reset-password/{uid}/{token}/"

        try:
            from apps.documents.tasks import envoyer_email_reset_password
            envoyer_email_reset_password.delay(str(user.id), reset_url)
        except Exception:
            pass

        return Response({"detail": "Si un compte existe, un email a été envoyé."})


class PasswordResetConfirmView(APIView):
    """Valide le token et enregistre le nouveau mot de passe."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid      = request.data.get("uid", "")
        token    = request.data.get("token", "")
        password = request.data.get("password", "")

        if len(password) < 8:
            return Response({"password": "8 caractères minimum."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            pk   = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=pk)
        except Exception:
            return Response({"detail": "Lien invalide."}, status=status.HTTP_400_BAD_REQUEST)

        if not _token_generator.check_token(user, token):
            return Response({"detail": "Lien expiré ou déjà utilisé."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(password)
        user.save()
        return Response({"detail": "Mot de passe mis à jour."})


class ChangePasswordView(APIView):
    """Membre ou admin change son propre mot de passe."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        old_password = request.data.get("old_password", "")
        new_password = request.data.get("new_password", "")

        if not request.user.check_password(old_password):
            return Response({"old_password": "Mot de passe actuel incorrect."}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 8:
            return Response({"new_password": "8 caractères minimum."}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.save()
        return Response({"detail": "Mot de passe modifié."})


class AdminSetPasswordView(APIView):
    """Admin change le mot de passe d'un membre + option notification."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role != "admin":
            return Response({"detail": "Interdit."}, status=status.HTTP_403_FORBIDDEN)

        try:
            membre = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        new_password = request.data.get("password", "")
        notify       = request.data.get("notify", True)

        if len(new_password) < 8:
            return Response({"password": "8 caractères minimum."}, status=status.HTTP_400_BAD_REQUEST)

        membre.set_password(new_password)
        membre.save()

        if notify and membre.email:
            try:
                from apps.documents.tasks import notifier_bienvenue_membre
                notifier_bienvenue_membre.delay(str(membre.id), new_password)
            except Exception:
                pass

        return Response({"detail": "Mot de passe mis à jour."})


class LogoutView(generics.GenericAPIView):
    """Blackliste le refresh token et invalide la session."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Token refresh requis."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            pass  # déjà blacklisté ou invalide — on considère quand même la déconnexion réussie
        return Response(status=status.HTTP_204_NO_CONTENT)
