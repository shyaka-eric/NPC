from django.http import JsonResponse
from django.views.generic import TemplateView

class APIWelcomeView(TemplateView):
    template_name = 'api_welcome.html'

def api_welcome(request):
    return JsonResponse({
        'message': 'Welcome to the Logistics API',
        'documentation': {
            'api': 'https://logistics-backend-qh1y.onrender.com/api/',
            'endpoints': {
                'auth': 'https://logistics-backend-qh1y.onrender.com/api/auth/',
                'users': 'https://logistics-backend-qh1y.onrender.com/api/users/',
                # Add more endpoints as needed
            }
        }
    })
