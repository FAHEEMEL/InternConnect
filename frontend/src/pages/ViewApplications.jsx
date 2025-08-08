import React, { useState, useEffect, useContext } from 'react'
import { CompanyContext } from '../context/CompanyContext'
import { toast } from 'react-toastify'
import axios from 'axios'
import moment from 'moment'

const ViewApplications = () => {
  const { token } = useContext(CompanyContext)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
      const response = await axios.get(
        `${backendUrl}/api/company/applications/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      setApplications(response.data)
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to fetch applications')
    } finally {
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (applicationId, status) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
      await axios.put(
        `${backendUrl}/api/company/applications/${applicationId}/status/`,
        { status },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )
      
      // Update the local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status } 
            : app
        )
      )
      
      toast.success(`Application ${status.toLowerCase()} successfully`)
    } catch (error) {
      console.error('Error updating application status:', error)
      toast.error('Failed to update application status')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading applications...</div>
      </div>
    )
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">No Applications Yet</h2>
        <p className="text-gray-600">No one has applied to your job postings yet.</p>
      </div>
    )
  }

  return (
    <div className='container mx-auto p-4'>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Job Applications</h1>
      <div className="overflow-x-auto">
        <table className='w-full bg-white border border-gray-200 rounded-lg shadow-sm'>
          <thead className="bg-gray-50">
            <tr className='border-b border-gray-200'>
              <th className='py-3 px-4 text-left font-semibold text-gray-700'>#</th>
              <th className='py-3 px-4 text-left font-semibold text-gray-700'>Applicant</th>
              <th className='py-3 px-4 text-left font-semibold text-gray-700 max-sm:hidden'>Job Title</th>
              <th className='py-3 px-4 text-left font-semibold text-gray-700 max-sm:hidden'>Location</th>
              <th className='py-3 px-4 text-left font-semibold text-gray-700'>Applied Date</th>
              <th className='py-3 px-4 text-left font-semibold text-gray-700'>Status</th>
              <th className='py-3 px-4 text-left font-semibold text-gray-700'>Resume</th>
              <th className='py-3 px-4 text-left font-semibold text-gray-700'>Action</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application, index) => (
              <tr key={application.id} className='text-gray-700 hover:bg-gray-50'>
                <td className='py-3 px-4 border-b border-gray-200'>{index + 1}</td>
                <td className='py-3 px-4 border-b border-gray-200'>
                  <div className="flex items-center">
                    {application.applicant_photo ? (
                      <img 
                        className='w-10 h-10 rounded-full mr-3 object-cover' 
                        src={application.applicant_photo} 
                        alt={application.applicant_name}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full mr-3 bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-medium">
                          {application.applicant_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{application.applicant_name}</div>
                      <div className="text-sm text-gray-500">{application.applicant_email}</div>
                    </div>
                  </div>
                </td>
                <td className='py-3 px-4 max-sm:hidden border-b border-gray-200 font-medium'>
                  {application.job_title}
                </td>
                <td className='py-3 px-4 max-sm:hidden border-b border-gray-200'>
                  {application.job_location}
                </td>
                <td className='py-3 px-4 border-b border-gray-200'>
                  {moment(application.applied_date).format('MMM DD, YYYY')}
                </td>
                <td className='py-3 px-4 border-b border-gray-200'>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    application.status === 'Accepted' 
                      ? 'bg-green-100 text-green-800'
                      : application.status === 'Rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {application.status}
                  </span>
                </td>
                <td className='py-3 px-4 border-b border-gray-200'>
                  {application.resume_link ? (
                    <a 
                      className='bg-blue-50 text-blue-600 px-3 py-1 rounded-md inline-flex items-center gap-2 hover:bg-blue-100 transition-colors' 
                      href={application.resume_link} 
                      target='_blank'
                      rel="noopener noreferrer"
                    >
                      View Resume
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <span className="text-gray-400">No resume</span>
                  )}
                </td>
                <td className='py-3 px-4 border-b border-gray-200'>
                  <div className='relative inline-block text-left group'>
                    <button className='text-gray-500 hover:text-gray-700 p-1'>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    <div className='z-10 hidden absolute right-0 top-0 mt-8 w-32 bg-white border border-gray-200 rounded-md shadow-lg group-hover:block'>
                      <button 
                        onClick={() => updateApplicationStatus(application.id, 'Accepted')}
                        className='block w-full text-left px-4 py-2 text-green-600 hover:bg-gray-100'
                        disabled={application.status === 'Accepted'}
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => updateApplicationStatus(application.id, 'Rejected')}
                        className='block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100'
                        disabled={application.status === 'Rejected'}
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => updateApplicationStatus(application.id, 'Pending')}
                        className='block w-full text-left px-4 py-2 text-yellow-600 hover:bg-gray-100'
                        disabled={application.status === 'Pending'}
                      >
                        Pending
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ViewApplications