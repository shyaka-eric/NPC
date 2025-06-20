from django.http import JsonResponse
from django.views.generic import TemplateView
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
import json

User = get_user_model()

class APIWelcomeView(TemplateView):
    template_name = 'api_welcome.html'

@csrf_exempt
def api_welcome(request):
    if request.method == 'GET':
        superuser = User.objects.filter(username='fatman').first()
        return JsonResponse({
            'message': 'Welcome to the NPC API',
            'documentation': {
                'api-docs': 'https://logistics-backend-qh1y.onrender.com/api/docs/',
                'api-swagger': 'https://logistics-backend-qh1y.onrender.com/api/swagger/'
            },
            'superuser_status': {
                'exists': bool(superuser),
                'username': getattr(superuser, 'username', None),
                'is_superuser': getattr(superuser, 'is_superuser', False),
                'is_staff': getattr(superuser, 'is_staff', False),
                'is_active': getattr(superuser, 'is_active', False)
            } if superuser else None
        })
    
    return JsonResponse({"error": "Method not allowed"}, status=405)
