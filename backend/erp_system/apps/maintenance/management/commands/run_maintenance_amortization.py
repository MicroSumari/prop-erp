from django.core.management.base import BaseCommand
from django.utils import timezone
from erp_system.apps.maintenance.services import MaintenanceAmortizationService


class Command(BaseCommand):
    help = 'Run monthly maintenance contract amortization'

    def handle(self, *args, **options):
        run_date = timezone.now().date()
        MaintenanceAmortizationService.run_monthly_amortization(run_date=run_date)
        self.stdout.write(self.style.SUCCESS('Maintenance amortization completed.'))
