import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { InstitutionContext } from '../context/InstitutionContext';

const InstitutionApplications = () => {
    const { token } = useContext(InstitutionContext);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        if (token) {
            fetchApplications();
        }
    }, [token]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8000/api/institution/applications/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApplications(response.data);
        } catch (error) {
            toast.error('Failed to fetch applications');
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateApplicationStatus = async (applicationId, newStatus) => {
        try {
            await axios.put(`http://localhost:8000/api/institution/applications/${applicationId}/status/`, {
                status: newStatus
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Application status updated');
            fetchApplications();
        } catch (error) {
            toast.error('Failed to update application status');
            console.error('Error updating application status:', error);
        }
    };

    const filteredApplications = applications.filter(app => 
        filterStatus === 'all' || app.status.toLowerCase() === filterStatus.toLowerCase()
    );

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'accepted':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            case 'pending':
            default:
                return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage All Applications</h2>
                <div className="flex items-center space-x-4">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                        <option value="all">All Applications</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                    </select>
                    <div className="text-sm text-gray-600">
                        Showing: <span className="font-semibold">{filteredApplications.length}</span> of {applications.length}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="mt-2 text-gray-600">Loading applications...</p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {filteredApplications.map((application) => (
                            <li key={application.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center flex-1">
                                        <div className="flex-shrink-0 h-12 w-12">
                                            {application.applicant_photo ? (
                                                <img className="h-12 w-12 rounded-full object-cover" src={application.applicant_photo} alt="" />
                                            ) : (
                                                <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                                                    <span className="text-lg font-medium text-gray-700">
                                                        {application.applicant_name.charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4 flex-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-medium text-gray-900">{application.applicant_name}</h3>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                                                    {application.status}
                                                </span>
                                            </div>
                                            <div className="mt-1">
                                                <p className="text-sm font-medium text-gray-700">{application.job_title}</p>
                                                <p className="text-sm text-gray-500">{application.company_name}</p>
                                            </div>
                                            <div className="mt-2 flex items-center text-xs text-gray-400">
                                                <span>Applied: {new Date(application.applied_date).toLocaleDateString()}</span>
                                                {application.resume_link && (
                                                    <>
                                                        <span className="mx-2">•</span>
                                                        <a
                                                            href={application.resume_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            View Resume
                                                        </a>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-6">
                                        <select
                                            value={application.status}
                                            onChange={(e) => handleUpdateApplicationStatus(application.id, e.target.value)}
                                            className="text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Accepted">Accepted</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {filteredApplications.length === 0 && (
                            <li className="px-6 py-8 text-center text-gray-500">
                                {filterStatus === 'all' 
                                    ? 'No applications found.' 
                                    : `No ${filterStatus} applications found.`
                                }
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default InstitutionApplications;