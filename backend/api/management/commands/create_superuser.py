from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.contrib.auth.hashers import make_password

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates a superuser non-interactively if it doesn\'t exist'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting superuser creation process...'))
        
        if not settings.SUPERUSER_PASSWORD:
            raise ImproperlyConfigured('SUPERUSER_PASSWORD environment variable is not set')
        else:
            self.stdout.write(self.style.NOTICE(f'SUPERUSER_PASSWORD is set: {"Yes" if settings.SUPERUSER_PASSWORD else "No"}'))
            
        if not User.objects.filter(username='fatman').exists():
            try:
                self.stdout.write(self.style.NOTICE('Creating superuser...'))
                # Create superuser with properly hashed password
                user = User.objects.create(
                    username='fatman',
                    email='kezafatman@gmail.com',
                    is_superuser=True,
                    is_staff=True,
                    is_active=True
                )
                user.set_password(settings.SUPERUSER_PASSWORD)
                user.save()
                
                self.stdout.write(self.style.SUCCESS('Superuser created successfully'))
                self.stdout.write(self.style.NOTICE('Superuser details:'))
                self.stdout.write(self.style.NOTICE(f'Username: fatman'))
                self.stdout.write(self.style.NOTICE(f'Email: kezafatman@gmail.com'))
                self.stdout.write(self.style.NOTICE(f'Is superuser: {user.is_superuser}'))
                self.stdout.write(self.style.NOTICE(f'Is staff: {user.is_staff}'))
                self.stdout.write(self.style.NOTICE(f'Is active: {user.is_active}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating superuser: {str(e)}'))
                raise
        else:
            self.stdout.write(self.style.NOTICE('Superuser already exists'))
            user = User.objects.get(username='fatman')
            self.stdout.write(self.style.NOTICE('Superuser details:'))
            self.stdout.write(self.style.NOTICE(f'Username: {user.username}'))
            self.stdout.write(self.style.NOTICE(f'Email: {user.email}'))
            self.stdout.write(self.style.NOTICE(f'Is superuser: {user.is_superuser}'))
            self.stdout.write(self.style.NOTICE(f'Is staff: {user.is_staff}'))
            self.stdout.write(self.style.NOTICE(f'Is active: {user.is_active}'))
            
            # Update password if it's different
            if not user.check_password(settings.SUPERUSER_PASSWORD):
                self.stdout.write(self.style.NOTICE('Updating password...'))
                user.set_password(settings.SUPERUSER_PASSWORD)
                user.save()
                self.stdout.write(self.style.SUCCESS('Password updated successfully'))
