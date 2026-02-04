#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_system.config.settings')
sys.path.insert(0, '/home/sys1/Desktop/app-erp/backend')
django.setup()

from erp_system.apps.property.models import Unit
from erp_system.apps.accounts.models import CostCenter

# Find all units without cost centers and create/assign them
units_without_cc = Unit.objects.filter(cost_center__isnull=True)
print(f"Found {units_without_cc.count()} units without cost centers")

for unit in units_without_cc:
    code = f"CC-UNIT-{unit.id:04d}"
    name = f"{unit.property.name} - {unit.unit_number}"
    
    cost_center, created = CostCenter.objects.get_or_create(
        code=code,
        defaults={'name': name}
    )
    
    unit.cost_center = cost_center
    unit.save(update_fields=['cost_center'])
    
    status = "CREATED" if created else "FOUND"
    print(f"✓ Unit {unit.id} ({unit.unit_number}): Cost Center {status} - {cost_center.name}")

# Verify
units_still_without_cc = Unit.objects.filter(cost_center__isnull=True)
print(f"\nAfter fix: {units_still_without_cc.count()} units still without cost centers")
