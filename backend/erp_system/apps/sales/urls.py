from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalesOrderViewSet, ReceiptVoucherViewSet, CustomerInvoiceViewSet

router = DefaultRouter()
router.register(r'orders', SalesOrderViewSet)
router.register(r'receipt-vouchers', ReceiptVoucherViewSet)
router.register(r'customer-invoices', CustomerInvoiceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
