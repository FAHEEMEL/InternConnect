import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { InstitutionContext } from '../context/InstitutionContext';

const InstitutionJobs = () => {
    const { token } = useContext(InstitutionContext);
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token) {
            fetchJobs();
        }
    }, [token]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8000/api/institution/jobs/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setJobs(response.data);
        } catch (error) {
            toast.error('Failed to fetch jobs');
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleJobVisibility = async (jobId, currentVisibility) => {
        try {
            await axios.patch(`http://localhost:8000/api/institution/jobs/${jobId}/visibility/`, {
                visible: !currentVisibility
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Job ${!currentVisibility ? 'shown' : 'hidden'} successfully`);
            fetchJobs();
        } catch (error) {
            toast.error('Failed to update job visibility');
            console.error('Error updating job visibility:', error);
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (window.confirm('Are you sure you want to delete this job?')) {
            try {
                await axios.delete(`http://localhost:8000/api/institution/jobs/${jobId}/delete/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Job deleted successfully');
                fetchJobs();
            } catch (error) {
                toast.error('Failed to delete job');
                console.error('Error deleting job:', error);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage All Jobs</h2>
                <div className="text-sm text-gray-600">
                    Total Jobs: <span className="font-semibold">{jobs.length}</span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="mt-2 text-gray-600">Loading jobs...</p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {jobs.map((job) => (
                            <li key={job.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-lg font-medium text-gray-900">{job.title}</h3>
                                            <div className="flex items-center space-x-2">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    job.visible 
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {job.visible ? 'Visible' : 'Hidden'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center text-sm text-gray-500">
                                            <span className="font-medium">{job.company.name}</span>
                                            <span className="mx-2">•</span>
                                            <span>{job.location}</span>
                                            <span className="mx-2">•</span>
                                            <span className="capitalize">{job.category}</span>
                                        </div>
                                        <div className="mt-2 flex items-center text-xs text-gray-400">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                {job.applicants} applicants
                                            </span>
                                            <span className="ml-4">
                                                Salary: ${job.salary?.toLocaleString() || 'Not specified'}
                                            </span>
                                        </div>
                                        {job.description && (
                                            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                                                {job.description.length > 150 
                                                    ? `${job.description.substring(0, 150)}...` 
                                                    : job.description
                                                }
                                            </p>
                                        )}
                                    </div>
                                    <div className="ml-6 flex flex-col space-y-2">
                                        <button
                                            onClick={() => handleToggleJobVisibility(job.id, job.visible)}
                                            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                                job.visible 
                                                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                            }`}
                                        >
                                            {job.visible ? 'Hide' : 'Show'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteJob(job.id)}
                                            className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {jobs.length === 0 && (
                            <li className="px-6 py-8 text-center text-gray-500">
                                No jobs found. Companies need to post jobs first.
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default InstitutionJobs;