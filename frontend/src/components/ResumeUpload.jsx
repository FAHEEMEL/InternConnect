import React, { useState, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ResumeUpload = ({ onUploadSuccess }) => {
  const { user } = useUser();
  const [uploading, setUploading] = useState(false);
  const [currentResume, setCurrentResume] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch current resume on component mount
  React.useEffect(() => {
    if (user) {
      fetchCurrentResume();
    }
  }, [user]);

  const fetchCurrentResume = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/users/${user.id}/resume/`);
      if (response.data.resume_file) {
        setCurrentResume(response.data.resume_file);
      }
    } catch (error) {
      // No resume found or error - this is okay
      console.log('No resume found or error fetching resume');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleUpload = async (file) => {
    if (!user) {
      toast.error('Please sign in to upload a resume');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('resume_file', file);

      const response = await axios.post(
        `http://localhost:8000/api/users/${user.id}/resume/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setCurrentResume(response.data.resume_file);
      toast.success('Resume uploaded successfully!');
      
      if (onUploadSuccess) {
        onUploadSuccess(response.data);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload resume');
    } finally {
      setUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!user || !currentResume) return;

    if (!window.confirm('Are you sure you want to delete your resume?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/api/users/${user.id}/resume/`);
      setCurrentResume(null);
      toast.success('Resume deleted successfully!');
      
      if (onUploadSuccess) {
        onUploadSuccess({ resume_file: null });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete resume');
    }
  };

  const getFileName = (filePath) => {
    if (!filePath) return '';
    return filePath.split('/').pop();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Resume</h3>
      
      {currentResume ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">{getFileName(currentResume)}</p>
                <p className="text-sm text-gray-500">Current resume</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <a
                href={`http://localhost:8000${currentResume}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                View
              </a>
              <button
                onClick={handleDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Want to upload a new resume?</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="resume-upload-replace"
            />
            <label
              htmlFor="resume-upload-replace"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              {uploading ? 'Uploading...' : 'Replace Resume'}
            </label>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer"
              >
                {uploading ? 'Uploading...' : 'Upload Resume'}
              </label>
              <p className="mt-2 text-sm text-gray-600">
                PDF, DOC, or DOCX files up to 5MB
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;