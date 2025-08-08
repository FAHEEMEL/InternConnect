import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AppContext = createContext();

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: false  // Change this to false
});

export const AppContextProvider = ({ children }) => {
    const [jobs, setJobs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [locations, setLocations] = useState([]);
    const [isSearched, setIsSearched] = useState(false);
    const [searchFilter, setSearchFilter] = useState({
        title: '',
        location: ''
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Company login state management
    const [showCompanyLogin, setShowCompanyLogin] = useState(false);
    
    // Institution login state management
    const [showInstitutionLogin, setShowInstitutionLogin] = useState(false);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/jobs/', {
                params: {
                    title: searchFilter.title || undefined,
                    location: searchFilter.location || undefined
                }
            });
            setJobs(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Network error occurred');
            console.error('Error fetching jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/categories/', {
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            setCategories(data);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setCategories([]);
        }
    };

    const fetchLocations = async () => {
        try {
            const { data } = await api.get('/locations/', {
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            setLocations(data);
        } catch (err) {
            console.error('Error fetching locations:', err);
            setLocations([]);
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            await Promise.all([
                fetchJobs(),
                fetchCategories(),
                fetchLocations()
            ]);
        };
        
        initializeData();
    }, []);

    return (
        <AppContext.Provider value={{
            jobs,
            setJobs,
            categories,
            locations,
            isSearched,
            setIsSearched,
            searchFilter,
            setSearchFilter,
            loading,
            error,
            showCompanyLogin,
            setShowCompanyLogin,
            showInstitutionLogin,
            setShowInstitutionLogin
        }}>
            {children}
        </AppContext.Provider>
    );
};