from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SalesOrderViewSet, ReceiptVoucherViewSet

router = DefaultRouter()
router.register(r'orders', SalesOrderViewSet)
router.register(r'receipt-vouchers', ReceiptVoucherViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
