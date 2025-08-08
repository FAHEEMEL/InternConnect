#!/usr/bin/env python
"""
Demo data creation script for Django admin
This script creates sample data to demonstrate admin capabilities
"""

import os
import sys
import django
from datetime import datetime, timedelta
import random

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from server.models import Company, Institution, Job, JobApplication, ClerkUser

def create_demo_data():
    """Create demo data for testing admin functionality"""
    
    print("🎭 Creating demo data for admin testing...")
    
    # Create demo institutions
    institutions_data = [
        {
            'name': 'Tech University',
            'email': 'admin@techuni.edu',
            'address': '123 Tech Street, Silicon Valley, CA',
            'phone': '+1-555-0123',
            'website': 'https://techuni.edu'
        },
        {
            'name': 'Business College',
            'email': 'info@bizcollege.edu',
            'address': '456 Business Ave, New York, NY',
            'phone': '+1-555-0456',
            'website': 'https://bizcollege.edu'
        }
    ]
    
    for inst_data in institutions_data:
        institution, created = Institution.objects.get_or_create(
            email=inst_data['email'],
            defaults=inst_data
        )
        if created:
            institution.set_password('demo123')
            institution.save()
            print(f"✅ Created institution: {institution.name}")
    
    # Create demo companies
    companies_data = [
        {'name': 'TechCorp Inc', 'email': 'hr@techcorp.com'},
        {'name': 'StartupXYZ', 'email': 'jobs@startupxyz.com'},
        {'name': 'MegaSoft Solutions', 'email': 'careers@megasoft.com'},
        {'name': 'InnovateLab', 'email': 'hiring@innovatelab.com'},
        {'name': 'DataDriven Co', 'email': 'recruit@datadriven.com'},
    ]
    
    for comp_data in companies_data:
        company, created = Company.objects.get_or_create(
            email=comp_data['email'],
            defaults=comp_data
        )
        if created:
            company.set_password('demo123')
            company.save()
            print(f"✅ Created company: {company.name}")
    
    # Create demo users
    users_data = [
        {
            'clerk_id': 'user_demo1',
            'name': 'John Doe',
            'email': 'john.doe@email.com',
            'resume_link': 'https://example.com/resume1.pdf'
        },
        {
            'clerk_id': 'user_demo2',
            'name': 'Jane Smith',
            'email': 'jane.smith@email.com',
            'resume_link': 'https://example.com/resume2.pdf'
        },
        {
            'clerk_id': 'user_demo3',
            'name': 'Mike Johnson',
            'email': 'mike.johnson@email.com',
        },
        {
            'clerk_id': 'user_demo4',
            'name': 'Sarah Wilson',
            'email': 'sarah.wilson@email.com',
            'resume_link': 'https://example.com/resume4.pdf'
        },
        {
            'clerk_id': 'user_demo5',
            'name': 'David Brown',
            'email': 'david.brown@email.com',
        }
    ]
    
    for user_data in users_data:
        user, created = ClerkUser.objects.get_or_create(
            clerk_id=user_data['clerk_id'],
            defaults=user_data
        )
        if created:
            print(f"✅ Created user: {user.name}")
    
    # Create demo jobs
    companies = Company.objects.all()
    job_titles = [
        'Senior Software Engineer',
        'Frontend Developer',
        'Backend Developer',
        'Full Stack Developer',
        'Data Scientist',
        'Product Manager',
        'UI/UX Designer',
        'DevOps Engineer',
        'Mobile App Developer',
        'Machine Learning Engineer'
    ]
    
    locations = ['San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA', 'Boston, MA']
    categories = ['Technology', 'Engineering', 'Design', 'Management', 'Data Science']
    levels = ['Beginner Level', 'Intermediate Level', 'Senior Level']
    
    for i, title in enumerate(job_titles):
        if companies:
            job, created = Job.objects.get_or_create(
                title=title,
                company=random.choice(companies),
                defaults={
                    'location': random.choice(locations),
                    'level': random.choice(levels),
                    'description': f'Exciting opportunity for a {title} to join our growing team. We offer competitive salary, great benefits, and a collaborative work environment.',
                    'salary': random.randint(60000, 150000),
                    'category': random.choice(categories),
                    'visible': random.choice([True, True, True, False])  # 75% visible
                }
            )
            if created:
                print(f"✅ Created job: {job.title} at {job.company.name}")
    
    # Create demo applications
    jobs = Job.objects.all()
    users = ClerkUser.objects.all()
    statuses = ['Pending', 'Accepted', 'Rejected']
    
    if jobs and users:
        for _ in range(20):  # Create 20 random applications
            job = random.choice(jobs)
            user = random.choice(users)
            
            # Avoid duplicate applications
            if not JobApplication.objects.filter(job=job, applicant=user).exists():
                application = JobApplication.objects.create(
                    job=job,
                    applicant=user,
                    status=random.choice(statuses)
                )
                print(f"✅ Created application: {user.name} -> {job.title}")
    
    print("\n🎉 Demo data creation complete!")
    print("=" * 50)
    print("📊 Summary:")
    print(f"  • Institutions: {Institution.objects.count()}")
    print(f"  • Companies: {Company.objects.count()}")
    print(f"  • Jobs: {Job.objects.count()}")
    print(f"  • Users: {ClerkUser.objects.count()}")
    print(f"  • Applications: {JobApplication.objects.count()}")
    print("\n🌐 Access admin at: http://localhost:8000/admin/")

if __name__ == '__main__':
    create_demo_data()