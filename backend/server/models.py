from django.db import models
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password

class Company(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)  # Store hashed password
    image = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def set_password(self, raw_password):
        """Hash and set the password"""
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Check if the provided password matches the stored hash"""
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.name

class Institution(models.Model):
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)  # Store hashed password
    image = models.ImageField(upload_to='institution_logos/', blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def set_password(self, raw_password):
        """Hash and set the password"""
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Check if the provided password matches the stored hash"""
        return check_password(raw_password, self.password)

    def __str__(self):
        return self.name

class Job(models.Model):
    LEVEL_CHOICES = [
        ('Beginner Level', 'Beginner Level'),
        ('Intermediate Level', 'Intermediate Level'),
        ('Senior Level', 'Senior Level'),
    ]

    title = models.CharField(max_length=200)
    location = models.CharField(max_length=100)
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES)
    company = models.ForeignKey(Company, related_name='jobs', on_delete=models.CASCADE)
    description = models.TextField()
    salary = models.IntegerField()
    date = models.DateTimeField(auto_now_add=True)
    category = models.CharField(max_length=50)
    visible = models.BooleanField(default=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return self.title

class JobApplication(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Accepted', 'Accepted'),
        ('Rejected', 'Rejected'),
    ]
    
    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    applicant = models.ForeignKey('ClerkUser', on_delete=models.CASCADE)  # Changed from User to ClerkUser
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    applied_date = models.DateTimeField(auto_now_add=True)

class ClerkUser(models.Model):
    clerk_id = models.CharField(max_length=255, unique=True)  # Clerk user ID
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    profile_photo = models.URLField(blank=True, null=True)
    resume_link = models.URLField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name