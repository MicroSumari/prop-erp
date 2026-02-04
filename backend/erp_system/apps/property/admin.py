from django.contrib import admin
from .models import Property, Unit, Tenant, Lease, Maintenance, Expense, Rent


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ['property_id', 'name', 'property_type', 'status', 'city', 'owner']
    list_filter = ['status', 'property_type', 'city']
    search_fields = ['name', 'property_id', 'city']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ['unit_number', 'property', 'status', 'area', 'monthly_rent']
    list_filter = ['status', 'property']
    search_fields = ['unit_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'email', 'phone', 'move_in_date']
    search_fields = ['first_name', 'last_name', 'email']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Lease)
class LeaseAdmin(admin.ModelAdmin):
    list_display = ['lease_number', 'unit', 'tenant', 'start_date', 'end_date', 'status']
    list_filter = ['status', 'start_date', 'end_date']
    search_fields = ['lease_number']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Maintenance)
class MaintenanceAdmin(admin.ModelAdmin):
    list_display = ['maintenance_id', 'property', 'title', 'priority', 'status', 'reported_date']
    list_filter = ['status', 'priority', 'reported_date']
    search_fields = ['maintenance_id', 'title']
    readonly_fields = ['created_at', 'updated_at', 'reported_date']


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ['expense_id', 'property', 'expense_type', 'amount', 'payment_status', 'expense_date']
    list_filter = ['expense_type', 'payment_status', 'expense_date']
    search_fields = ['expense_id', 'description']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Rent)
class RentAdmin(admin.ModelAdmin):
    list_display = ['lease', 'tenant', 'rent_date', 'amount', 'status', 'due_date']
    list_filter = ['status', 'rent_date', 'due_date']
    readonly_fields = ['created_at', 'updated_at']
