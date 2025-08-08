from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'jobs', views.JobViewSet)
router.register(r'companies', views.CompanyViewSet)
router.register(r'applications', views.JobApplicationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('categories/', views.get_job_categories),
    path('locations/', views.get_job_locations),
    path("clerk/webhook/", views.clerk_webhook, name="clerk_webhook"),
    
    # Company Authentication URLs
    path('company/signup/', views.company_signup, name='company_signup'),
    path('company/login/', views.company_login, name='company_login'),
    path('company/profile/', views.company_profile, name='company_profile'),
    path('company/profile/update/', views.company_profile_update, name='company_profile_update'),
    
    # Company Jobs URLs
    path('company/jobs/', views.company_jobs, name='company_jobs'),
    path('company/jobs/<int:job_id>/visibility/', views.update_job_visibility, name='update_job_visibility'),
    
    # Company Applications URLs
    path('company/applications/', views.company_applications, name='company_applications'),
    path('company/applications/<int:application_id>/status/', views.update_application_status, name='update_application_status'),
    
    # Institution Authentication URLs
    path('institution/signup/', views.institution_signup, name='institution_signup'),
    path('institution/login/', views.institution_login, name='institution_login'),
    path('institution/profile/', views.institution_profile, name='institution_profile'),
    path('institution/profile/update/', views.institution_profile_update, name='institution_profile_update'),
    
    # Institution Company Management URLs
    path('institution/companies/', views.institution_companies, name='institution_companies'),
    path('institution/companies/create/', views.institution_create_company, name='institution_create_company'),
    path('institution/companies/<int:company_id>/update/', views.institution_update_company, name='institution_update_company'),
    path('institution/companies/<int:company_id>/delete/', views.institution_delete_company, name='institution_delete_company'),
    
    # Institution Job Management URLs
    path('institution/jobs/', views.institution_all_jobs, name='institution_all_jobs'),
    path('institution/jobs/<int:job_id>/visibility/', views.institution_update_job_visibility, name='institution_update_job_visibility'),
    path('institution/jobs/<int:job_id>/delete/', views.institution_delete_job, name='institution_delete_job'),
    
    # Institution Application Management URLs
    path('institution/applications/', views.institution_all_applications, name='institution_all_applications'),
    path('institution/applications/<int:application_id>/status/', views.institution_update_application_status, name='institution_update_application_status'),
    
    # User Profile URLs
    path('user/profile/', views.user_profile, name='user_profile'),
    path('user/profile/update/', views.user_profile_update, name='user_profile_update'),
]