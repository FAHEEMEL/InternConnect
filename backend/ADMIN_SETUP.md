# Django Admin Setup for Job Portal

This guide will help you set up and use the Django admin panel to control everything in your job portal application.

## 🚀 Quick Setup

### 1. Create Admin User

**Option A: Using the setup script (Recommended)**
```bash
cd backend
python setup_admin.py
```

**Option B: Using Django management command**
```bash
cd backend
python manage.py create_admin
```

**Option C: Using Django's built-in command**
```bash
cd backend
python manage.py createsuperuser
```

### 2. Start the Server
```bash
cd backend
python manage.py runserver
```

### 3. Access Admin Panel
Open your browser and go to: **http://localhost:8000/admin/**

**Default Credentials:**
- Username: `admin`
- Password: `admin123`
- Email: `admin@jobportal.com`

⚠️ **Important:** Change the password after first login!

## 📊 Admin Features

### 🏢 Company Management
- **View all companies** with logos, job counts, and creation dates
- **Add/Edit/Delete companies** with full profile management
- **Search and filter** by name, email, or creation date
- **View company jobs** directly from the company list

### 🏫 Institution Management
- **Manage institutions** with complete profile information
- **Track institution statistics** (companies, jobs, applications)
- **Contact information management** (address, phone, website)
- **Logo upload and preview**

### 💼 Job Management
- **Comprehensive job listing** with all details
- **Bulk actions**: Make jobs visible/hidden
- **Advanced filtering** by company, category, level, visibility
- **Salary formatting** with proper currency display
- **Application count** with direct links to applications
- **Search functionality** across job titles, companies, and locations

### 📝 Application Management
- **Complete application overview** with applicant details
- **Status management**: Pending, Accepted, Rejected
- **Bulk status updates** for multiple applications
- **Resume link access** with direct viewing
- **Advanced filtering** by status, date, company, and job category
- **Search across** applicant names, emails, job titles, and companies

### 👥 User Management (ClerkUser)
- **User profile management** with photos and resume links
- **Application tracking** per user
- **Resume status indicators**
- **Search by name, email, or Clerk ID**

## 🎯 Key Admin Features

### 🔍 Search & Filter
- **Global search** across all models
- **Advanced filtering** with multiple criteria
- **Date range filtering** for time-based analysis
- **Status-based filtering** for applications and jobs

### ⚡ Bulk Actions
- **Job visibility control**: Show/hide multiple jobs at once
- **Application status updates**: Accept/reject multiple applications
- **Custom actions** for efficient management

### 📈 Analytics & Insights
- **Job application counts** for each job posting
- **Company job statistics** with direct navigation
- **User application tracking** with resume status
- **Institution overview** with comprehensive statistics

### 🎨 Enhanced UI
- **Image previews** for company/institution logos and user photos
- **Formatted displays** for salaries, dates, and counts
- **Color-coded status indicators** for easy identification
- **Responsive design** for mobile and desktop access

## 🛠️ Advanced Usage

### Custom Filtering
```python
# Filter jobs by company
/admin/server/job/?company__name__icontains=tech

# Filter applications by status
/admin/server/jobapplication/?status=Pending

# Filter by date range
/admin/server/job/?date__gte=2024-01-01
```

### Bulk Operations
1. Select items using checkboxes
2. Choose action from dropdown
3. Click "Go" to execute

### Export Data
- Use Django admin's built-in export functionality
- Filter data first, then export selected items

## 🔐 Security Best Practices

1. **Change default password** immediately after first login
2. **Use strong passwords** for admin accounts
3. **Limit admin access** to trusted personnel only
4. **Regular backups** of the database
5. **Monitor admin logs** for suspicious activity

## 🚨 Troubleshooting

### Can't Access Admin Panel
```bash
# Check if server is running
python manage.py runserver

# Verify admin user exists
python manage.py shell
>>> from django.contrib.auth.models import User
>>> User.objects.filter(is_superuser=True)
```

### Forgot Admin Password
```bash
# Reset password
python manage.py changepassword admin
```

### Database Issues
```bash
# Apply migrations
python manage.py migrate

# Create fresh admin user
python manage.py createsuperuser
```

## 📱 Mobile Access

The admin panel is responsive and works on mobile devices:
- **Touch-friendly interface**
- **Optimized layouts** for small screens
- **Swipe gestures** for navigation

## 🔄 Regular Maintenance

### Daily Tasks
- Review new job applications
- Monitor job posting activity
- Check user registrations

### Weekly Tasks
- Analyze application trends
- Review company activity
- Clean up old data if needed

### Monthly Tasks
- User account audits
- Performance monitoring
- Backup verification

## 📞 Support

For technical issues or questions about the admin panel:
1. Check the troubleshooting section above
2. Review Django admin documentation
3. Contact your development team

---

**Happy Administrating! 🎉**