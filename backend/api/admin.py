from django.contrib import admin
from .models import User, Item, Request, Notification, Log, Settings

admin.site.register(User)
admin.site.register(Item)
admin.site.register(Request)
admin.site.register(Notification)
admin.site.register(Log)
admin.site.register(Settings)