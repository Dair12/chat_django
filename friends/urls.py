from django.urls import path
from .views import add_button_view, new_contact

urlpatterns = [
    path('add_button/', add_button_view, name='add_button'),
    path('new_contact/', new_contact, name='new_contact'),
]