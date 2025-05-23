from .models import Log

def log_action(user, action, details):
    Log.objects.create(user=user, action=action, details=details)
