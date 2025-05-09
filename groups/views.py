from django.shortcuts import render
from friends.models import Friend
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import Group, GroupMember
from django.views.decorators.csrf import csrf_exempt
import json

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
                    # Verify that the user is a friend
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
