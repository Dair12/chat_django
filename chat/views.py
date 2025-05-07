from django.http import HttpResponseBadRequest
from django.shortcuts import render
from groups.models import Group
from friends.models import Friend
from .models import Message
from django.db import models

def chat_view(request, chat_type, chat_id):
    if not request.user.is_authenticated:
        return render(request, 'login.html')
    
    if chat_type == 'group':
        try:
            group = Group.objects.get(id=chat_id, members__user=request.user)
            messages = Message.objects.filter(group_id=chat_id).order_by('created_at')
            return render(request, 'chat.html', {'chat_type': chat_type, 'chat_id': chat_id, 'messages': messages, 'chat_name': group.name, 'user': request.user})
        except Group.DoesNotExist:
            return HttpResponseBadRequest("Group not found or you are not a member")
    elif chat_type == 'user':
        try:
            friend = Friend.objects.get(owner=request.user, contact_id=chat_id)
            messages = Message.objects.filter(
                models.Q(sender=request.user, recipient_id=chat_id) |
                models.Q(sender_id=chat_id, recipient=request.user)
            ).order_by('created_at')
            return render(request, 'chat.html', {'chat_type': chat_type, 'chat_id': chat_id, 'messages': messages, 'chat_name': friend.contact.username, 'user': request.user})
        except Friend.DoesNotExist:
            return HttpResponseBadRequest("Friend not found")
    return HttpResponseBadRequest("Invalid chat type")