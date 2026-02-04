from django.db import models
from django.core.validators import MinValueValidator


class Item(models.Model):
    """Item/Product model"""
    item_id = models.CharField(max_length=50, unique=True)
    item_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    category = models.CharField(max_length=100)
    unit = models.CharField(max_length=50)
    
    quantity_on_hand = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    reorder_level = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    
    cost_price = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    selling_price = models.DecimalField(max_digits=15, decimal_places=2, validators=[MinValueValidator(0)])
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.item_name} ({self.item_id})"
