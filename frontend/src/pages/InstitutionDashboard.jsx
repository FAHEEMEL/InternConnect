import React, { useContext, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { InstitutionContext } from '../context/InstitutionContext'
import NavBar from '../components/NavBar'

const InstitutionDashboard = () => {
  const { institution, isAuthenticated } = useContext(InstitutionContext)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/')
      return
    }
    
    // Redirect to companies if on dashboard root
    if (location.pathname === '/institution-dashboard') {
      navigate('/institution-dashboard/companies')
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
              <h2 className='text-xl font-semibold mb-4'>Institution Dashboard</h2>
              <p className='text-gray-600 mb-4'>{institution?.name}</p>
              <nav className='space-y-2'>
                <NavLink
                  to='/institution-dashboard/companies'
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-green-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  Manage Companies
                </NavLink>
                <NavLink
                  to='/institution-dashboard/jobs'
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-green-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  Manage Jobs
                </NavLink>
                <NavLink
                  to='/institution-dashboard/applications'
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-green-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  View Applications
                </NavLink>
                <NavLink
                  to='/institution-dashboard/profile'
                  className={({ isActive }) =>
                    `block px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-green-500 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  Institution Profile
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

export default InstitutionDashboard