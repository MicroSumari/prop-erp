from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator
from .models import (
    Property, Unit, Tenant, Lease, Maintenance, Expense, Rent,
    LeaseRenewal, LeaseTermination, RentalLegalCase, RentalLegalCaseStatusHistory
)


class PropertySerializer(serializers.ModelSerializer):
    class Meta:
        model = Property
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
        extra_kwargs = {
            'number_of_units': {'required': False, 'allow_null': True},
            'total_area': {'required': False, 'allow_null': True},
            'built_area': {'required': False, 'allow_null': True},
            'zip_code': {'required': False, 'allow_null': True},
            'year_built': {'required': False, 'allow_null': True},
        }


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']
        validators = [
            UniqueTogetherValidator(
                queryset=Unit.objects.all(),
                fields=['property', 'unit_number'],
                message='Unit number must be unique per property.'
            )
        ]


class TenantSerializer(serializers.ModelSerializer):
    move_out_date = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = Tenant
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def to_internal_value(self, data):
        if data.get('move_out_date') == '':
            data = data.copy()
            data['move_out_date'] = None
        return super().to_internal_value(data)


class LeaseSerializer(serializers.ModelSerializer):
    unit_number = serializers.CharField(source='unit.unit_number', read_only=True)
    tenant_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Lease
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

    def get_tenant_name(self, obj):
        if not obj.tenant:
            return None
        return f"{obj.tenant.first_name} {obj.tenant.last_name}".strip()


class MaintenanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Maintenance
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'reported_date']


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class RentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rent
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class LeaseRenewalSerializer(serializers.ModelSerializer):
    """Serializer for Lease Renewal"""
    lease_details = LeaseSerializer(source='original_lease', read_only=True)
    
    class Meta:
        model = LeaseRenewal
        fields = [
            'id', 'renewal_number', 'original_lease', 'lease_details',
            'original_start_date', 'original_end_date', 'original_monthly_rent',
            'new_start_date', 'new_end_date', 'new_monthly_rent',
            'new_security_deposit', 'status', 'renewal_date', 'approval_date',
            'activation_date', 'terms_conditions', 'notes', 'created_by',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'renewal_number', 'renewal_date', 'created_at', 'updated_at', 'lease_details'
        ]
        extra_kwargs = {
            'new_security_deposit': {'required': False, 'allow_null': True},
            'terms_conditions': {'required': False, 'allow_blank': True},
            'approval_date': {'required': False, 'allow_null': True},
            'activation_date': {'required': False, 'allow_null': True},
            'notes': {'required': False, 'allow_blank': True},
        }
    
    def validate(self, data):
        """Validate renewal dates"""
        if data['new_start_date'] >= data['new_end_date']:
            raise serializers.ValidationError(
                "New end date must be after new start date."
            )
        
        if data['new_monthly_rent'] <= 0:
            raise serializers.ValidationError(
                "New monthly rent must be greater than zero."
            )
        
        return data


class LeaseTerminationSerializer(serializers.ModelSerializer):
    """Serializer for Lease Termination"""
    lease_details = LeaseSerializer(source='lease', read_only=True)
    
    class Meta:
        model = LeaseTermination
        fields = [
            'id', 'termination_number', 'lease', 'lease_details',
            'termination_type', 'termination_date', 'status',
            'approval_date', 'completion_date',
            'original_security_deposit', 'refundable_amount',
            'unearned_rent', 'early_termination_penalty',
            'maintenance_charges', 'post_dated_cheques_adjusted',
            'post_dated_cheques_notes', 'net_refund',
            'terms_conditions', 'exit_notes', 'notes',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'termination_number', 'created_at', 'updated_at', 'lease_details', 'net_refund'
        ]
        extra_kwargs = {
            'unearned_rent': {'required': False, 'initial': 0},
            'early_termination_penalty': {'required': False, 'initial': 0},
            'maintenance_charges': {'required': False, 'initial': 0},
            'post_dated_cheques_adjusted': {'required': False, 'initial': False},
            'post_dated_cheques_notes': {'required': False, 'allow_blank': True},
            'terms_conditions': {'required': False, 'allow_blank': True},
            'exit_notes': {'required': False, 'allow_blank': True},
            'notes': {'required': False, 'allow_blank': True},
            'approval_date': {'required': False, 'allow_null': True},
            'completion_date': {'required': False, 'allow_null': True},
        }
    
    def validate(self, data):
        """Validate termination data"""
        termination_type = data.get('termination_type')
        
        if termination_type == 'early':
            if data.get('unearned_rent', 0) < 0:
                raise serializers.ValidationError(
                    "Unearned rent cannot be negative."
                )
            if data.get('early_termination_penalty', 0) < 0:
                raise serializers.ValidationError(
                    "Early termination penalty cannot be negative."
                )
        
        if data.get('refundable_amount', 0) < 0:
            raise serializers.ValidationError(
                "Refundable amount cannot be negative."
            )
        
        return data
    
    def create(self, validated_data):
        """Calculate net refund on creation"""
        instance = super().create(validated_data)
        instance.calculate_net_refund()
        instance.save()
        return instance
    
    def update(self, instance, validated_data):
        """Recalculate net refund on update"""
        instance = super().update(instance, validated_data)
        instance.calculate_net_refund()
        instance.save()
        return instance


class RentalLegalCaseStatusHistorySerializer(serializers.ModelSerializer):
    """Serializer for legal case status history"""
    class Meta:
        model = RentalLegalCaseStatusHistory
        fields = [
            'id', 'legal_case', 'previous_status', 'new_status',
            'change_reason', 'changed_by', 'changed_at'
        ]
        read_only_fields = ['id', 'changed_at']


class RentalLegalCaseSerializer(serializers.ModelSerializer):
    """Serializer for rental legal cases"""
    tenant_name = serializers.SerializerMethodField()
    lease_number = serializers.CharField(source='lease.lease_number', read_only=True)
    property_name = serializers.CharField(source='property.name', read_only=True)
    unit_number = serializers.CharField(source='unit.unit_number', read_only=True)
    status_history = RentalLegalCaseStatusHistorySerializer(many=True, read_only=True)
    
    class Meta:
        model = RentalLegalCase
        fields = [
            'id', 'tenant', 'tenant_name', 'lease', 'lease_number',
            'property', 'property_name', 'unit', 'unit_number',
            'cost_center', 'case_type', 'case_number', 'filing_date',
            'current_status', 'court_name', 'remarks',
            'created_by', 'created_at', 'updated_at', 'status_history'
        ]
        read_only_fields = [
            'id', 'cost_center', 'current_status', 'created_at', 'updated_at',
            'tenant_name', 'lease_number', 'property_name', 'unit_number', 'status_history'
        ]
        extra_kwargs = {
            'remarks': {'required': False, 'allow_blank': True},
        }
    
    def get_tenant_name(self, obj):
        if not obj.tenant:
            return None
        return f"{obj.tenant.first_name} {obj.tenant.last_name}".strip()
    
    def validate(self, data):
        """Validate tenant-lease relationship"""
        tenant = data.get('tenant')
        lease = data.get('lease')
        
        if lease and tenant and lease.tenant_id != tenant.id:
            raise serializers.ValidationError(
                "Selected lease does not belong to the selected tenant."
            )
        
        return data

