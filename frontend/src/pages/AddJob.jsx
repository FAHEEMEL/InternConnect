import React, { useState, useRef, useEffect } from 'react';
import Quill from 'quill';
import { JobCategories, JobLocations } from '../assets/assets';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../context/CompanyContext';

const AddJob = () => {
    const navigate = useNavigate();
    const { company, token } = useCompany();
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('Bangalore');
    const [category, setCategory] = useState('Programming');
    const [level, setLevel] = useState('Beginner Level');
    const [salary, setSalary] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const editorRef = useRef(null);
    const quillRef = useRef(null);

    useEffect(() => {
        if (!quillRef.current && editorRef.current) {
            quillRef.current = new Quill(editorRef.current, {
                theme: 'snow',
            });
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!company || !token) {
            setError('Please log in to add a job');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const description = quillRef.current.root.innerHTML;
            const response = await axios.post('http://localhost:8000/api/jobs/', {
                title,
                location,
                category,
                level,
                salary: parseInt(salary),
                description,
                company: company.id
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 201) {
                navigate('/dashboard/manage-job');
            }
        } catch (error) {
            console.error('Error adding job:', error);
            setError(error.response?.data?.message || 'Failed to add job');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className='container p-4 flex flex-col gap-3'>
            {error && (
                <div className='bg-red-100 text-red-700 p-3 rounded mb-4'>
                    {error}
                </div>
            )}
            
            <div className='w-full'>
                <p className='mb-2'>Job Title</p>
                <input className='w-full max-w-lg px-3 py-2 border border-gray-300 rounded' type="text" placeholder='Type here'
                    onChange={e => setTitle(e.target.value)} value={title} required />
            </div>

            <div className='w-full max-w-lg'>
                <p className='my-2'>Job Description</p>
                <div ref={editorRef}>

                </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
                <div>
                    <div><p className='mb-2'>Job Category</p>
                        <select className='w-full px-3 py-2 border border-gray-300 rounded' onChange={e => setCategory(e.target.value)}>
                            {JobCategories.map((category, index) => (
                                <option key={index} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <div><p className='mb-2'>Job Location</p>
                        <select className='w-full px-3 py-2 border border-gray-300 rounded' onChange={e => setLocation(e.target.value)}>
                            {JobLocations.map((location, index) => (
                                <option key={index} value={location}>{location}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div>
                    <div><p className='mb-2'>Job Level</p>
                        <select className='w-full px-3 py-2 border border-gray-300 rounded' onChange={e => setLevel(e.target.value)}>
                            <option value="Beginner level">Beginner level</option>
                            <option value="Intermediate level">Intermediate level</option>
                            <option value="Expert level">Expert level</option>
                        </select>
                    </div>
                </div>
            </div>
            <div>
                <p className='mb-2'>
                    Job Salary
                </p>
                <input min={0} className='w-full px-3 py-2 border border-gray-300 rounded sm:w-[120px]' onChange={e => setSalary(e.target.value)} value={salary} type="Number" placeholder='2800' />
            </div>

            <button 
                type="submit" 
                disabled={loading}
                className='w-28 py-3 mt-4 bg-black text-white rounded disabled:opacity-50'
            >
                {loading ? 'Adding...' : 'ADD JOB'}
            </button>
        </form>
    );
};

export default AddJob;