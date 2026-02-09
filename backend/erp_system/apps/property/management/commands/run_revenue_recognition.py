from django.core.management.base import BaseCommand
from django.utils import timezone
from erp_system.apps.property.services import LeaseRevenueRecognitionService


class Command(BaseCommand):
    help = 'Run monthly lease revenue recognition (unearned → income)'

    def add_arguments(self, parser):
        parser.add_argument('--date', type=str, help='Run date in YYYY-MM-DD format')

    def handle(self, *args, **options):
        run_date = None
        date_str = options.get('date')
        if date_str:
            run_date = timezone.datetime.strptime(date_str, '%Y-%m-%d').date()

        LeaseRevenueRecognitionService.run_monthly_recognition(run_date=run_date)
        self.stdout.write(self.style.SUCCESS('Lease revenue recognition completed.'))
