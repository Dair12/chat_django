from django.urls import path
from .views import add_group, group_info

urlpatterns = [
    path('add_group/', add_group, name='add_group'),
    path('group_info/<int:group_id>/', group_info, name='group_info'),
]