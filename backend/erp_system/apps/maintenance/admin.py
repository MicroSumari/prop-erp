from django.contrib import admin
from .models import MaintenanceRequest, MaintenanceContract


@admin.register(MaintenanceRequest)
class MaintenanceRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'property', 'unit', 'request_type', 'priority', 'status', 'created_at']
    list_filter = ['status', 'priority', 'request_type']
    search_fields = ['description']


@admin.register(MaintenanceContract)
class MaintenanceContractAdmin(admin.ModelAdmin):
    list_display = ['id', 'supplier', 'property', 'unit', 'total_amount', 'status', 'start_date', 'end_date']
    list_filter = ['status']
    search_fields = ['supplier__first_name', 'supplier__last_name']
