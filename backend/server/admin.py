from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Company, Institution, Job, JobApplication, ClerkUser

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'job_count', 'image_preview', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('name', 'email')
    readonly_fields = ('created_at', 'updated_at', 'password')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'email', 'image')
        }),
        ('Security', {
            'fields': ('password',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def job_count(self, obj):
        count = obj.jobs.count()
        url = reverse('admin:server_job_changelist') + f'?company__id__exact={obj.id}'
        return format_html('<a href="{}">{} jobs</a>', url, count)
    job_count.short_description = 'Jobs Posted'
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 50%;" />', obj.image.url)
        return "No Image"
    image_preview.short_description = 'Logo'

@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'company_count', 'total_jobs', 'image_preview', 'created_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('name', 'email', 'address')
    readonly_fields = ('created_at', 'updated_at', 'password')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'email', 'image')
        }),
        ('Contact Information', {
            'fields': ('address', 'phone', 'website')
        }),
        ('Security', {
            'fields': ('password',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def company_count(self, obj):
        # This would need a relationship field in the model, for now showing placeholder
        return "N/A"  # You might need to add a relationship or calculate this
    company_count.short_description = 'Companies'
    
    def total_jobs(self, obj):
        # This would need to be calculated based on institution's companies
        return "N/A"  # You might need to add this calculation
    total_jobs.short_description = 'Total Jobs'
    
    def image_preview(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 50%;" />', obj.image.url)
        return "No Image"
    image_preview.short_description = 'Logo'

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('title', 'company', 'location', 'level', 'salary_formatted', 'category', 'visible', 'application_count', 'date')
    list_filter = ('level', 'category', 'visible', 'date', 'company')
    search_fields = ('title', 'company__name', 'location', 'category')
    list_editable = ('visible',)
    readonly_fields = ('date',)
    ordering = ('-date',)
    
    fieldsets = (
        ('Job Information', {
            'fields': ('title', 'company', 'location', 'level', 'category')
        }),
        ('Job Details', {
            'fields': ('description', 'salary', 'visible')
        }),
        ('Timestamps', {
            'fields': ('date',),
            'classes': ('collapse',)
        }),
    )
    
    def salary_formatted(self, obj):
        return f"${obj.salary:,}"
    salary_formatted.short_description = 'Salary'
    salary_formatted.admin_order_field = 'salary'
    
    def application_count(self, obj):
        count = obj.jobapplication_set.count()
        url = reverse('admin:server_jobapplication_changelist') + f'?job__id__exact={obj.id}'
        return format_html('<a href="{}">{} applications</a>', url, count)
    application_count.short_description = 'Applications'
    
    actions = ['make_visible', 'make_hidden']
    
    def make_visible(self, request, queryset):
        updated = queryset.update(visible=True)
        self.message_user(request, f'{updated} jobs were successfully made visible.')
    make_visible.short_description = "Make selected jobs visible"
    
    def make_hidden(self, request, queryset):
        updated = queryset.update(visible=False)
        self.message_user(request, f'{updated} jobs were successfully hidden.')
    make_hidden.short_description = "Hide selected jobs"

@admin.register(JobApplication)
class JobApplicationAdmin(admin.ModelAdmin):
    list_display = ('applicant_name', 'job_title', 'company_name', 'status', 'applied_date', 'resume_link_display')
    list_filter = ('status', 'applied_date', 'job__company', 'job__category')
    search_fields = ('applicant__name', 'applicant__email', 'job__title', 'job__company__name')
    list_editable = ('status',)
    readonly_fields = ('applied_date',)
    ordering = ('-applied_date',)
    
    fieldsets = (
        ('Application Information', {
            'fields': ('job', 'applicant', 'status')
        }),
        ('Timestamps', {
            'fields': ('applied_date',),
            'classes': ('collapse',)
        }),
    )
    
    def applicant_name(self, obj):
        return obj.applicant.name
    applicant_name.short_description = 'Applicant'
    applicant_name.admin_order_field = 'applicant__name'
    
    def job_title(self, obj):
        return obj.job.title
    job_title.short_description = 'Job'
    job_title.admin_order_field = 'job__title'
    
    def company_name(self, obj):
        return obj.job.company.name
    company_name.short_description = 'Company'
    company_name.admin_order_field = 'job__company__name'
    
    def resume_link_display(self, obj):
        if obj.applicant.resume_link:
            return format_html('<a href="{}" target="_blank">View Resume</a>', obj.applicant.resume_link)
        return "No Resume"
    resume_link_display.short_description = 'Resume'
    
    actions = ['accept_applications', 'reject_applications', 'reset_to_pending']
    
    def accept_applications(self, request, queryset):
        updated = queryset.update(status='Accepted')
        self.message_user(request, f'{updated} applications were accepted.')
    accept_applications.short_description = "Accept selected applications"
    
    def reject_applications(self, request, queryset):
        updated = queryset.update(status='Rejected')
        self.message_user(request, f'{updated} applications were rejected.')
    reject_applications.short_description = "Reject selected applications"
    
    def reset_to_pending(self, request, queryset):
        updated = queryset.update(status='Pending')
        self.message_user(request, f'{updated} applications were reset to pending.')
    reset_to_pending.short_description = "Reset selected applications to pending"

@admin.register(ClerkUser)
class ClerkUserAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'profile_photo_preview', 'application_count', 'resume_status', 'created_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('name', 'email', 'clerk_id')
    readonly_fields = ('clerk_id', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    
    fieldsets = (
        ('User Information', {
            'fields': ('clerk_id', 'name', 'email')
        }),
        ('Profile', {
            'fields': ('profile_photo', 'resume_link')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def profile_photo_preview(self, obj):
        if obj.profile_photo:
            return format_html('<img src="{}" width="50" height="50" style="border-radius: 50%;" />', obj.profile_photo)
        return "No Photo"
    profile_photo_preview.short_description = 'Photo'
    
    def application_count(self, obj):
        count = obj.jobapplication_set.count()
        url = reverse('admin:server_jobapplication_changelist') + f'?applicant__id__exact={obj.id}'
        return format_html('<a href="{}">{} applications</a>', url, count)
    application_count.short_description = 'Applications'
    
    def resume_status(self, obj):
        if obj.resume_link:
            return format_html('<span style="color: green;">✓ Has Resume</span>')
        return format_html('<span style="color: red;">✗ No Resume</span>')
    resume_status.short_description = 'Resume'

# Customize the admin site header and title
admin.site.site_header = "Job Portal Administration"
admin.site.site_title = "Job Portal Admin"
admin.site.index_title = "Welcome to Job Portal Administration"
