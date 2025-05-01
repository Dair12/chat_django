from django.shortcuts import render

def add_group(request):
    if request.user.is_authenticated:
        return render(request, 'add_group.html')
    else:
        return render(request, 'login.html')