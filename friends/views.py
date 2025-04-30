from django.shortcuts import render

def add_button_view(request):
    if request.user.is_authenticated:
        return render(request, 'add_button.html')
    else:
        return render(request, 'login.html')
    
def new_contact(request):
    pass