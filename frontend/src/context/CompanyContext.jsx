import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const CompanyContext = createContext();

export { CompanyContext };

export const useCompany = () => {
    const context = useContext(CompanyContext);
    if (!context) {
        throw new Error('useCompany must be used within a CompanyProvider');
    }
    return context;
};

export const CompanyProvider = ({ children }) => {
    const [company, setCompany] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('companyToken'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Configure axios to include token in requests
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    const login = async (email, password) => {
        try {
            setLoading(true);
            setError('');
            
            const response = await axios.post('http://localhost:8000/api/company/login/', {
                email,
                password
            });

            const { token: newToken, company: companyData } = response.data;
            
            setToken(newToken);
            setCompany(companyData);
            localStorage.setItem('companyToken', newToken);
            
            return { success: true, message: 'Login successful' };
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Login failed';
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const signup = async (name, email, password) => {
        try {
            setLoading(true);
            setError('');
            
            const response = await axios.post('http://localhost:8000/api/company/signup/', {
                name,
                email,
                password
            });

            const { token: newToken, company: companyData } = response.data;
            
            setToken(newToken);
            setCompany(companyData);
            localStorage.setItem('companyToken', newToken);
            
            return { success: true, message: 'Company registered successfully' };
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Registration failed';
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setToken(null);
        setCompany(null);
        localStorage.removeItem('companyToken');
        delete axios.defaults.headers.common['Authorization'];
    };

    const fetchProfile = async () => {
        if (!token) return;
        
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8000/api/company/profile/');
            setCompany(response.data);
        } catch (err) {
            console.error('Error fetching company profile:', err);
            if (err.response?.status === 401) {
                logout(); // Token expired or invalid
            }
        } finally {
            setLoading(false);
        }
    };

    // Check if user is logged in on component mount
    useEffect(() => {
        if (token) {
            fetchProfile();
        }
    }, [token]);

    const value = {
        company,
        token,
        loading,
        error,
        login,
        signup,
        logout,
        fetchProfile,
        isAuthenticated: !!token && !!company
    };

    return (
        <CompanyContext.Provider value={value}>
            {children}
        </CompanyContext.Provider>
    );
};