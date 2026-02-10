from django.contrib import admin
from .models import (
    Account,
    CostCenter,
    JournalEntry,
    JournalLine,
    ChequeRegister,
    TransactionAccountMapping,
    PropertyClassification,
    ReceiptPaymentMapping,
)


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ['account_number', 'account_name', 'account_type', 'is_active']
    list_filter = ['account_type', 'is_active']
    search_fields = ['account_number', 'account_name']


@admin.register(CostCenter)
class CostCenterAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'is_active']
    search_fields = ['code', 'name']


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ['entry_type', 'reference_type', 'reference_id', 'period', 'entry_date']
    list_filter = ['entry_type', 'period', 'entry_date']


@admin.register(JournalLine)
class JournalLineAdmin(admin.ModelAdmin):
    list_display = ['journal_entry', 'account', 'debit', 'credit', 'cost_center']
    list_filter = ['account', 'cost_center']


@admin.register(ChequeRegister)
class ChequeRegisterAdmin(admin.ModelAdmin):
    list_display = ['cheque_type', 'cheque_number', 'amount', 'status', 'cheque_date']
    list_filter = ['cheque_type', 'status']
    search_fields = ['cheque_number', 'bank_name']


@admin.register(TransactionAccountMapping)
class TransactionAccountMappingAdmin(admin.ModelAdmin):
    list_display = ['transaction_type', 'debit_account', 'credit_account', 'is_active']
    list_filter = ['transaction_type', 'is_active']


@admin.register(PropertyClassification)
class PropertyClassificationAdmin(admin.ModelAdmin):
    list_display = ['name', 'default_revenue_account', 'default_expense_account', 'is_active']
    list_filter = ['is_active']


@admin.register(ReceiptPaymentMapping)
class ReceiptPaymentMappingAdmin(admin.ModelAdmin):
    list_display = ['name', 'mapping_type', 'debit_account', 'credit_account', 'is_active']
    list_filter = ['mapping_type', 'is_active']
