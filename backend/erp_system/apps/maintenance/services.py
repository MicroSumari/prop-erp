from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.utils import timezone
from django.core.exceptions import ValidationError
from erp_system.apps.accounts.models import CostCenter, JournalEntry, JournalLine
from erp_system.apps.property.models import Unit, Property
from .models import MaintenanceRequest, MaintenanceContract


class MaintenanceRequestService:
    @staticmethod
    def _get_or_create_cost_center_for_unit(unit: Unit) -> CostCenter:
        if unit.cost_center:
            return unit.cost_center
        cost_center = CostCenter.objects.create(
            code=f"UNIT-{unit.id}",
            name=f"Unit {unit.unit_number}",
        )
        unit.cost_center = cost_center
        unit.save(update_fields=['cost_center'])
        return cost_center

    @staticmethod
    def create_request(data, user):
        unit = data.get('unit')
        property_obj = data.get('property')
        if unit.property_id != property_obj.id:
            raise ValidationError('Unit does not belong to the selected property.')

        cost_center = MaintenanceRequestService._get_or_create_cost_center_for_unit(unit)

        return MaintenanceRequest.objects.create(
            property=property_obj,
            unit=unit,
            cost_center=cost_center,
            request_type=data.get('request_type'),
            description=data.get('description'),
            priority=data.get('priority'),
            status=data.get('status'),
            created_by=user,
        )


class MaintenanceContractService:
    @staticmethod
    def _get_or_create_cost_center(unit: Unit, property_obj: Property) -> CostCenter:
        if unit and unit.cost_center:
            return unit.cost_center
        if unit:
            cost_center = CostCenter.objects.create(
                code=f"UNIT-{unit.id}",
                name=f"Unit {unit.unit_number}",
            )
            unit.cost_center = cost_center
            unit.save(update_fields=['cost_center'])
            return cost_center
        cost_center = CostCenter.objects.create(
            code=f"PROP-{property_obj.id}",
            name=f"Property {property_obj.name}",
        )
        return cost_center

    @staticmethod
    def _calculate_duration_months(start_date, end_date) -> int:
        if end_date < start_date:
            raise ValidationError('End date must be after start date.')
        months = (end_date.year - start_date.year) * 12 + (end_date.month - start_date.month)
        if end_date.day >= start_date.day:
            months += 1
        return max(months, 1)

    @staticmethod
    def create_contract(data):
        unit = data.get('unit')
        property_obj = data.get('property')
        if unit and unit.property_id != property_obj.id:
            raise ValidationError('Unit does not belong to the selected property.')
        cost_center = MaintenanceContractService._get_or_create_cost_center(unit, property_obj)
        duration_months = MaintenanceContractService._calculate_duration_months(
            data.get('start_date'),
            data.get('end_date')
        )
        requested_status = data.get('status', 'draft')

        contract = MaintenanceContract.objects.create(
            supplier=data.get('supplier'),
            property=data.get('property'),
            unit=unit,
            cost_center=cost_center,
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            total_amount=data.get('total_amount'),
            duration_months=duration_months,
            amortized_amount=Decimal('0.00'),
            prepaid_account=data.get('prepaid_account'),
            expense_account=data.get('expense_account'),
            supplier_account=data.get('supplier_account'),
            status='draft',
        )

        if requested_status == 'active':
            MaintenanceContractService.activate_contract(contract)

        return contract

    @staticmethod
    def activate_contract(contract: MaintenanceContract):
        with transaction.atomic():
            if contract.status != 'active':
                contract.status = 'active'
                contract.save(update_fields=['status'])
            MaintenanceContractService.post_prepaid_entry(contract)
        return contract

    @staticmethod
    def post_prepaid_entry(contract: MaintenanceContract):
        existing = JournalEntry.objects.filter(
            reference_type='maintenance_contract',
            reference_id=contract.id,
            entry_type='prepaid',
            period=''
        ).first()
        if existing:
            return existing

        with transaction.atomic():
            entry = JournalEntry.objects.create(
                entry_type='prepaid',
                reference_type='maintenance_contract',
                reference_id=contract.id,
                period='',
                description=f"Prepaid maintenance for contract {contract.id}",
            )
            JournalLine.objects.create(
                journal_entry=entry,
                account=contract.prepaid_account,
                debit=contract.total_amount,
                credit=Decimal('0.00'),
                cost_center=contract.cost_center,
                reference_type='maintenance_contract',
                reference_id=contract.id,
            )
            JournalLine.objects.create(
                journal_entry=entry,
                account=contract.supplier_account,
                debit=Decimal('0.00'),
                credit=contract.total_amount,
                cost_center=contract.cost_center,
                reference_type='maintenance_contract',
                reference_id=contract.id,
            )
            return entry


class MaintenanceAmortizationService:
    @staticmethod
    def run_monthly_amortization(run_date=None):
        run_date = run_date or timezone.now().date()
        period = f"{run_date.year:04d}-{run_date.month:02d}"

        contracts = MaintenanceContract.objects.filter(
            status='active',
            start_date__lte=run_date,
            end_date__gte=run_date,
        )

        for contract in contracts:
            existing = JournalEntry.objects.filter(
                reference_type='maintenance_contract',
                reference_id=contract.id,
                entry_type='amortization',
                period=period,
            ).first()
            if existing:
                continue

            duration = max(contract.duration_months, 1)
            monthly_amount = (contract.total_amount / Decimal(duration)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            remaining = (contract.total_amount - contract.amortized_amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            if remaining <= Decimal('0.00'):
                contract.status = 'completed'
                contract.save(update_fields=['status'])
                continue

            amount = monthly_amount if remaining >= monthly_amount else remaining

            with transaction.atomic():
                entry = JournalEntry.objects.create(
                    entry_type='amortization',
                    reference_type='maintenance_contract',
                    reference_id=contract.id,
                    period=period,
                    description=f"Maintenance amortization {period} for contract {contract.id}",
                )
                JournalLine.objects.create(
                    journal_entry=entry,
                    account=contract.expense_account,
                    debit=amount,
                    credit=Decimal('0.00'),
                    cost_center=contract.cost_center,
                    reference_type='maintenance_contract',
                    reference_id=contract.id,
                )
                JournalLine.objects.create(
                    journal_entry=entry,
                    account=contract.prepaid_account,
                    debit=Decimal('0.00'),
                    credit=amount,
                    cost_center=contract.cost_center,
                    reference_type='maintenance_contract',
                    reference_id=contract.id,
                )

                contract.amortized_amount = (contract.amortized_amount + amount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
                if contract.amortized_amount >= contract.total_amount:
                    contract.status = 'completed'
                    contract.save(update_fields=['amortized_amount', 'status'])
                else:
                    contract.save(update_fields=['amortized_amount'])
