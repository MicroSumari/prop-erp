"""
URL configuration for erp_system project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Authentication APIs
    path('api/auth/', include('erp_system.apps.auth_api.urls')),
    
    # ERP Apps URLs
    path('api/accounts/', include('erp_system.apps.accounts.urls')),
    path('api/hrm/', include('erp_system.apps.hrm.urls')),
    path('api/inventory/', include('erp_system.apps.inventory.urls')),
    path('api/purchase/', include('erp_system.apps.purchase.urls')),
    path('api/sales/', include('erp_system.apps.sales.urls')),
    path('api/maintenance/', include('erp_system.apps.maintenance.urls')),
    
    # Property Management URLs
    path('api/property/', include('erp_system.apps.property.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
