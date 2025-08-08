import React, { useContext, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { CompanyContext } from '../context/CompanyContext'
import NavBar from '../components/NavBar'

const Dashboard = () => {
  const { company, isAuthenticated } = useContext(CompanyContext)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      return
    }
    
    // Redirect to add-job if on dashboard root
    if (location.pathname === '/dashboard') {
      navigate('/dashboard/add-job')
    }
  }, [isAuthenticated, navigate, location.pathname])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div>
      {/* Add NavBar at the top */}
      <NavBar />
      
      <div className='container mx-auto p-4'>
        <div className='flex flex-col lg:flex-row gap-8'>
          {/* Sidebar */}
          <div className='lg:w-1/4'>
            <div className='bg-white rounded-lg shadow-md p-6'>
              <h2 className='text-xl font-semibold mb-4'>Dashboard</h2>
              <nav className='space-y-2'>
                <NavLink
                  to='/dashboard/add-job'
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  Add Job
                </NavLink>
                <NavLink
                  to='/dashboard/manage-job'
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  Manage Job
                </NavLink>
                <NavLink
                  to='/dashboard/view-applications'
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  View Applications
                </NavLink>
                <NavLink
                  to='/dashboard/profile'
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  Company Profile
                </NavLink>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className='lg:w-3/4'>
            <div className='bg-white rounded-lg shadow-md p-6'>
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard