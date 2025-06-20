from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model

User = get_user_model()

class LoginDebugMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.path == '/admin/login/' and request.method == 'POST':
            username = request.POST.get('username', '')
            password = request.POST.get('password', '')
            user = authenticate(request, username=username, password=password)
            if user is None:
                print(f"Login attempt failed for username: {username}")
                print(f"Password length: {len(password)}")
                print(f"User exists: {User.objects.filter(username=username).exists()}")
                print(f"User is active: {User.objects.filter(username=username).first().is_active if User.objects.filter(username=username).exists() else False}")
                print(f"User is superuser: {User.objects.filter(username=username).first().is_superuser if User.objects.filter(username=username).exists() else False}")
                print(f"Password check: {User.objects.filter(username=username).first().check_password(password) if User.objects.filter(username=username).exists() else False}")
