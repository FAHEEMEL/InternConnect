import { useState, useEffect } from 'react';
import moment from 'moment';
import NavBar from '../components/NavBar';
import axios from 'axios';
import { useUser } from '@clerk/clerk-react';
import { assets } from '../assets/assets';
import { toast } from 'react-toastify';
import { uploadFile, validateFile } from '../utils/fileUpload';

const Applications = () => {
  const [isEdit, setIsEdit] = useState(false);
  const [resume, setResume] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [jobsApplied, setJobsApplied] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { user } = useUser();

  // Debug: Log user information
  useEffect(() => {
    console.log('Current user:', user);
    if (user) {
      console.log('User ID:', user.id);
    }
  }, [user]);

  // Fetch user profile and applications
  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchApplications();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile with ID:', user.id);
      const response = await axios.get('http://localhost:8000/api/user/profile/', {
        headers: {
          'X-Clerk-User-Id': user.id
        }
      });
      console.log('Profile response:', response.data);
      setUserProfile(response.data);
      setResumeUrl(response.data.resume_link || '');
    } catch (error) {
      console.error('Error fetching user profile:', error);
      console.error('Error response:', error.response?.data);
      // If user doesn't exist, it's okay - they haven't uploaded a resume yet
      if (error.response?.status !== 404) {
        toast.error('Failed to load profile data');
      }
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/applications/', {
        params: { applicant_clerk_id: user.id }
      });
      setJobsApplied(response.data);
    } catch (error) {
      console.error('Error fetching applications:', error);
      // Don't show error for applications as it's not critical
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // Validate file first
      validateFile(file);
      setResume(file);
      
      // Show upload progress
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Upload file
      const uploadResult = await uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setResumeUrl(uploadResult.url);
      toast.success('File uploaded successfully!');
      
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 2000);
    } catch (error) {
      toast.error(error.message);
      setResume(null);
      setUploadProgress(0);
    }
  };

  const handleSaveResume = async () => {
    if (!resumeUrl) {
      toast.error('Please upload a resume file or provide a resume URL');
      return;
    }

    if (!user || !user.id) {
      toast.error('User authentication required. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      console.log('Saving resume with URL:', resumeUrl);
      console.log('User ID:', user.id);
      
      const response = await axios.put('http://localhost:8000/api/user/profile/update/', {
        resume_link: resumeUrl
      }, {
        headers: {
          'X-Clerk-User-Id': user.id,
          'Content-Type': 'application/json'
        }
      });

      console.log('Save response:', response.data);
      toast.success('Resume updated successfully!');
      setIsEdit(false);
      setUploadProgress(0);
      fetchUserProfile(); // Refresh profile data
    } catch (error) {
      console.error('Error updating resume:', error);
      console.error('Error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else if (error.response?.status === 404) {
        toast.error('User profile not found. Please try logging out and back in.');
      } else {
        toast.error(`Failed to update resume: ${error.response?.data?.error || error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUrlChange = (e) => {
    setResumeUrl(e.target.value);
    setResume(null); // Clear file if URL is being used
    setUploadProgress(0);
  };

  const handleCancel = () => {
    setIsEdit(false);
    setResume(null);
    setResumeUrl(userProfile?.resume_link || '');
    setUploadProgress(0);
  };

  // Show loading if user is not loaded yet
  if (!user) {
    return (
      <div>
        <NavBar />
        <div className='container mx-auto my-10 p-4'>
          <div className='text-center'>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <div className='container mx-auto my-10 p-4'>
        <h2 className='text-xl font-semibold'>Your Resume</h2>
        <div className='flex gap-2 mb-6'>
          {isEdit ? (
            <div className='flex flex-col gap-4 w-full max-w-md'>
              <div>
                <label className='block text-sm font-medium mb-2'>Upload Resume File:</label>
                <div className='relative'>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className='w-full p-2 border border-gray-300 rounded'
                  />
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className='mt-2'>
                      <div className='bg-gray-200 rounded-full h-2'>
                        <div 
                          className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <span className='text-xs text-gray-500'>Uploading... {uploadProgress}%</span>
                    </div>
                  )}
                </div>
                <p className='text-xs text-gray-500 mt-1'>
                  Accepted formats: PDF, DOC, DOCX (Max 5MB)
                </p>
              </div>
              
              <div className='text-center text-gray-500'>OR</div>
              
              <div>
                <label className='block text-sm font-medium mb-2'>Resume URL:</label>
                <input
                  type="url"
                  value={resumeUrl}
                  onChange={handleResumeUrlChange}
                  placeholder="https://example.com/your-resume.pdf"
                  className='w-full p-2 border border-gray-300 rounded'
                />
              </div>

              {resume && (
                <div className='bg-green-50 border border-green-200 p-3 rounded'>
                  <div className='flex items-center gap-2'>
                    <img src={assets.resume_selected} alt="File" className='w-5 h-5' />
                    <span className='text-sm text-green-700'>
                      {resume.name} ({(resume.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                </div>
              )}

              <div className='flex gap-2'>
                <button
                  onClick={handleSaveResume}
                  disabled={loading || !resumeUrl}
                  className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {loading ? 'Saving...' : 'Save Resume'}
                </button>
                <button
                  onClick={handleCancel}
                  className='bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600'
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <img 
                  src={userProfile?.resume_link ? assets.resume_selected : assets.resume_not_selected} 
                  alt="Resume status" 
                  className='w-6 h-6'
                />
                <span className={userProfile?.resume_link ? 'text-green-600' : 'text-gray-500'}>
                  {userProfile?.resume_link ? 'Resume uploaded' : 'No resume uploaded'}
                </span>
              </div>
              
              {userProfile?.resume_link && (
                <a
                  href={userProfile.resume_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className='text-blue-600 hover:text-blue-800 underline'
                >
                  View Resume
                </a>
              )}
              
              <button
                onClick={() => setIsEdit(true)}
                className='bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700'
              >
                {userProfile?.resume_link ? 'Update Resume' : 'Upload Resume'}
              </button>
            </div>
          )}
        </div>

        <hr className='my-6' />

        <h2 className='text-xl font-semibold mb-4'>Jobs Applied</h2>
        <div className='overflow-x-auto'>
          <table className='min-w-full bg-white border border-gray-200 rounded-lg shadow'>
            <thead className='bg-gray-50'>
              <tr>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Company
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Job Title
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Location
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Date Applied
                </th>
                <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                  Status
                </th>
              </tr>
            </thead>
            <tbody className='bg-white divide-y divide-gray-200'>
              {jobsApplied.length > 0 ? (
                jobsApplied.map((application, index) => (
                  <tr key={index} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <img 
                          src={application.job?.company?.image || assets.company_icon} 
                          alt="Company" 
                          className='w-8 h-8 rounded mr-3'
                        />
                        <span className='text-sm font-medium text-gray-900'>
                          {application.job?.company?.name || 'Unknown Company'}
                        </span>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {application.job?.title || 'Unknown Position'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {application.job?.location || 'Unknown Location'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {moment(application.applied_date).format('MMM DD, YYYY')}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        application.status === 'Accepted' 
                          ? 'bg-green-100 text-green-800'
                          : application.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {application.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className='px-6 py-4 text-center text-gray-500'>
                    No applications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Applications;