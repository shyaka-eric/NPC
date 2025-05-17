from django.core.management.base import BaseCommand
from api.models import IssuedItem
from django.db import transaction

def get_abbreviation(text):
    return ''.join(word[0].upper() for word in text.split() if word)

def generate_serial_number(unit, category, item_name, item_number):
    return f"NPC/{unit}/{get_abbreviation(category)}/{get_abbreviation(item_name)}/{item_number:03d}"

class Command(BaseCommand):
    help = 'Populate unique serial numbers for all existing IssuedItem records.'

    @transaction.atomic
    def handle(self, *args, **kwargs):
        issued_items = IssuedItem.objects.all().order_by('id')
        serials = set()
        for item in issued_items:
            unit = item.assigned_to.unit or 'UNK'
            category = item.item.category or 'UNK'
            item_name = item.item.name or 'UNK'
            # Count how many items with same category and name already have serials
            existing_count = IssuedItem.objects.filter(
                item__category=category,
                item__name=item_name
            ).exclude(serial_number__isnull=True).count() + 1
            serial_number = generate_serial_number(unit, category, item_name, existing_count)
            # Ensure uniqueness
            while serial_number in serials or IssuedItem.objects.filter(serial_number=serial_number).exists():
                existing_count += 1
                serial_number = generate_serial_number(unit, category, item_name, existing_count)
            item.serial_number = serial_number
            item.save()
            serials.add(serial_number)
            self.stdout.write(self.style.SUCCESS(f"Set serial number for IssuedItem {item.id}: {serial_number}"))
        self.stdout.write(self.style.SUCCESS("All IssuedItem records have unique serial numbers."))
