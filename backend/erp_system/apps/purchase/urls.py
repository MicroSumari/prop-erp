from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PurchaseOrderViewSet, SupplierInvoiceViewSet, PaymentVoucherViewSet

router = DefaultRouter()
router.register(r'orders', PurchaseOrderViewSet)
router.register(r'supplier-invoices', SupplierInvoiceViewSet)
router.register(r'payment-vouchers', PaymentVoucherViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
