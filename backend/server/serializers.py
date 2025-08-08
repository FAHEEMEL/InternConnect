from rest_framework import serializers
from .models import Job, Company, JobApplication, ClerkUser, Institution

class CompanySerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Company
        fields = ['id', 'name', 'email', 'password', 'image', 'created_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        company = Company(**validated_data)
        company.set_password(password)
        company.save()
        return company

class CompanyLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            try:
                company = Company.objects.get(email=email)
                if not company.check_password(password):
                    raise serializers.ValidationError('Invalid credentials')
                data['company'] = company
            except Company.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials')
        else:
            raise serializers.ValidationError('Email and password are required')
        
        return data

class InstitutionSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Institution
        fields = ['id', 'name', 'email', 'password', 'image', 'address', 'phone', 'website', 'created_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def create(self, validated_data):
        password = validated_data.pop('password')
        institution = Institution(**validated_data)
        institution.set_password(password)
        institution.save()
        return institution

class InstitutionLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            try:
                institution = Institution.objects.get(email=email)
                if not institution.check_password(password):
                    raise serializers.ValidationError('Invalid credentials')
                data['institution'] = institution
            except Institution.DoesNotExist:
                raise serializers.ValidationError('Invalid credentials')
        else:
            raise serializers.ValidationError('Email and password are required')
        
        return data

class JobSerializer(serializers.ModelSerializer):
    _id = serializers.SerializerMethodField(read_only=True)
    company = CompanySerializer(read_only=True)

    class Meta:
        model = Job
        fields = '__all__'

    def get__id(self, obj):
        return obj.id

    # Remove the problematic create method - let the view handle company association

class JobApplicationSerializer(serializers.ModelSerializer):
    applicant_clerk_id = serializers.CharField(write_only=True)
    job_id = serializers.IntegerField(write_only=True)  # Accept job_id for creation
    applicant = serializers.PrimaryKeyRelatedField(read_only=True)
    job = JobSerializer(read_only=True)  # For reading job details

    class Meta:
        model = JobApplication
        fields = ['id', 'job', 'applicant', 'status', 'applied_date', 'applicant_clerk_id', 'job_id']

    def create(self, validated_data):
        clerk_id = validated_data.pop('applicant_clerk_id')
        job_id = validated_data.pop('job_id')
        
        try:
            clerk_user = ClerkUser.objects.get(clerk_id=clerk_id)
        except ClerkUser.DoesNotExist:
            raise serializers.ValidationError("ClerkUser with this ID does not exist.")
        
        try:
            job = Job.objects.get(id=job_id)
        except Job.DoesNotExist:
            raise serializers.ValidationError("Job with this ID does not exist.")
        
        validated_data['applicant'] = clerk_user
        validated_data['job'] = job
        return super().create(validated_data)