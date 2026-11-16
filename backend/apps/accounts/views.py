from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from .models import User, RoleChoices
from .serializers import UserSerializer, RegisterSerializer

# Doit rester synchronisé avec TypeDocument (apps/documents/models.py) — pas
# d'import direct entre apps pour éviter tout couplage models<->models.
TYPES_DOCUMENT_VALIDABLES = {
    "memoire_licence", "memoire_master", "these_doctorat", "article", "rapport",
}

_token_generator = PasswordResetTokenGenerator()


class LoginView(TokenObtainPairView):
    """Identique à TokenObtainPairView, avec un scope de throttle dédié —
    voir DEFAULT_THROTTLE_RATES['login'] (settings/base.py) : limite les
    tentatives de brute-force sur /auth/token/."""
    throttle_scope = "login"


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

        # Habilitations de validation par type de document : uniquement
        # attribuables par un super admin, y compris à la création.
        if role == RoleChoices.ADMIN and request.user.is_superuser:
            types = data.get("types_valides", [])
            if isinstance(types, list) and all(t in TYPES_DOCUMENT_VALIDABLES for t in types):
                user.types_valides = types

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
    throttle_scope = "register"


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class PasswordResetRequestView(APIView):
    """Génère un token et envoie l'email de réinitialisation."""
    permission_classes = [permissions.AllowAny]
    throttle_scope = "password_reset"

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
    throttle_scope = "password_reset"

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

        if membre.role == "admin" and membre.id != request.user.id and not request.user.is_superuser:
            return Response({"detail": "Impossible de modifier le mot de passe d'un autre administrateur."}, status=status.HTTP_403_FORBIDDEN)

        new_password = request.data.get("password", "")
        notify       = request.data.get("notify", True)

        if len(new_password) < 8:
            return Response({"password": "8 caractères minimum."}, status=status.HTTP_400_BAD_REQUEST)

        membre.set_password(new_password)
        membre.save()

        if notify and membre.email:
            try:
                from apps.documents.tasks import notifier_changement_mdp
                notifier_changement_mdp.delay(str(membre.id), new_password)
            except Exception:
                pass

        return Response({"detail": "Mot de passe mis à jour."})


class AdminSetRoleView(APIView):
    """Admin change le rôle (membre <-> admin) d'un utilisateur. Promouvoir
    un membre en admin reste ouvert à tout admin ; rétrograder un admin en
    membre est réservé au super admin."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        if request.user.role != "admin":
            return Response({"detail": "Interdit."}, status=status.HTTP_403_FORBIDDEN)

        try:
            membre = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        nouveau_role = request.data.get("role")
        if nouveau_role not in (RoleChoices.ADMIN, RoleChoices.MEMBRE):
            return Response({"role": "Rôle invalide."}, status=status.HTTP_400_BAD_REQUEST)

        if (
            membre.role == RoleChoices.ADMIN
            and nouveau_role == RoleChoices.MEMBRE
            and not request.user.is_superuser
        ):
            return Response(
                {"detail": "Seul le super admin peut rétrograder un administrateur."},
                status=status.HTTP_403_FORBIDDEN,
            )

        membre.role = nouveau_role
        # Un membre redescendu de admin perd ses habilitations de validation —
        # elles seront à réattribuer explicitement s'il est repromu plus tard.
        if nouveau_role == RoleChoices.MEMBRE:
            membre.types_valides = []
        membre.save(update_fields=["role", "types_valides"])
        return Response(UserSerializer(membre).data)


class AdminSetValidationPermissionsView(APIView):
    """Super admin uniquement : attribue/révoque les types de documents
    qu'un admin a le droit d'approuver/rejeter (voir ROADMAP.md, item 5)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        if not request.user.is_superuser:
            return Response({"detail": "Réservé au super admin."}, status=status.HTTP_403_FORBIDDEN)

        try:
            membre = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if membre.role != RoleChoices.ADMIN:
            return Response({"detail": "Ce réglage ne s'applique qu'aux administrateurs."}, status=status.HTTP_400_BAD_REQUEST)

        types = request.data.get("types_valides", [])
        if not isinstance(types, list) or not all(t in TYPES_DOCUMENT_VALIDABLES for t in types):
            return Response({"types_valides": "Valeurs invalides."}, status=status.HTTP_400_BAD_REQUEST)

        membre.types_valides = types
        membre.save(update_fields=["types_valides"])
        return Response(UserSerializer(membre).data)


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
