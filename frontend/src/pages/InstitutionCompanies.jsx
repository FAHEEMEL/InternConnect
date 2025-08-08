import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { InstitutionContext } from '../context/InstitutionContext';

const InstitutionCompanies = () => {
    const { token } = useContext(InstitutionContext);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreateCompany, setShowCreateCompany] = useState(false);
    const [editingCompany, setEditingCompany] = useState(null);
    const [companyForm, setCompanyForm] = useState({
        name: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        if (token) {
            fetchCompanies();
        }
    }, [token]);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8000/api/institution/companies/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCompanies(response.data);
        } catch (error) {
            toast.error('Failed to fetch companies');
            console.error('Error fetching companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/api/institution/companies/create/', companyForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Company created successfully');
            setShowCreateCompany(false);
            setCompanyForm({ name: '', email: '', password: '' });
            fetchCompanies();
        } catch (error) {
            toast.error('Failed to create company');
            console.error('Error creating company:', error);
        }
    };

    const handleUpdateCompany = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`http://localhost:8000/api/institution/companies/${editingCompany.id}/update/`, companyForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Company updated successfully');
            setEditingCompany(null);
            setCompanyForm({ name: '', email: '', password: '' });
            fetchCompanies();
        } catch (error) {
            toast.error('Failed to update company');
            console.error('Error updating company:', error);
        }
    };

    const handleDeleteCompany = async (companyId) => {
        if (window.confirm('Are you sure you want to delete this company?')) {
            try {
                await axios.delete(`http://localhost:8000/api/institution/companies/${companyId}/delete/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                toast.success('Company deleted successfully');
                fetchCompanies();
            } catch (error) {
                toast.error('Failed to delete company');
                console.error('Error deleting company:', error);
            }
        }
    };

    const startEditCompany = (company) => {
        setEditingCompany(company);
        setCompanyForm({
            name: company.name,
            email: company.email,
            password: ''
        });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Manage Companies</h2>
                <button
                    onClick={() => setShowCreateCompany(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                    Add Company
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="mt-2 text-gray-600">Loading companies...</p>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                        {companies.map((company) => (
                            <li key={company.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-12 w-12">
                                            {company.image ? (
                                                <img className="h-12 w-12 rounded-full object-cover" src={company.image} alt="" />
                                            ) : (
                                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                                    <span className="text-lg font-medium text-green-700">
                                                        {company.name.charAt(0)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-lg font-medium text-gray-900">{company.name}</div>
                                            <div className="text-sm text-gray-500">{company.email}</div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {company.job_count} jobs
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button
                                            onClick={() => startEditCompany(company)}
                                            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCompany(company.id)}
                                            className="text-red-600 hover:text-red-800 font-medium transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {companies.length === 0 && (
                            <li className="px-6 py-8 text-center text-gray-500">
                                No companies found. Create your first company to get started.
                            </li>
                        )}
                    </ul>
                </div>
            )}

            {/* Create/Edit Company Modal */}
            {(showCreateCompany || editingCompany) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900">
                            {editingCompany ? 'Edit Company' : 'Create Company'}
                        </h3>
                        <form onSubmit={editingCompany ? handleUpdateCompany : handleCreateCompany}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                    <input
                                        type="text"
                                        value={companyForm.name}
                                        onChange={(e) => setCompanyForm({...companyForm, name: e.target.value})}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        required
                                        placeholder="Enter company name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={companyForm.email}
                                        onChange={(e) => setCompanyForm({...companyForm, email: e.target.value})}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        required
                                        placeholder="Enter company email"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password {editingCompany && '(leave blank to keep current)'}
                                    </label>
                                    <input
                                        type="password"
                                        value={companyForm.password}
                                        onChange={(e) => setCompanyForm({...companyForm, password: e.target.value})}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        required={!editingCompany}
                                        placeholder="Enter password"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateCompany(false);
                                        setEditingCompany(null);
                                        setCompanyForm({ name: '', email: '', password: '' });
                                    }}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                >
                                    {editingCompany ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstitutionCompanies;