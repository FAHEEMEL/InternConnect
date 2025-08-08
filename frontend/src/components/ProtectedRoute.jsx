import React from 'react';
import { useCompany } from '../context/CompanyContext';

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useCompany();

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
                    <p className="text-gray-600">Please log in as a company to access this page.</p>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;