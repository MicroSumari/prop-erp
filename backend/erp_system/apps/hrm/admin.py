from django.contrib import admin
from .models import Employee


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'first_name', 'last_name', 'designation', 'department', 'is_active']
    list_filter = ['department', 'is_active', 'date_of_joining']
    search_fields = ['employee_id', 'first_name', 'last_name', 'email']
