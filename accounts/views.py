from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.views import LoginView
from django.http import JsonResponse, HttpResponseBadRequest
from .forms import CustomUserCreationForm
from django.contrib.auth import authenticate, login
from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import render
from friends.models import Friend
from groups.models import Group

def register_view(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            return JsonResponse({'success': True, 'redirect_url': '/'})
        else:
            errors = []
            for field, messages in form.errors.items():
                for message in messages:
                    errors.append(f"{field}: {message}")
            return JsonResponse({'success': False, 'errors': errors})
    
    elif request.method == 'GET':
        return render(request, 'register.html')
    
    return HttpResponseBadRequest("Method not allowed")

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return JsonResponse({'success': True, 'redirect_url': '/home/'})
        else:
            return JsonResponse({'success': False, 'errors': ['Invalid username or password.']})
    
    elif request.method == 'GET':
        return render(request, 'login.html')
    
    return HttpResponseBadRequest("Method not allowed")

def home_view(request):
    if request.user.is_authenticated:
        friends = Friend.objects.filter(owner=request.user).select_related('contact')
        groups = Group.objects.filter(members__user=request.user).distinct()
        return render(request, 'home.html', {'friends': friends, 'groups': groups})
    else:
        return render(request, 'login.html')