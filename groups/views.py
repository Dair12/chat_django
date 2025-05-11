from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from .models import Group, GroupMember, GroupActivity
from django.contrib.auth.models import User
from friends.models import Friend
from chat.models import Message
from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
import json
from datetime import datetime, timedelta

@csrf_exempt
@login_required
def add_group(request):
    if request.method == 'GET':
        # Fetch all friends of the authenticated user
        friends = Friend.objects.filter(owner=request.user).select_related('contact')
        return render(request, 'add_group.html', {'friends': friends})
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            group_name = data.get('group_name')
            member_usernames = data.get('members', [])

            if not group_name:
                return JsonResponse({'success': False, 'errors': 'Group name is required'})

            # Create the group
            group = Group.objects.create(name=group_name, owner=request.user)

            # Add the owner as a member
            GroupMember.objects.create(group=group, user=request.user)

            # Add selected friends as members
            for username in member_usernames:
                try:
                    user = User.objects.get(username=username)
                    if Friend.objects.filter(owner=request.user, contact=user).exists():
                        GroupMember.objects.create(group=group, user=user)
                    else:
                        return JsonResponse({'success': False, 'errors': f'{username} is not your friend'})
                except User.DoesNotExist:
                    return JsonResponse({'success': False, 'errors': f'User {username} not found'})

            return JsonResponse({'success': True, 'redirect_url': '/home/'})
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'errors': 'Invalid data'})
        except Exception as e:
            return JsonResponse({'success': False, 'errors': str(e)})

    return JsonResponse({'success': False, 'errors': 'Invalid request method'})

@csrf_exempt
@login_required
def group_info(request, group_id):
    group = get_object_or_404(Group, id=group_id)
    # Check if the user is a member of the group
    if not GroupMember.objects.filter(group=group, user=request.user).exists():
        return redirect('home')  # Redirect if not a member

    if request.method == 'GET':
        members = GroupMember.objects.filter(group=group).select_related('user')
        context = {
            'group': group,
            'members': members,
            'user': request.user,  # Pass current user for owner check
        }
        return render(request, 'group_info.html', context)

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            action = data.get('action')

            if action == 'rename' and group.owner == request.user:
                new_name = data.get('name')
                if new_name:
                    group.name = new_name
                    group.save()
                    return JsonResponse({'success': True})
                else:
                    return JsonResponse({'success': False, 'error': 'Name cannot be empty'})
            
            elif action == 'exit':
                GroupMember.objects.filter(group=group, user=request.user).delete()
                return JsonResponse({'success': True, 'redirect_url': '/home/'})
            
            else:
                return JsonResponse({'success': False, 'error': 'Invalid action or permission denied'})
        except json.JSONDecodeError:
            return JsonResponse({'success': False, 'error': 'Invalid JSON'})

@csrf_exempt
@login_required
def user_activity(request, group_id, user_id):
    group = get_object_or_404(Group, id=group_id)

    if group.owner != request.user:
        return redirect('group_info', group_id=group_id)

    user = get_object_or_404(User, id=user_id)

    if not GroupMember.objects.filter(group=group, user=user).exists():
        return redirect('group_info', group_id=group_id)

    # Сообщения
    total_messages = Message.objects.filter(group=group, sender=user).count()
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=6)
    daily_messages = (
        Message.objects.filter(
            group=group,
            sender=user,
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        )
        .annotate(date=TruncDate('created_at'))
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )
    message_date_counts = {str(item['date']): item['count'] for item in daily_messages}
    labels = [(start_date + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(7)]
    message_data = [message_date_counts.get(label, 0) for label in labels]

    # Время (в минутах)
    total_duration = GroupActivity.objects.filter(
        group=group, user=user, duration__isnull=False
    ).aggregate(total=Sum('duration'))['total'] or timedelta(seconds=0)
    daily_duration = (
        GroupActivity.objects.filter(
            group=group,
            user=user,
            start_time__date__gte=start_date,
            start_time__date__lte=end_date,
            duration__isnull=False
        )
        .annotate(date=TruncDate('start_time'))
        .values('date')
        .annotate(total_duration=Sum('duration'))
        .order_by('date')
    )
    time_date_durations = {str(item['date']): item['total_duration'].total_seconds() / 60 for item in daily_duration}  # В минутах
    time_data = [time_date_durations.get(label, 0) for label in labels]

    # Посещаемость (количество сеансов в день)
    daily_attendance = (
        GroupActivity.objects.filter(
            group=group,
            user=user,
            start_time__date__gte=start_date,
            start_time__date__lte=end_date
        )
        .annotate(date=TruncDate('start_time'))
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )
    attendance_date_counts = {str(item['date']): item['count'] for item in daily_attendance}
    attendance_data = [attendance_date_counts.get(label, 0) for label in labels]

    context = {
        'group': group,
        'username': user.username,
        'total_messages': total_messages,
        'total_duration': total_duration.total_seconds() / 60,  # В минутах
        'graph_data': json.dumps({
            'labels': labels,
            'messages': message_data,
            'minutes': time_data,
            'attendance': attendance_data
        })
    }
    return render(request, 'user_activity.html', context)