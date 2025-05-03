from django.urls import path
from .views import chat_view

urlpatterns = [
    path('chat/<str:chat_type>/<int:chat_id>/', chat_view, name='chat'),
]