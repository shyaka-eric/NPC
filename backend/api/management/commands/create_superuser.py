from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

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
                User.objects.create_superuser(
                    username='fatman',
                    email='kezafatman@gmail.com',
                    password=settings.SUPERUSER_PASSWORD
                )
                self.stdout.write(self.style.SUCCESS('Superuser created successfully'))
                self.stdout.write(self.style.NOTICE('Superuser details:'))
                self.stdout.write(self.style.NOTICE(f'Username: fatman'))
                self.stdout.write(self.style.NOTICE(f'Email: kezafatman@gmail.com'))
                self.stdout.write(self.style.NOTICE('Password: (set from environment variable)'))
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
            self.stdout.write(self.style.NOTICE(f'Is active: {user.is_active}'))
