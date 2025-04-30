from django.urls import path
from .views import register_view, login_view, home_view

urlpatterns = [
    path('register/', register_view, name='register'),
    path('', login_view, name='login'),
    path('home/', home_view, name='home'),
]