from django.contrib.auth.backends import ModelBackend
from .models import User


class EmailBackend(ModelBackend):
    """Authentification par email (en plus de l'username standard)."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            return None
        except User.MultipleObjectsReturned:
            # Ne devrait plus arriver (email unique en base depuis la migration
            # 0004) mais une authentification ne doit jamais planter (500) quel
            # que soit l'etat des donnees — on prend le plus recent.
            user = User.objects.filter(email=username).order_by("-date_joined").first()
        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
