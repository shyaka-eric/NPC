from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import authenticate

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
