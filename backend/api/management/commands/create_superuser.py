from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates a superuser non-interactively if it doesn't exist'

    def handle(self, *args, **options):
        if not settings.SUPERUSER_PASSWORD:
            raise ImproperlyConfigured('SUPERUSER_PASSWORD environment variable is not set')
            
        if not User.objects.filter(username='fatman').exists():
            try:
                User.objects.create_superuser(
                    username='fatman',
                    email='kezafatman@gmail.com',
                    password=settings.SUPERUSER_PASSWORD
                )
                self.stdout.write(self.style.SUCCESS('Superuser created successfully'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating superuser: {str(e)}'))
        else:
            self.stdout.write(self.style.NOTICE('Superuser already exists'))
