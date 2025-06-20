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
        return JsonResponse({
            'message': 'Welcome to the NPC API',
            'documentation': {
                'api-docs': 'https://logistics-backend-qh1y.onrender.com/api/docs/',
                'api-swagger': 'https://logistics-backend-qh1y.onrender.com/api/swagger/'
            }
        })
    
    return JsonResponse({"error": "Method not allowed"}, status=405)
