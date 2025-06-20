from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class LoginDebugMiddleware(MiddlewareMixin):
    def process_view(self, request, view_func, view_args, view_kwargs):
        if request.path == '/admin/login/' and request.method == 'POST':
            username = request.POST.get('username', '')
            password = request.POST.get('password', '')
            
            # Log the login attempt
            logger.info(f"Login attempt for username: {username}")
            logger.info(f"Password length: {len(password)}")
            
            # Check if user exists
            user_exists = User.objects.filter(username=username).exists()
            logger.info(f"User exists: {user_exists}")
            
            if user_exists:
                user = User.objects.get(username=username)
                logger.info(f"User is active: {user.is_active}")
                logger.info(f"User is superuser: {user.is_superuser}")
                logger.info(f"User is staff: {user.is_staff}")
                
                # Check password
                password_matches = user.check_password(password)
                logger.info(f"Password check: {password_matches}")
                
                if not password_matches:
                    logger.info("Password does not match")
            else:
                logger.info("User does not exist in database")
            
            return None
