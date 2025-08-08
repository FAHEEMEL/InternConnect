import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import {useClerk, UserButton, useUser} from '@clerk/clerk-react'
import { Link, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { useCompany } from '../context/CompanyContext'
import { useInstitution } from '../context/InstitutionContext'

const NavBar = () => {
  const {openSignIn} = useClerk()
  const {user} = useUser()
  const navigate = useNavigate()
  const {setShowCompanyLogin, setShowInstitutionLogin} = useContext(AppContext)
  const { company, isAuthenticated: isCompanyAuthenticated, logout: companyLogout } = useCompany()
  const { institution, isAuthenticated: isInstitutionAuthenticated, logout: institutionLogout } = useInstitution()

  const handleCompanyLogout = () => {
    companyLogout()
    navigate('/')
  }

  const handleInstitutionLogout = () => {
    institutionLogout()
    navigate('/')
  }

  return (
    <div className='shadow py-4'>
        <div className='container px-4 2xl:px-20 mx-auto flex justify-between items-center'>
            <img onClick={e => navigate('/')} className='w-60 cursor-pointer' src={assets.internconnect} alt=''/>
            {
              user
              ?<div className='flex item-center gap-3'>
                <Link to={'/applications'} className='text-gray-600 hover:text-blue-600'>Applied Jobs</Link>
                {/* <p> | </p>
                <Link to={'/profile'} className='text-gray-600 hover:text-blue-600'>Profile</Link> */}
                <p> | </p>
                <p className='max-sm:hidden'>Hi, {user.firstName + " " + user.lastName}</p>
                <UserButton/>
              </div>
              : isCompanyAuthenticated
              ? <div className='flex items-center gap-3'>
                  <Link to={'/dashboard'} className='text-gray-600'>Dashboard</Link>
                  <p> | </p>
                  <p className='max-sm:hidden'>Hi, {company?.name}</p>
                  <button 
                    onClick={handleCompanyLogout}
                    className='bg-red-600 text-white px-6 sm:px-9 py-2 rounded-full'
                  >
                    Logout
                  </button>
                </div>
              : isInstitutionAuthenticated
              ? <div className='flex items-center gap-3'>
                  <Link to={'/institution-dashboard'} className='text-gray-600'>Institution Dashboard</Link>
                  <p> | </p>
                  <p className='max-sm:hidden'>Hi, {institution?.name}</p>
                  <button 
                    onClick={handleInstitutionLogout}
                    className='bg-red-600 text-white px-6 sm:px-9 py-2 rounded-full'
                  >
                    Logout
                  </button>
                </div>
              :
               <div className='flex gap-4 max-sm:text-xs'>
                <button onClick={e => setShowCompanyLogin(true)} className='text-gray-600'>Company Login</button>
                <button onClick={e => setShowInstitutionLogin(true)} className='text-green-600'>Institution Login</button>
                <button onClick={e => openSignIn()} className='bg-blue-600 text-white px-6 sm:px-9 py-2 rounded-full'>Login</button>
            </div>
            }
        </div>
    </div>
  )
}

export default NavBar