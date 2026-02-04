from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from erp_system.apps.property.models import Property, Unit, Tenant, Lease, Maintenance, Expense, Rent
from datetime import timedelta


class Command(BaseCommand):
    help = 'Seed the database with sample property management data'

    def handle(self, *args, **options):
        # Create a default user if not exists
        user, created = User.objects.get_or_create(
            username='admin',
            defaults={'email': 'admin@example.com', 'is_staff': True, 'is_superuser': True}
        )
        if created:
            user.set_password('admin123')
            user.save()
            self.stdout.write(self.style.SUCCESS('Created admin user'))

        # Create properties
        property1, _ = Property.objects.get_or_create(
            property_id='PROP001',
            defaults={
                'name': 'Downtown Office Complex',
                'street_address': '123 Main Street',
                'city': 'New York',
                'state': 'NY',
                'zip_code': '10001',
                'country': 'USA',
                'property_type': 'commercial',
                'number_of_units': 5,
                'owner': user,
                'description': 'Modern commercial office space with parking',
                'purchase_price': 5000000,
                'total_area': 15000,
                'acquisition_date': timezone.now().date(),
            }
        )

        property2, _ = Property.objects.get_or_create(
            property_id='PROP002',
            defaults={
                'name': 'Residential Apartment Building',
                'street_address': '456 Oak Avenue',
                'city': 'Los Angeles',
                'state': 'CA',
                'zip_code': '90001',
                'country': 'USA',
                'property_type': 'residential',
                'number_of_units': 10,
                'owner': user,
                'description': 'Beautiful residential building with amenities',
                'purchase_price': 3000000,
                'total_area': 8000,
                'acquisition_date': timezone.now().date(),
            }
        )

        property3, _ = Property.objects.get_or_create(
            property_id='PROP003',
            defaults={
                'name': 'Retail Shopping Center',
                'street_address': '789 Commerce Drive',
                'city': 'Chicago',
                'state': 'IL',
                'zip_code': '60601',
                'country': 'USA',
                'property_type': 'commercial',
                'number_of_units': 8,
                'owner': user,
                'description': 'Prime retail location with high foot traffic',
                'purchase_price': 4500000,
                'total_area': 20000,
                'acquisition_date': timezone.now().date(),
            }
        )

        # Create units
        unit1, _ = Unit.objects.get_or_create(
            property=property1,
            unit_number='101',
            defaults={
                'unit_type': 'office',
                'area': 1500,
                'status': 'occupied',
                'monthly_rent': 3000,
            }
        )

        unit2, _ = Unit.objects.get_or_create(
            property=property1,
            unit_number='102',
            defaults={
                'unit_type': 'office',
                'area': 1800,
                'status': 'vacant',
                'monthly_rent': 3500,
            }
        )

        unit3, _ = Unit.objects.get_or_create(
            property=property2,
            unit_number='201',
            defaults={
                'unit_type': 'apartment',
                'area': 950,
                'status': 'occupied',
                'monthly_rent': 2200,
            }
        )

        unit4, _ = Unit.objects.get_or_create(
            property=property2,
            unit_number='202',
            defaults={
                'unit_type': 'apartment',
                'area': 1100,
                'status': 'occupied',
                'monthly_rent': 2500,
            }
        )

        unit5, _ = Unit.objects.get_or_create(
            property=property3,
            unit_number='301',
            defaults={
                'unit_type': 'retail',
                'area': 2500,
                'status': 'occupied',
                'monthly_rent': 5000,
            }
        )

        # Create tenants
        tenant1, _ = Tenant.objects.get_or_create(
            first_name='John',
            last_name='Smith',
            defaults={
                'email': 'john.smith@example.com',
                'phone': '555-0101',
                'move_in_date': timezone.now().date(),
                'unit': unit1,
            }
        )

        tenant2, _ = Tenant.objects.get_or_create(
            first_name='Sarah',
            last_name='Johnson',
            defaults={
                'email': 'sarah.johnson@example.com',
                'phone': '555-0102',
                'move_in_date': timezone.now().date(),
                'unit': unit3,
            }
        )

        tenant3, _ = Tenant.objects.get_or_create(
            first_name='Michael',
            last_name='Brown',
            defaults={
                'email': 'michael.brown@example.com',
                'phone': '555-0103',
                'move_in_date': (timezone.now() - timedelta(days=180)).date(),
                'unit': unit4,
            }
        )

        # Create leases
        lease1, _ = Lease.objects.get_or_create(
            lease_number='LEASE001',
            defaults={
                'unit': unit1,
                'tenant': tenant1,
                'start_date': timezone.now().date(),
                'end_date': (timezone.now() + timedelta(days=365)).date(),
                'monthly_rent': 3000,
                'security_deposit': 6000,
                'status': 'active',
            }
        )

        lease2, _ = Lease.objects.get_or_create(
            lease_number='LEASE002',
            defaults={
                'unit': unit3,
                'tenant': tenant2,
                'start_date': timezone.now().date(),
                'end_date': (timezone.now() + timedelta(days=365)).date(),
                'monthly_rent': 2200,
                'security_deposit': 4400,
                'status': 'active',
            }
        )

        lease3, _ = Lease.objects.get_or_create(
            lease_number='LEASE003',
            defaults={
                'unit': unit4,
                'tenant': tenant3,
                'start_date': (timezone.now() - timedelta(days=180)).date(),
                'end_date': (timezone.now() + timedelta(days=185)).date(),
                'monthly_rent': 2500,
                'security_deposit': 5000,
                'status': 'active',
            }
        )

        # Create maintenance requests
        maintenance1, _ = Maintenance.objects.get_or_create(
            maintenance_id='MAINT001',
            defaults={
                'property': property1,
                'title': 'Air conditioning repair needed',
                'description': 'Air conditioning system not working properly',
                'priority': 'high',
                'status': 'pending',
                'estimated_cost': 1200,
            }
        )

        maintenance2, _ = Maintenance.objects.get_or_create(
            maintenance_id='MAINT002',
            defaults={
                'property': property2,
                'title': 'Plumbing issue in bathroom',
                'description': 'Leaking pipes need immediate attention',
                'priority': 'medium',
                'status': 'pending',
                'estimated_cost': 800,
            }
        )

        maintenance3, _ = Maintenance.objects.get_or_create(
            maintenance_id='MAINT003',
            defaults={
                'property': property3,
                'title': 'Parking lot resurfacing',
                'description': 'Parking lot needs new asphalt',
                'priority': 'low',
                'status': 'completed',
                'estimated_cost': 15000,
                'actual_cost': 14500,
                'completed_date': (timezone.now() - timedelta(days=10)).date(),
            }
        )

        # Create expenses
        expense1, _ = Expense.objects.get_or_create(
            expense_id='EXP001',
            defaults={
                'property': property1,
                'description': 'Monthly utilities',
                'expense_type': 'utilities',
                'amount': 850,
                'expense_date': timezone.now().date(),
            }
        )

        expense2, _ = Expense.objects.get_or_create(
            expense_id='EXP002',
            defaults={
                'property': property2,
                'description': 'Property insurance',
                'expense_type': 'insurance',
                'amount': 2500,
                'expense_date': timezone.now().date(),
            }
        )

        expense3, _ = Expense.objects.get_or_create(
            expense_id='EXP003',
            defaults={
                'property': property3,
                'description': 'Janitorial services',
                'expense_type': 'maintenance',
                'amount': 1200,
                'expense_date': timezone.now().date(),
            }
        )

        # Create rent records
        rent1, _ = Rent.objects.get_or_create(
            lease=lease1,
            rent_date=timezone.now().date(),
            defaults={
                'tenant': tenant1,
                'amount': 3000,
                'due_date': timezone.now().date(),
                'status': 'paid',
                'paid_date': timezone.now().date(),
            }
        )

        rent2, _ = Rent.objects.get_or_create(
            lease=lease2,
            rent_date=timezone.now().date(),
            defaults={
                'tenant': tenant2,
                'amount': 2200,
                'due_date': timezone.now().date(),
                'status': 'pending',
            }
        )

        rent3, _ = Rent.objects.get_or_create(
            lease=lease3,
            rent_date=(timezone.now() + timedelta(days=5)).date(),
            defaults={
                'tenant': tenant3,
                'amount': 2500,
                'due_date': (timezone.now() + timedelta(days=5)).date(),
                'status': 'pending',
            }
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded the database!'))
        self.stdout.write(self.style.SUCCESS(f'Created 3 properties, 5 units, 3 tenants, 3 leases'))
        self.stdout.write(self.style.SUCCESS(f'Created 3 maintenance requests, 3 expenses, and 3 rent records'))
