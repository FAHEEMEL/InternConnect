import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const InstitutionContext = createContext();

export { InstitutionContext };

export const useInstitution = () => {
    const context = useContext(InstitutionContext);
    if (!context) {
        throw new Error('useInstitution must be used within an InstitutionProvider');
    }
    return context;
};

export const InstitutionProvider = ({ children }) => {
    const [institution, setInstitution] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('institutionToken'));
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
            
            const response = await axios.post('http://localhost:8000/api/institution/login/', {
                email,
                password
            });

            const { token: newToken, institution: institutionData } = response.data;
            
            setToken(newToken);
            setInstitution(institutionData);
            localStorage.setItem('institutionToken', newToken);
            
            return { success: true, message: 'Login successful' };
        } catch (err) {
            const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Login failed';
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const signup = async (name, email, password, address, phone, website) => {
        try {
            setLoading(true);
            setError('');
            
            const response = await axios.post('http://localhost:8000/api/institution/signup/', {
                name,
                email,
                password,
                address,
                phone,
                website
            });

            const { token: newToken, institution: institutionData } = response.data;
            
            setToken(newToken);
            setInstitution(institutionData);
            localStorage.setItem('institutionToken', newToken);
            
            return { success: true, message: 'Institution registered successfully' };
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
        setInstitution(null);
        localStorage.removeItem('institutionToken');
        delete axios.defaults.headers.common['Authorization'];
    };

    const fetchProfile = async () => {
        if (!token) return;
        
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8000/api/institution/profile/');
            setInstitution(response.data);
        } catch (err) {
            console.error('Error fetching institution profile:', err);
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
        institution,
        token,
        loading,
        error,
        login,
        signup,
        logout,
        fetchProfile,
        isAuthenticated: !!token && !!institution
    };

    return (
        <InstitutionContext.Provider value={value}>
            {children}
        </InstitutionContext.Provider>
    );
};