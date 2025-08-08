#!/usr/bin/env python
"""
Quick setup script for Django admin
Run this script to set up admin access for your job portal
"""

import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from django.db import IntegrityError

def create_superuser():
    """Create a default superuser for admin access"""
    username = 'admin'
    email = 'admin@jobportal.com'
    password = 'admin123'
    
    try:
        if User.objects.filter(username=username).exists():
            print(f'❌ User "{username}" already exists!')
            user = User.objects.get(username=username)
            print(f'✅ You can login with username: {username}')
            return user
        
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
        
        print('✅ Successfully created superuser!')
        print(f'Username: {username}')
        print(f'Email: {email}')
        print(f'Password: {password}')
        print('⚠️  Please change the password after first login!')
        
        return user
        
    except IntegrityError as e:
        print(f'❌ Error creating superuser: {e}')
        return None
    except Exception as e:
        print(f'❌ Unexpected error: {e}')
        return None

def main():
    print("🚀 Setting up Django Admin for Job Portal...")
    print("=" * 50)
    
    # Create superuser
    user = create_superuser()
    
    if user:
        print("\n📋 Admin Setup Complete!")
        print("=" * 50)
        print("🌐 Access your admin panel at: http://localhost:8000/admin/")
        print("👤 Login with the credentials shown above")
        print("\n📊 Available Admin Features:")
        print("  • Manage Companies and Institutions")
        print("  • Control Job Listings")
        print("  • Review Job Applications")
        print("  • Manage User Accounts")
        print("  • Bulk Actions and Filtering")
        print("\n🔧 To start the server:")
        print("  cd backend")
        print("  python manage.py runserver")

if __name__ == '__main__':
    main()