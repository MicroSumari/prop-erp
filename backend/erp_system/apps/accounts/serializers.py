from rest_framework import serializers
from .models import Account, CostCenter, JournalEntry, JournalLine


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
