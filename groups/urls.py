from django.urls import path
from .views import add_group

urlpatterns = [
    path('add_group/', add_group, name='add_group'),
]