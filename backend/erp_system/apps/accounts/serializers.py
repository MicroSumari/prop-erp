from rest_framework import serializers
from decimal import Decimal
from django.db import transaction
from rest_framework.exceptions import ValidationError
from .models import Account, CostCenter, JournalEntry, JournalLine, ChequeRegister


class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = '__all__'


class CostCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostCenter
        fields = '__all__'


class JournalLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalLine
        fields = '__all__'


class JournalEntrySerializer(serializers.ModelSerializer):
    lines = JournalLineSerializer(many=True, read_only=True)

    class Meta:
        model = JournalEntry
        fields = '__all__'


class ChequeRegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChequeRegister
        fields = '__all__'


class ManualJournalLineInputSerializer(serializers.Serializer):
    account = serializers.PrimaryKeyRelatedField(queryset=Account.objects.all())
    debit = serializers.DecimalField(max_digits=15, decimal_places=2, default=0)
    credit = serializers.DecimalField(max_digits=15, decimal_places=2, default=0)
    cost_center = serializers.PrimaryKeyRelatedField(queryset=CostCenter.objects.all())


class ManualJournalEntrySerializer(serializers.Serializer):
    description = serializers.CharField(required=False, allow_blank=True)
    lines = ManualJournalLineInputSerializer(many=True)

    def validate(self, data):
        lines = data.get('lines', [])
        if not lines:
            raise ValidationError('At least one journal line is required.')

        total_debit = sum([Decimal(line.get('debit', 0)) for line in lines])
        total_credit = sum([Decimal(line.get('credit', 0)) for line in lines])
        if total_debit != total_credit:
            raise ValidationError('Total debit must equal total credit.')

        return data

    @transaction.atomic
    def create(self, validated_data):
        description = validated_data.get('description', '')
        reference_id = JournalEntry.objects.filter(reference_type='manual_journal').count() + 1

        entry = JournalEntry.objects.create(
            entry_type='manual',
            reference_type='manual_journal',
            reference_id=reference_id,
            period='',
            description=description,
        )

        for line in validated_data['lines']:
            JournalLine.objects.create(
                journal_entry=entry,
                account=line['account'],
                debit=line.get('debit', 0) or Decimal('0.00'),
                credit=line.get('credit', 0) or Decimal('0.00'),
                cost_center=line['cost_center'],
                reference_type='manual_journal',
                reference_id=reference_id,
            )

        return entry
