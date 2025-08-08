from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Job, Company, JobApplication, Institution
from .serializers import JobSerializer, CompanySerializer, JobApplicationSerializer, CompanyLoginSerializer, InstitutionSerializer, InstitutionLoginSerializer
from django.utils import timezone
import jwt
from datetime import datetime, timedelta

from rest_framework.permissions import AllowAny

from django.conf import settings
from svix import Webhook, WebhookVerificationError

from .models import ClerkUser

# JWT Secret - in production, use environment variable
JWT_SECRET = 'your-secret-key-here'


class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all()
    serializer_class = JobSerializer

    def create(self, request, *args, **kwargs):
        # Get company from JWT token
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.split(' ')[1]
        
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            company = Company.objects.get(id=payload['company_id'])
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        except Company.DoesNotExist:
            return Response({'error': 'Company not found'}, status=status.HTTP_404_NOT_FOUND)

        # Add current timestamp and company to the request data
        data = request.data.copy()
        data['date'] = timezone.now()
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        
        # Save the job with the authenticated company
        job = serializer.save(company=company)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_queryset(self):
        queryset = Job.objects.all()
        category = self.request.query_params.get('category', None)
        location = self.request.query_params.get('location', None)
        title = self.request.query_params.get('title', None)

        if category:
            queryset = queryset.filter(category=category)
        if location:
            queryset = queryset.filter(location=location)
        if title:
            queryset = queryset.filter(title__icontains=title)

        return queryset

@api_view(['GET'])
def get_job_categories(request):
    categories = Job.objects.values_list('category', flat=True).distinct()
    return Response(list(categories))

@api_view(['GET'])
def get_job_locations(request):
    locations = Job.objects.values_list('location', flat=True).distinct()
    return Response(list(locations))

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer

class JobApplicationViewSet(viewsets.ModelViewSet):
    queryset = JobApplication.objects.all()
    serializer_class = JobApplicationSerializer





@api_view(['POST'])
@permission_classes([AllowAny])
def clerk_webhook(request):
    svix_id = request.headers.get("svix-id")
    svix_timestamp = request.headers.get("svix-timestamp")
    svix_signature = request.headers.get("svix-signature")

    if not all([svix_id, svix_timestamp, svix_signature]):
        return Response({"detail": "Missing Svix headers"}, status=status.HTTP_400_BAD_REQUEST)

    wh = Webhook(settings.CLERK_WEBHOOK_SECRET)

    try:
        payload = wh.verify(
            request.body,
            headers={
                "svix-id": svix_id,
                "svix-timestamp": svix_timestamp,
                "svix-signature": svix_signature,
            }
        )
    except WebhookVerificationError:
        return Response({"detail": "Invalid webhook signature"}, status=status.HTTP_403_FORBIDDEN)

    event_type = payload.get("type")
    data = payload.get("data")

    if event_type == "user.created":
        # Extract relevant fields from Clerk payload
        clerk_id = data.get("id")
        name = data.get("full_name") or ""  # use fallback empty string if missing
        email_list = data.get("email_addresses", [])
        email = email_list[0]["email_address"] if email_list else ""
        profile_photo = data.get("profile_image_url", "")

        # Save to DB, avoid duplicates by clerk_id
        user, created = ClerkUser.objects.update_or_create(
            clerk_id=clerk_id,
            defaults={
                "name": name,
                "email": email,
                "profile_photo": profile_photo,
            }
        )
        print(f"User created: {user}")

    elif event_type == "user.updated":
        clerk_id = data.get("id")
        try:
            user = ClerkUser.objects.get(clerk_id=clerk_id)
            # Update fields if present
            user.name = data.get("full_name") or user.name
            email_list = data.get("email_addresses", [])
            if email_list:
                user.email = email_list[0]["email_address"]
            user.profile_photo = data.get("profile_image_url") or user.profile_photo
            user.save()
            print(f"User updated: {user}")
        except ClerkUser.DoesNotExist:
            print(f"User with id {clerk_id} not found for update")

    elif event_type == "user.deleted":
        clerk_id = data.get("id")
        deleted_count, _ = ClerkUser.objects.filter(clerk_id=clerk_id).delete()
        print(f"User deleted with id {clerk_id}, deleted count: {deleted_count}")

    else:
        print(f"Unhandled event type: {event_type}")

    return Response({"status": "received"}, status=status.HTTP_200_OK)


# Institution Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def institution_signup(request):
    serializer = InstitutionSerializer(data=request.data)
    if serializer.is_valid():
        institution = serializer.save()
        
        # Generate JWT token
        payload = {
            'institution_id': institution.id,
            'email': institution.email,
            'exp': datetime.utcnow() + timedelta(days=7)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
        
        return Response({
            'message': 'Institution registered successfully',
            'token': token,
            'institution': {
                'id': institution.id,
                'name': institution.name,
                'email': institution.email,
                'image': institution.image.url if institution.image else None,
                'address': institution.address,
                'phone': institution.phone,
                'website': institution.website
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def institution_login(request):
    serializer = InstitutionLoginSerializer(data=request.data)
    if serializer.is_valid():
        institution = serializer.validated_data['institution']
        
        # Generate JWT token
        payload = {
            'institution_id': institution.id,
            'email': institution.email,
            'exp': datetime.utcnow() + timedelta(days=7)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
        
        return Response({
            'message': 'Login successful',
            'token': token,
            'institution': {
                'id': institution.id,
                'name': institution.name,
                'email': institution.email,
                'image': institution.image.url if institution.image else None,
                'address': institution.address,
                'phone': institution.phone,
                'website': institution.website
            }
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def institution_profile(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        institution_id = payload['institution_id']
        
        institution = Institution.objects.get(id=institution_id)
        
        return Response({
            'id': institution.id,
            'name': institution.name,
            'email': institution.email,
            'image': institution.image.url if institution.image else None,
            'address': institution.address,
            'phone': institution.phone,
            'website': institution.website,
            'image': institution.image.url if institution.image else None
        }, status=status.HTTP_200_OK)
        
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Institution.DoesNotExist:
        return Response({'error': 'Institution not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
def institution_profile_update(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        institution_id = payload['institution_id']
        
        institution = Institution.objects.get(id=institution_id)
        
        # Update fields
        if 'name' in request.data:
            institution.name = request.data['name']
        if 'email' in request.data:
            institution.email = request.data['email']
        if 'address' in request.data:
            institution.address = request.data['address']
        if 'phone' in request.data:
            institution.phone = request.data['phone']
        if 'website' in request.data:
            institution.website = request.data['website']
        if 'image' in request.FILES:
            institution.image = request.FILES['image']
        
        institution.save()
        
        return Response({
            'message': 'Profile updated successfully',
            'institution': {
                'id': institution.id,
                'name': institution.name,
                'email': institution.email,
                'image': institution.image.url if institution.image else None,
                'address': institution.address,
                'phone': institution.phone,
                'website': institution.website,
                'image': institution.image.url if institution.image else None
            }
        }, status=status.HTTP_200_OK)
        
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Institution.DoesNotExist:
        return Response({'error': 'Institution not found'}, status=status.HTTP_404_NOT_FOUND)

# Institution Company Management Views
@api_view(['GET'])
def institution_companies(request):
    """Get all companies for institution management"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        institution_id = payload['institution_id']
        
        # Get all companies with job count
        companies = Company.objects.all().order_by('name')
        companies_data = []
        
        for company in companies:
            job_count = Job.objects.filter(company=company).count()
            companies_data.append({
                'id': company.id,
                'name': company.name,
                'email': company.email,
                'image': company.image.url if company.image else None,
                'job_count': job_count,
                'created_at': company.created_at
            })
        
        return Response(companies_data, status=status.HTTP_200_OK)
        
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
def institution_create_company(request):
    """Create a new company"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        institution_id = payload['institution_id']
        
        serializer = CompanySerializer(data=request.data)
        if serializer.is_valid():
            company = serializer.save()
            return Response({
                'message': 'Company created successfully',
                'company': {
                    'id': company.id,
                    'name': company.name,
                    'email': company.email,
                    'image': company.image.url if company.image else None
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['PUT'])
def institution_update_company(request, company_id):
    """Update a company"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        institution_id = payload['institution_id']
        
        company = Company.objects.get(id=company_id)
        
        # Update fields
        if 'name' in request.data:
            company.name = request.data['name']
        if 'email' in request.data:
            company.email = request.data['email']
        if 'password' in request.data and request.data['password']:
            company.set_password(request.data['password'])
        
        company.save()
        
        return Response({
            'message': 'Company updated successfully',
            'company': {
                'id': company.id,
                'name': company.name,
                'email': company.email,
                'image': company.image.url if company.image else None
            }
        }, status=status.HTTP_200_OK)
        
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Company.DoesNotExist:
        return Response({'error': 'Company not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
def institution_delete_company(request, company_id):
    """Delete a company"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        institution_id = payload['institution_id']
        
        company = Company.objects.get(id=company_id)
        company.delete()
        
        return Response({'message': 'Company deleted successfully'}, status=status.HTTP_200_OK)
        
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Company.DoesNotExist:
        return Response({'error': 'Company not found'}, status=status.HTTP_404_NOT_FOUND)

# Institution Job Management Views
@api_view(['GET'])
def institution_all_jobs(request):
    """Get all jobs across all companies"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        institution_id = payload['institution_id']
        
        # Get all jobs with company information
        jobs = Job.objects.select_related('company').all().order_by('-date')
        
        jobs_data = []
        for job in jobs:
            application_count = JobApplication.objects.filter(job=job).count()
            jobs_data.append({
                'id': job.id,
                'title': job.title,
                'location': job.location,
                'level': job.level,
                'description': job.description,
                'salary': job.salary,
                'date': job.date,
                'category': job.category,
                'visible': job.visible,
                'applicants': application_count,
                'company': {
                    'id': job.company.id,
                    'name': job.company.name,
                    'email': job.company.email,
                    'image': job.company.image.url if job.company.image else None
                }
            })
        
        return Response(jobs_data, status=status.HTTP_200_OK)
        
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['PATCH'])
def institution_update_job_visibility(request, job_id):
    """Update job visibility"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        institution_id = payload['institution_id']
        
        job = Job.objects.get(id=job_id)
        
        # Update visibility
        visible = request.data.get('visible')
        if visible is not None:
            job.visible = visible
            job.save()
        
        return Response({'message': 'Job visibility updated successfully'}, status=status.HTTP_200_OK)
        
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
def institution_delete_job(request, job_id):
    """Delete a job"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        institution_id = payload['institution_id']
        
        job = Job.objects.get(id=job_id)
        job.delete()
        
        return Response({'message': 'Job deleted successfully'}, status=status.HTTP_200_OK)
        
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found'}, status=status.HTTP_404_NOT_FOUND)

# Institution Application Management Views
@api_view(['GET'])
def institution_all_applications(request):
    """Get all applications across all jobs"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        institution_id = payload['institution_id']
        
        # Get all applications with related data
        applications = JobApplication.objects.select_related('job', 'job__company', 'applicant').all().order_by('-applied_date')
        
        applications_data = []
        for app in applications:
            applications_data.append({
                'id': app.id,
                'applicant_name': app.applicant.name if app.applicant else 'Unknown',
                'applicant_email': app.applicant.email if app.applicant else '',
                'applicant_photo': app.applicant.profile_photo if app.applicant else None,
                'job_title': app.job.title,
                'job_id': app.job.id,
                'company_name': app.job.company.name,
                'company_id': app.job.company.id,
                'status': app.status,
                'applied_date': app.applied_date,
                'resume_link': app.applicant.resume_link if app.applicant else None
            })
        
        return Response(applications_data, status=status.HTTP_200_OK)
        
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['PUT'])
def institution_update_application_status(request, application_id):
    """Update application status"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        institution_id = payload['institution_id']
        
        application = JobApplication.objects.get(id=application_id)
        
        new_status = request.data.get('status')
        if new_status not in ['Pending', 'Accepted', 'Rejected']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        application.status = new_status
        application.save()
        
        return Response({'message': 'Application status updated successfully'}, status=status.HTTP_200_OK)
        
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except JobApplication.DoesNotExist:
        return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

# Company Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def company_signup(request):
    serializer = CompanySerializer(data=request.data)
    if serializer.is_valid():
        company = serializer.save()
        
        # Generate JWT token
        payload = {
            'company_id': company.id,
            'email': company.email,
            'exp': datetime.utcnow() + timedelta(days=7)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
        
        return Response({
            'message': 'Company registered successfully',
            'token': token,
            'company': {
                'id': company.id,
                'name': company.name,
                'email': company.email,
                'image': company.image.url if company.image else None
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def company_login(request):
    serializer = CompanyLoginSerializer(data=request.data)
    if serializer.is_valid():
        company = serializer.validated_data['company']
        
        # Generate JWT token
        payload = {
            'company_id': company.id,
            'email': company.email,
            'exp': datetime.utcnow() + timedelta(days=7)
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
        
        return Response({
            'message': 'Login successful',
            'token': token,
            'company': {
                'id': company.id,
                'name': company.name,
                'email': company.email,
                'image': company.image.url if company.image else None
            }
        }, status=status.HTTP_200_OK)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def company_profile(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        company = Company.objects.get(id=payload['company_id'])
        
        return Response({
            'id': company.id,
            'name': company.name,
            'email': company.email,
            'image': company.image.url if company.image else None
        }, status=status.HTTP_200_OK)
    
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Company.DoesNotExist:
        return Response({'error': 'Company not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
def company_profile_update(request):
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        company = Company.objects.get(id=payload['company_id'])
        
        # Update company fields
        if 'name' in request.data:
            company.name = request.data['name']
        if 'image' in request.FILES:
            company.image = request.FILES['image']
        
        company.save()
        
        return Response({
            'message': 'Profile updated successfully',
            'company': {
                'id': company.id,
                'name': company.name,
                'email': company.email,
                'image': company.image.url if company.image else None
            }
        }, status=status.HTTP_200_OK)
    
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Company.DoesNotExist:
        return Response({'error': 'Company not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def company_applications(request):
    """Get all applications for jobs posted by the authenticated company"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        company_id = payload['company_id']
        
        # Get all jobs posted by this company
        company_jobs = Job.objects.filter(company_id=company_id)
        
        # Get all applications for these jobs
        applications = JobApplication.objects.filter(job__in=company_jobs).select_related('job', 'applicant')
        
        # Serialize the applications with detailed information
        applications_data = []
        for app in applications:
            applications_data.append({
                'id': app.id,
                'applicant_name': app.applicant.name,
                'applicant_email': app.applicant.email,
                'applicant_photo': app.applicant.profile_photo,
                'job_title': app.job.title,
                'job_location': app.job.location,
                'status': app.status,
                'applied_date': app.applied_date,
                'resume_link': app.applicant.resume_link
            })
        
        return Response(applications_data, status=status.HTTP_200_OK)
        
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Company.DoesNotExist:
        return Response({'error': 'Company not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
def update_application_status(request, application_id):
    """Update the status of a job application"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        company_id = payload['company_id']
        
        # Get the application and verify it belongs to a job posted by this company
        application = JobApplication.objects.select_related('job').get(
            id=application_id, 
            job__company_id=company_id
        )
        
        new_status = request.data.get('status')
        if new_status not in ['Pending', 'Accepted', 'Rejected']:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        application.status = new_status
        application.save()
        
        return Response({'message': 'Application status updated successfully'}, status=status.HTTP_200_OK)
        
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except JobApplication.DoesNotExist:
        return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
def company_jobs(request):
    """Get all jobs posted by the authenticated company"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        company_id = payload['company_id']
        
        # Get all jobs posted by this company
        jobs = Job.objects.filter(company_id=company_id).order_by('-date')
        
        # Serialize the jobs with application count
        jobs_data = []
        for job in jobs:
            application_count = JobApplication.objects.filter(job=job).count()
            jobs_data.append({
                '_id': job.id,
                'id': job.id,
                'title': job.title,
                'location': job.location,
                'level': job.level,
                'description': job.description,
                'salary': job.salary,
                'date': job.date,
                'category': job.category,
                'visible': job.visible,
                'applicants': application_count,
                'company': {
                    'id': job.company.id,
                    'name': job.company.name,
                    'email': job.company.email,
                    'image': job.company.image.url if job.company.image else None
                }
            })
        
        return Response(jobs_data, status=status.HTTP_200_OK)
        
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Company.DoesNotExist:
        return Response({'error': 'Company not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PATCH'])
def update_job_visibility(request, job_id):
    """Update the visibility of a job posted by the authenticated company"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return Response({'error': 'Authorization header required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    token = auth_header.split(' ')[1]
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        company_id = payload['company_id']
        
        # Get the job and verify it belongs to this company
        job = Job.objects.get(id=job_id, company_id=company_id)
        
        # Update visibility
        visible = request.data.get('visible')
        if visible is not None:
            job.visible = visible
            job.save()
        
        return Response({'message': 'Job visibility updated successfully'}, status=status.HTTP_200_OK)
        
    except jwt.ExpiredSignatureError:
        return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
    except Job.DoesNotExist:
        return Response({'error': 'Job not found or not authorized'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([AllowAny])
def user_profile_update(request):
    """Update user profile including resume upload"""
    # Get Clerk user ID from request headers (set by Clerk middleware)
    clerk_user_id = request.headers.get('X-Clerk-User-Id')
    
    if not clerk_user_id:
        return Response({'error': 'User authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        # Try to get existing user, create if doesn't exist
        user, created = ClerkUser.objects.get_or_create(
            clerk_id=clerk_user_id,
            defaults={
                'name': request.data.get('name', ''),
                'email': request.data.get('email', ''),
                'resume_link': request.data.get('resume_link', '')
            }
        )
        
        # Update user fields if user already exists
        if not created:
            if 'name' in request.data:
                user.name = request.data['name']
            if 'email' in request.data:
                user.email = request.data['email']
            if 'resume_link' in request.data:
                user.resume_link = request.data['resume_link']
            user.save()
        
        return Response({
            'message': 'Profile updated successfully',
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'profile_photo': user.profile_photo,
                'resume_link': user.resume_link
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def user_profile(request):
    """Get user profile"""
    clerk_user_id = request.headers.get('X-Clerk-User-Id')
    
    if not clerk_user_id:
        return Response({'error': 'User authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        # Try to get existing user, create if doesn't exist
        user, created = ClerkUser.objects.get_or_create(
            clerk_id=clerk_user_id,
            defaults={
                'name': '',
                'email': '',
                'resume_link': ''
            }
        )
        
        return Response({
            'id': user.id,
            'name': user.name,
            'email': user.email,
            'profile_photo': user.profile_photo,
            'resume_link': user.resume_link
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': f'An error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)