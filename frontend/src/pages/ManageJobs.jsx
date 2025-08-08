import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { CompanyContext } from '../context/CompanyContext';
import { toast } from 'react-toastify';

const ManageJobs = () => {
    const navigate = useNavigate();
    const { token, company } = useContext(CompanyContext);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchJobs();
        }
    }, [token]);

    const fetchJobs = async () => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
            const response = await axios.get(`${backendUrl}/api/company/jobs/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            setJobs(response.data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast.error('Failed to fetch jobs');
        }
        setLoading(false);
    };

    const handleToggleVisibility = async (jobId, currentVisibility) => {
        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
            await axios.patch(`${backendUrl}/api/company/jobs/${jobId}/visibility/`, {
                visible: !currentVisibility
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // Update the local state
            setJobs(prevJobs => 
                prevJobs.map(job => 
                    job.id === jobId 
                        ? { ...job, visible: !currentVisibility }
                        : job
                )
            );
            
            toast.success(`Job ${!currentVisibility ? 'published' : 'hidden'} successfully`);
        } catch (error) {
            console.error('Error updating visibility:', error);
            toast.error('Failed to update job visibility');
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
                await axios.delete(`${backendUrl}/api/jobs/${jobId}/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                // Remove the job from local state
                setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
                toast.success('Job deleted successfully');
            } catch (error) {
                console.error('Error deleting job:', error);
                toast.error('Failed to delete job');
            }
        }
    };

    if (!token) {
        return (
            <div className="text-center py-8">
                <p className="text-gray-600">Please log in to manage your jobs.</p>
            </div>
        );
    }

    return (
        <div className='container max-w-6xl p-4'>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Manage Jobs</h1>
                <button 
                    onClick={() => navigate('/dashboard/add-job')} 
                    className='bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors'
                >
                    Add New Job
                </button>
            </div>

            <div className='overflow-x-auto bg-white rounded-lg shadow-sm'>
                <table className='min-w-full border border-gray-200'>
                    <thead className="bg-gray-50">
                        <tr>
                            <th className='py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200 max-sm:hidden'>#</th>
                            <th className='py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200'>Job Title</th>
                            <th className='py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200 max-sm:hidden'>Date Posted</th>
                            <th className='py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200 max-sm:hidden'>Location</th>
                            <th className='py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200'>Salary</th>
                            <th className='py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200'>Applicants</th>
                            <th className='py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200'>Status</th>
                            <th className='py-3 px-4 text-left font-semibold text-gray-700 border-b border-gray-200'>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" className='py-8 px-4 text-center text-gray-500'>
                                    Loading jobs...
                                </td>
                            </tr>
                        ) : jobs.length === 0 ? (
                            <tr>
                                <td colSpan="8" className='py-8 px-4 text-center text-gray-500'>
                                    <div>
                                        <p className="mb-2">No jobs posted yet.</p>
                                        <button 
                                            onClick={() => navigate('/dashboard/add-job')}
                                            className="text-blue-600 hover:text-blue-800 underline"
                                        >
                                            Post your first job
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            jobs.map((job, index) => (
                                <tr key={job.id} className='text-gray-700 hover:bg-gray-50'>
                                    <td className='py-3 px-4 border-b border-gray-200 max-sm:hidden'>
                                        {index + 1}
                                    </td>
                                    <td className='py-3 px-4 border-b border-gray-200'>
                                        <div>
                                            <div className="font-medium">{job.title}</div>
                                            <div className="text-sm text-gray-500">{job.category}</div>
                                        </div>
                                    </td>
                                    <td className='py-3 px-4 border-b border-gray-200 max-sm:hidden'>
                                        {moment(job.date).format('MMM DD, YYYY')}
                                    </td>
                                    <td className='py-3 px-4 border-b border-gray-200 max-sm:hidden'>
                                        {job.location}
                                    </td>
                                    <td className='py-3 px-4 border-b border-gray-200'>
                                        ${job.salary?.toLocaleString() || 'N/A'}
                                    </td>
                                    <td className='py-3 px-4 border-b border-gray-200 text-center'>
                                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                                            {job.applicants || 0}
                                        </span>
                                    </td>
                                    <td className='py-3 px-4 border-b border-gray-200'>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            job.visible 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {job.visible ? 'Published' : 'Hidden'}
                                        </span>
                                    </td>
                                    <td className='py-3 px-4 border-b border-gray-200'>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleToggleVisibility(job.id, job.visible)}
                                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                                    job.visible
                                                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                        : 'bg-green-100 text-green-800 hover:bg-green-200'
                                                }`}
                                                title={job.visible ? 'Hide job' : 'Publish job'}
                                            >
                                                {job.visible ? 'Hide' : 'Publish'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteJob(job.id)}
                                                className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium hover:bg-red-200 transition-colors"
                                                title="Delete job"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageJobs;