from django.core.management.base import BaseCommand
from erp_system.apps.accounts.models import Account, CostCenter


class Command(BaseCommand):
    help = 'Seed comprehensive chart of accounts for property management and leasing'

    def handle(self, *args, **options):
        seeded_any = False

        if Account.objects.count() < 15:
            seed_accounts = [
                # Maintenance Accounts
                {
                    'account_number': '1000',
                    'account_name': 'Prepaid Maintenance Expense',
                    'account_type': 'asset',
                },
                {
                    'account_number': '6000',
                    'account_name': 'Maintenance Expense',
                    'account_type': 'expense',
                },
                {
                    'account_number': '2000',
                    'account_name': 'Maintenance Supplier Payable',
                    'account_type': 'liability',
                },
                
                # Leasing Accounts
                {
                    'account_number': '1100',
                    'account_name': 'Tenant Receivable (Customer Account)',
                    'account_type': 'asset',
                },
                {
                    'account_number': '2100',
                    'account_name': 'Unearned Lease Revenue',
                    'account_type': 'liability',
                },
                {
                    'account_number': '2200',
                    'account_name': 'Refundable Security Deposits',
                    'account_type': 'liability',
                },
                {
                    'account_number': '4000',
                    'account_name': 'Lease Revenue / Rent Income',
                    'account_type': 'income',
                },
                {
                    'account_number': '4100',
                    'account_name': 'Other Tenant Charges',
                    'account_type': 'income',
                },
                {
                    'account_number': '4200',
                    'account_name': 'Early Termination Penalties',
                    'account_type': 'income',
                },
                
                # Cash & Bank
                {
                    'account_number': '1200',
                    'account_name': 'Cash on Hand',
                    'account_type': 'asset',
                },
                {
                    'account_number': '1210',
                    'account_name': 'Bank Account',
                    'account_type': 'asset',
                },
                {
                    'account_number': '1220',
                    'account_name': 'Post-Dated Cheques Received',
                    'account_type': 'asset',
                },
                
                # Maintenance/Expense
                {
                    'account_number': '6100',
                    'account_name': 'Maintenance Charges on Termination',
                    'account_type': 'expense',
                },
                {
                    'account_number': '6200',
                    'account_name': 'Property Utilities',
                    'account_type': 'expense',
                },
                {
                    'account_number': '6300',
                    'account_name': 'Property Taxes & Insurance',
                    'account_type': 'expense',
                },
            ]

            for acc in seed_accounts:
                Account.objects.get_or_create(
                    account_number=acc['account_number'],
                    defaults={
                        'account_name': acc['account_name'],
                        'account_type': acc['account_type'],
                    }
                )
            seeded_any = True

        if CostCenter.objects.count() < 3:
            seed_cost_centers = [
                {
                    'code': 'CC-001',
                    'name': 'Property Operations',
                },
                {
                    'code': 'CC-002',
                    'name': 'Unit Maintenance',
                },
                {
                    'code': 'CC-003',
                    'name': 'Common Area',
                },
            ]

            for cc in seed_cost_centers:
                CostCenter.objects.get_or_create(
                    code=cc['code'],
                    defaults={
                        'name': cc['name'],
                    }
                )
            seeded_any = True

        if seeded_any:
            self.stdout.write(self.style.SUCCESS('Seeded comprehensive accounts and cost centers.'))
        else:
            self.stdout.write(self.style.SUCCESS('Accounts and cost centers already seeded.'))

