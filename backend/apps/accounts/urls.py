from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path("auth/token/",                   views.LoginView.as_view(),               name="token_obtain"),
    path("auth/token/refresh/",           TokenRefreshView.as_view(),              name="token_refresh"),
    path("auth/logout/",                  views.LogoutView.as_view(),              name="logout"),
    path("auth/register/",                views.RegisterView.as_view(),            name="register"),
    path("auth/me/",                      views.ProfileView.as_view(),             name="profile"),
    path("auth/password-reset/",          views.PasswordResetRequestView.as_view(), name="password_reset"),
    path("auth/password-reset/confirm/",  views.PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    path("auth/change-password/",         views.ChangePasswordView.as_view(),      name="change_password"),
    path("membres/",                      views.MembresListView.as_view(),         name="membres"),
    path("membres/<uuid:user_id>/set-password/", views.AdminSetPasswordView.as_view(), name="admin_set_password"),
]
