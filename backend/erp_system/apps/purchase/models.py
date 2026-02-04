from django.db import models


class PurchaseOrder(models.Model):
    """Purchase Order model"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('received', 'Received'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    po_number = models.CharField(max_length=50, unique=True)
    vendor = models.CharField(max_length=200)
    
    po_date = models.DateField()
    expected_delivery_date = models.DateField()
    
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"PO-{self.po_number}"
