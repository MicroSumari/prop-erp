from django.contrib import admin
from .models import SalesOrder


@admin.register(SalesOrder)
class SalesOrderAdmin(admin.ModelAdmin):
    list_display = ['so_number', 'customer', 'order_date', 'total_amount', 'status']
    list_filter = ['status', 'order_date']
    search_fields = ['so_number', 'customer']
