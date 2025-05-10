from django.urls import path
from .views import add_group, group_info, user_activity

urlpatterns = [
    path('add_group/', add_group, name='add_group'),
    path('group_info/<int:group_id>/', group_info, name='group_info'),
    path('group_info/<int:group_id>/user_activity/<int:user_id>/', user_activity, name='user_activity'),
]