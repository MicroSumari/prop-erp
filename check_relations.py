#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_system.config.settings')
sys.path.insert(0, '/home/sys1/Desktop/app-erp/backend')
django.setup()

from erp_system.apps.property.models import Lease, Tenant, Unit

# Check lease 1
lease = Lease.objects.get(id=1)
print(f"Lease 1:")
print(f"  - Tenant: {lease.tenant}")
print(f"  - Unit: {lease.unit}")

print(f"\nUnit 1:")
unit = Unit.objects.get(id=1)
print(f"  - Property: {unit.property}")
print(f"  - Cost Center: {unit.cost_center}")

print(f"\nTenant 1:")
tenant = Tenant.objects.get(id=1)
print(f"  - Unit: {tenant.unit}")
