#!/usr/bin/env python
import os
import sys
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'erp_system.config.settings')
sys.path.insert(0, '/home/sys1/Desktop/app-erp/backend')
django.setup()

from django.test import Client
from django.contrib.auth.models import User
from erp_system.apps.property.models import Unit, RentalLegalCase
from rest_framework.authtoken.models import Token

# Check if Unit 1 has a cost center
unit = Unit.objects.get(id=1)
print(f"✓ Unit 1: {unit}")
print(f"✓ Cost Center: {unit.cost_center.name if unit.cost_center else 'None'}")

# Get or create a test user and get their token
user = User.objects.first()
if not user:
    user = User.objects.create_user(username='testuser', password='testpass')
    print(f"✓ Created test user: {user.username}")
else:
    print(f"✓ Using existing user: {user.username}")

token, _ = Token.objects.get_or_create(user=user)
print(f"✓ User token: {token.key[:20]}...")

# Test POST request with authentication
client = Client()
response = client.post(
    '/api/property/legal-cases/',
    json.dumps({
        "tenant": 1,
        "lease": 1,
        "case_type": "eviction",
        "case_number": "111",
        "filing_date": "2026-03-13",
        "court_name": "civil court",
        "remarks": "civil court remarks",
        "property": 1,
        "unit": 1
    }),
    content_type='application/json',
    HTTP_AUTHORIZATION=f'Token {token.key}'
)

print(f"\nAPI Response Status: {response.status_code}")
if response.status_code == 201:
    print("✓✓✓ SUCCESS: Legal case created! ✓✓✓")
    data = response.json()
    print(f"  - Case ID: {data.get('id')}")
    print(f"  - Case Number: {data.get('case_number')}")
    print(f"  - Status: {data.get('current_status')}")
    print(f"  - Cost Center ID: {data.get('cost_center')}")
    print(f"\n✓ The fix works! The 'Unit must have a cost center' error is resolved.")
else:
    print(f"✗ FAILED with status {response.status_code}")
    try:
        data = response.json()
        print(f"  - Error: {json.dumps(data, indent=2)}")
    except:
        print(f"  - Response (first 500 chars): {response.content.decode()[:500]}")
