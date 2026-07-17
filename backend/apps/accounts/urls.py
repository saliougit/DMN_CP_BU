from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path("auth/token/",         TokenObtainPairView.as_view(), name="token_obtain"),
    path("auth/token/refresh/", TokenRefreshView.as_view(),   name="token_refresh"),
    path("auth/logout/",        views.LogoutView.as_view(),   name="logout"),
    path("auth/register/",      views.RegisterView.as_view(), name="register"),
    path("auth/me/",            views.ProfileView.as_view(),  name="profile"),
]
