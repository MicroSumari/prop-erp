from django.db import models


class Employee(models.Model):
    """Employee model"""
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    
    employee_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    
    date_of_birth = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    
    designation = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    
    date_of_joining = models.DateField()
    
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.employee_id})"
