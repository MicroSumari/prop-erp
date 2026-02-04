from rest_framework import serializers
from .models import MaintenanceRequest, MaintenanceContract


class MaintenanceRequestSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source='property.name', read_only=True)
    unit_number = serializers.CharField(source='unit.unit_number', read_only=True)

    class Meta:
        model = MaintenanceRequest
        fields = '__all__'
        read_only_fields = ['cost_center', 'created_by', 'created_at', 'updated_at']


class MaintenanceContractSerializer(serializers.ModelSerializer):
    property_name = serializers.CharField(source='property.name', read_only=True)
    unit_number = serializers.CharField(source='unit.unit_number', read_only=True)
    supplier_name = serializers.CharField(source='supplier.__str__', read_only=True)

    class Meta:
        model = MaintenanceContract
        fields = '__all__'
        read_only_fields = ['cost_center', 'duration_months', 'amortized_amount', 'created_at', 'updated_at']
