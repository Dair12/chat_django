from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from .models import Friend

def add_button_view(request):
    if request.user.is_authenticated:
        return render(request, 'add_button.html')
    else:
        return render(request, 'login.html')

@login_required
def new_contact(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        try:
            contact_user = User.objects.get(username=username)
            if contact_user == request.user:
                return JsonResponse({'success': False, 'errors': {'username': "You can't add yourself"}})

            # Проверяем, не добавлен ли уже
            exists = Friend.objects.filter(owner=request.user, contact=contact_user).exists()
            if exists:
                return JsonResponse({'success': False, 'errors': {'username': "Contact already exists"}})

            Friend.objects.create(owner=request.user, contact=contact_user)
            return JsonResponse({'success': True, 'redirect_url': '/home/'})
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'errors': {'username': "User not found"}})

    return render(request, 'new_contact.html')
