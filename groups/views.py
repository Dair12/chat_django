from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from .models import Group, GroupMember, GroupActivity
from django.contrib.auth.models import User
from friends.models import Friend
from chat.models import Message
from django.db.models import Count, Sum, Avg
from django.db.models.functions import TruncDate
import json
from datetime import datetime, timedelta

@csrf_exempt
@login_required
def add_group(request):
    if request.method == 'GET':
        friends = Friend.objects.filter(owner=request.user).select_related('contact')
        return render(request, 'add_group.html', {'friends': friends})
    
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            group_name = data.get('group_name')
            member_usernames = data.get('members', [])
            if not group_name:
                return JsonResponse({'success': False, 'errors': 'Group name is required'})
            group = Group.objects.create(name=group_name, owner=request.user)
            GroupMember.objects.create(group=group, user=request.user)
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
    if not GroupMember.objects.filter(group=group, user=request.user).exists():
        return redirect('home')
    if request.method == 'GET':
        members = GroupMember.objects.filter(group=group).select_related('user')
        context = {
            'group': group,
            'members': members,
            'user': request.user,
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

    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=6)

    # Messages
    total_messages = Message.objects.filter(
        group=group, sender=user, created_at__date__gte=start_date, created_at__date__lte=end_date
    ).count()
    daily_messages = (
        Message.objects.filter(
            group=group, sender=user, created_at__date__gte=start_date, created_at__date__lte=end_date
        )
        .annotate(date=TruncDate('created_at'))
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )
    message_date_counts = {str(item['date']): item['count'] for item in daily_messages}
    labels = [(start_date + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(7)]
    message_data = [message_date_counts.get(label, 0) for label in labels]
    average_messages = sum(message_data) / 7 if message_data else 0

    # Time
    total_duration = GroupActivity.objects.filter(
        group=group, user=user, start_time__date__gte=start_date, start_time__date__lte=end_date, duration__isnull=False
    ).aggregate(total=Sum('duration'))['total'] or timedelta(seconds=0)
    total_duration_minutes = total_duration.total_seconds() / 60
    daily_duration = (
        GroupActivity.objects.filter(
            group=group, user=user, start_time__date__gte=start_date, start_time__date__lte=end_date, duration__isnull=False
        )
        .annotate(date=TruncDate('start_time'))
        .values('date')
        .annotate(total_duration=Sum('duration'))
        .order_by('date')
    )
    time_date_durations = {str(item['date']): item['total_duration'].total_seconds() / 60 for item in daily_duration}
    time_data = [time_date_durations.get(label, 0) for label in labels]
    average_time = sum(time_data) / 7 if time_data else 0

    # Attendance
    daily_attendance = (
        GroupActivity.objects.filter(
            group=group, user=user, start_time__date__gte=start_date, start_time__date__lte=end_date
        )
        .annotate(date=TruncDate('start_time'))
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )
    attendance_date_counts = {str(item['date']): item['count'] for item in daily_attendance}
    attendance_data = [attendance_date_counts.get(label, 0) for label in labels]
    average_attendance = sum(attendance_data) / 7 if attendance_data else 0
    total_attendance = sum(attendance_data)

    # Average session duration
    session_durations = GroupActivity.objects.filter(
        group=group, user=user, start_time__date__gte=start_date, start_time__date__lte=end_date, duration__isnull=False
    ).aggregate(avg_duration=Avg('duration'))['avg_duration'] or timedelta(seconds=0)
    average_session_duration = session_durations.total_seconds() / 60 if session_durations else 0

    # Interest as slope of time trend (linear regression)
    x_vals = list(range(7))
    y_vals = time_data
    n = len(x_vals)
    sum_x = sum(x_vals)
    sum_y = sum(y_vals)
    sum_x2 = sum(x**2 for x in x_vals)
    sum_xy = sum(x * y for x, y in zip(x_vals, y_vals))
    denominator = n * sum_x2 - sum_x ** 2
    if denominator == 0:
        interest = 0
    else:
        k = (n * sum_xy - sum_x * sum_y) / denominator
        interest = k

    # Activity Indicator: Messages per minute
    if total_duration_minutes > 0:
        messages_per_minute = total_messages / total_duration_minutes
    else:
        messages_per_minute = float('inf') if total_messages > 0 else 0

    # Categorize user activity
    if messages_per_minute > 0.5:  # More than 0.5 messages per minute
        activity_type = 'Active Communicator'
    elif messages_per_minute < 0.1 and total_duration_minutes > 0:  # Less than 0.1 messages per minute, with some time spent
        activity_type = 'Passive Reader'
    else:
        activity_type = 'Balanced'

    context = {
        'group': group,
        'username': user.username,
        'total_messages': total_messages,
        'total_duration': total_duration_minutes,
        'total_attendance': total_attendance,
        'average_messages': average_messages,
        'average_time': average_time,
        'average_attendance': average_attendance,
        'average_session_duration': average_session_duration,
        'interest': interest,
        'activity_type': activity_type,
        'graph_data': json.dumps({
            'labels': labels,
            'messages': message_data,
            'minutes': time_data,
            'attendance': attendance_data
        })
    }
    return render(request, 'user_activity.html', context)

@login_required
def group_activity(request, group_id):
    group = get_object_or_404(Group, id=group_id)
    if not GroupMember.objects.filter(group=group, user=request.user).exists():
        return redirect('home')

    members = GroupMember.objects.filter(group=group).select_related('user')
    member_ids = members.values_list('user_id', flat=True)
    num_members = members.count()

    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=6)

    # Messages
    total_messages = Message.objects.filter(
        group=group, sender__in=member_ids, created_at__date__gte=start_date, created_at__date__lte=end_date
    ).count()
    daily_messages = (
        Message.objects.filter(
            group=group, sender__in=member_ids, created_at__date__gte=start_date, created_at__date__lte=end_date
        )
        .annotate(date=TruncDate('created_at'))
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )
    message_date_counts = {str(item['date']): item['count'] for item in daily_messages}
    labels = [(start_date + timedelta(days=i)).strftime('%Y-%m-%d') for i in range(7)]
    message_data = [message_date_counts.get(label, 0) / num_members for label in labels]
    average_messages = sum(message_data) / 7 if message_data else 0

    # Time
    total_duration = GroupActivity.objects.filter(
        group=group, user__in=member_ids, start_time__date__gte=start_date, start_time__date__lte=end_date, duration__isnull=False
    ).aggregate(total=Sum('duration'))['total'] or timedelta(seconds=0)
    total_duration_minutes = total_duration.total_seconds() / 60 / num_members
    daily_duration = (
        GroupActivity.objects.filter(
            group=group, user__in=member_ids, start_time__date__gte=start_date, start_time__date__lte=end_date, duration__isnull=False
        )
        .annotate(date=TruncDate('start_time'))
        .values('date')
        .annotate(total_duration=Sum('duration'))
        .order_by('date')
    )
    time_date_durations = {str(item['date']): item['total_duration'].total_seconds() / 60 / num_members for item in daily_duration}
    time_data = [time_date_durations.get(label, 0) for label in labels]
    average_time = sum(time_data) / 7 if time_data else 0

    # Attendance
    daily_attendance = (
        GroupActivity.objects.filter(
            group=group, user__in=member_ids, start_time__date__gte=start_date, start_time__date__lte=end_date
        )
        .annotate(date=TruncDate('start_time'))
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )
    attendance_date_counts = {str(item['date']): item['count'] / num_members for item in daily_attendance}
    attendance_data = [attendance_date_counts.get(label, 0) for label in labels]
    average_attendance = sum(attendance_data) / 7 if attendance_data else 0
    total_attendance = sum(attendance_data)

    # Average session duration
    session_durations = GroupActivity.objects.filter(
        group=group, user__in=member_ids, start_time__date__gte=start_date, start_time__date__lte=end_date, duration__isnull=False
    ).aggregate(avg_duration=Avg('duration'))['avg_duration'] or timedelta(seconds=0)
    average_session_duration = session_durations.total_seconds() / 60 if session_durations else 0

    # Interest as slope of time trend (linear regression)
    x_vals = list(range(7))
    y_vals = time_data
    n = len(x_vals)
    sum_x = sum(x_vals)
    sum_y = sum(y_vals)
    sum_x2 = sum(x**2 for x in x_vals)
    sum_xy = sum(x * y for x, y in zip(x_vals, y_vals))
    denominator = n * sum_x2 - sum_x ** 2
    if denominator == 0:
        interest = 0
    else:
        k = (n * sum_xy - sum_x * sum_y) / denominator
        interest = k

    # Activity Types
    activity_types = {'Active_Communicator': 0, 'Passive_Reader': 0, 'Balanced': 0}
    for user in members.values('user'):
        user_id = user['user']
        user_total_messages = Message.objects.filter(
            group=group, sender_id=user_id, created_at__date__gte=start_date, created_at__date__lte=end_date
        ).count()
        user_total_duration = GroupActivity.objects.filter(
            group=group, user_id=user_id, start_time__date__gte=start_date, start_time__date__lte=end_date, duration__isnull=False
        ).aggregate(total=Sum('duration'))['total'] or timedelta(seconds=0)
        user_total_duration_minutes = user_total_duration.total_seconds() / 60
        if user_total_duration_minutes > 0:
            messages_per_minute = user_total_messages / user_total_duration_minutes
        else:
            messages_per_minute = float('inf') if user_total_messages > 0 else 0
        if messages_per_minute > 0.5:
            activity_types['Active_Communicator'] += 1
        elif messages_per_minute < 0.1 and user_total_duration_minutes > 0:
            activity_types['Passive_Reader'] += 1
        else:
            activity_types['Balanced'] += 1

    context = {
        'group': group,
        'total_messages': total_messages / num_members,
        'total_duration': total_duration_minutes,
        'total_attendance': total_attendance,
        'average_messages': average_messages,
        'average_time': average_time,
        'average_attendance': average_attendance,
        'average_session_duration': average_session_duration,
        'interest': interest,
        'activity_types': activity_types,
        'graph_data': json.dumps({
            'labels': labels,
            'messages': message_data,
            'minutes': time_data,
            'attendance': attendance_data
        })
    }
    return render(request, 'group_activity.html', context)