import React, { useContext, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import ApplyJob from './pages/ApplyJob'
import Applications from './pages/Applications'
import Profile from './pages/Profile'
import CompanyLogin from './components/RecruiterLogin'
import InstitutionLogin from './components/InstitutionLogin'
import InstitutionSignup from './components/InstitutionSignup'
import InstitutionDashboard from './pages/InstitutionDashboard'
import InstitutionCompanies from './pages/InstitutionCompanies'
import InstitutionJobs from './pages/InstitutionJobs'
import InstitutionApplications from './pages/InstitutionApplications'
import InstitutionProfile from './pages/InstitutionProfile'
import { AppContext } from './context/AppContext'
import { useInstitution } from './context/InstitutionContext'
import Dashboard from './pages/Dashboard'
import AddJob from './pages/AddJob'
import ManageJobs from './pages/ManageJobs'
import ViewApplications from './pages/ViewApplications'
import CompanyProfile from './pages/CompanyProfile'
import 'quill/dist/quill.snow.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const App = () => {
  const { showCompanyLogin, showInstitutionLogin, setShowInstitutionLogin } = useContext(AppContext)
  const { isAuthenticated: isInstitutionAuthenticated } = useInstitution()
  const [showInstitutionSignup, setShowInstitutionSignup] = useState(false)

  const handleCloseInstitutionLogin = () => {
    setShowInstitutionLogin(false)
  }

  const handleSwitchToSignup = () => {
    setShowInstitutionLogin(false)
    setShowInstitutionSignup(true)
  }

  const handleSwitchToLogin = () => {
    setShowInstitutionSignup(false)
    setShowInstitutionLogin(true)
  }

  const handleCloseInstitutionSignup = () => {
    setShowInstitutionSignup(false)
  }

  return (
    <div>
      {showCompanyLogin && <CompanyLogin/>}
      {showInstitutionLogin && (
        <InstitutionLogin 
          onClose={handleCloseInstitutionLogin}
          onSwitchToSignup={handleSwitchToSignup}
        />
      )}
      {showInstitutionSignup && (
        <InstitutionSignup 
          onClose={handleCloseInstitutionSignup}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
      
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/apply-job/:id' element={<ApplyJob />} />
        <Route path='/applications' element={<Applications />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/dashboard' element={<Dashboard />}>
          <Route path='add-job' element={<AddJob />} />
          <Route path='manage-job' element={<ManageJobs />} />
          <Route path='view-applications' element={<ViewApplications />} />
          <Route path='profile' element={<CompanyProfile />} />
        </Route>
        <Route 
          path='/institution-dashboard' 
          element={isInstitutionAuthenticated ? <InstitutionDashboard /> : <Home />}
        >
          <Route path='companies' element={<InstitutionCompanies />} />
          <Route path='jobs' element={<InstitutionJobs />} />
          <Route path='applications' element={<InstitutionApplications />} />
          <Route path='profile' element={<InstitutionProfile />} />
        </Route>
      </Routes>
      <ToastContainer />
    </div>
  )
}

export default App