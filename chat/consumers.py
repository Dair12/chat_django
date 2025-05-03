import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from .models import Message
from groups.models import Group, GroupMember
from friends.models import Friend
from django.utils import timezone

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_type = self.scope['url_route']['kwargs']['chat_type']
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.room_group_name = f"chat_{self.chat_type}_{self.chat_id}"

        if not await self.is_authorized():
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        action = data.get('action')

        if action == 'send':
            await self.handle_send(data)
        elif action == 'edit':
            await self.handle_edit(data)
        elif action == 'delete':
            await self.handle_delete(data)
        elif action == 'read':
            await self.handle_read(data)

    async def handle_send(self, data):
        content = data.get('content')
        if not content:
            return

        message = await self.create_message(content)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'action': 'send',
                'message': {
                    'id': message.id,
                    'sender': message.sender.username,
                    'content': message.content,
                    'created_at': message.created_at.isoformat(),
                    'is_read': message.is_read,
                }
            }
        )

    async def handle_edit(self, data):
        message_id = data.get('message_id')
        content = data.get('content')
        if not message_id or not content:
            return

        message = await self.update_message(message_id, content)
        if message:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'action': 'edit',
                    'message': {
                        'id': message.id,
                        'content': message.content,
                        'updated_at': message.updated_at.isoformat(),
                    }
                }
            )

    async def handle_delete(self, data):
        message_id = data.get('message_id')
        if not message_id:
            return

        if await self.delete_message(message_id):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'action': 'delete',
                    'message_id': message_id,
                }
            )

    async def handle_read(self, data):
        message_id = data.get('message_id')
        if not message_id:
            return

        if await self.mark_message_read(message_id):
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'action': 'read',
                    'message_id': message_id,
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def is_authorized(self):
        user = self.scope['user']
        if not user.is_authenticated:
            return False

        if self.chat_type == 'group':
            return GroupMember.objects.filter(group_id=self.chat_id, user=user).exists()
        elif self.chat_type == 'user':
            return user.id == int(self.chat_id) or Friend.objects.filter(owner=user, contact_id=self.chat_id).exists()
        return False

    @database_sync_to_async
    def create_message(self, content):
        user = self.scope['user']
        message = Message(sender=user, content=content)
        if self.chat_type == 'group':
            message.group_id = self.chat_id
        elif self.chat_type == 'user':
            message.recipient_id = self.chat_id
        message.save()
        return message

    @database_sync_to_async
    def update_message(self, message_id, content):
        user = self.scope['user']
        try:
            message = Message.objects.get(id=message_id, sender=user)
            message.content = content
            message.updated_at = timezone.now()
            message.save()
            return message
        except Message.DoesNotExist:
            return None

    @database_sync_to_async
    def delete_message(self, message_id):
        user = self.scope['user']
        try:
            message = Message.objects.get(id=message_id, sender=user)
            message.delete()
            return True
        except Message.DoesNotExist:
            return False

    @database_sync_to_async
    def mark_message_read(self, message_id):
        user = self.scope['user']
        try:
            message = Message.objects.get(id=message_id)
            if (self.chat_type == 'group' and message.group_id == int(self.chat_id) and
                GroupMember.objects.filter(group_id=self.chat_id, user=user).exists()) or \
               (self.chat_type == 'user' and message.recipient_id == user.id):
                message.is_read = True
                message.save()
                return True
            return False
        except Message.DoesNotExist:
            return False