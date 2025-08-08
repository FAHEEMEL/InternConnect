import React, { useContext, useEffect } from 'react'
import { AppContext } from '../context/AppContext'
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { assets } from '../assets/assets'
import Loading from '../components/Loading'
import kconvert from 'k-convert'
import moment from 'moment'
import NavBar from '../components/NavBar'
import JobCard from '../components/JobCard'
import { useUser, useClerk } from '@clerk/clerk-react'
import axios from 'axios'

const ApplyJob = () => {

  const { id } = useParams()
  const navigate = useNavigate()
  const [JobData, setJobData] = useState(null)

  const { jobs } = useContext(AppContext)

  const fetchJob = async () => {
    const data = jobs.filter(job => job._id == id)
    if (data.length !== 0) {
      setJobData(data[0])
      console.log(data[0])
    }

  }

  useEffect(() => {
    if (jobs.length > 0) {
      fetchJob()
    }

  }, [id, jobs])

  const { user, isSignedIn } = useUser()
  const { openSignIn } = useClerk()
  const [isApplying, setIsApplying] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState(null)

  const handleApply = async () => {
    if (!isSignedIn) {
      openSignIn()
      return
    }

    setIsApplying(true)
    try {
      const response = await axios.post('http://localhost:8000/api/applications/', {
        job_id: JobData._id,  // Changed from 'job' to 'job_id'
        applicant_clerk_id: user.id,
        status: 'Pending'
      })
      setApplicationStatus('success')
    } catch (error) {
      console.error('Application failed:', error)
      setApplicationStatus('error')
    } finally {
      setIsApplying(false)
    }
  }

  // Component to render Apply button based on authentication status
  const ApplyButton = ({ className }) => {
    if (!isSignedIn) {
      return (
        <div className="flex flex-col items-center gap-2">
          <button 
            className={`${className} bg-blue-600 text-white hover:bg-blue-700`}
            onClick={() => openSignIn()}
          >
            Sign In to Apply
          </button>
          <p className="text-xs text-gray-500">You must be signed in to apply for jobs</p>
        </div>
      )
    }

    if (applicationStatus === 'success') {
      return (
        <div className="flex flex-col items-center gap-2">
          <button className={`${className} bg-green-600 text-white cursor-not-allowed`} disabled>
            ✓ Application Submitted
          </button>
          <p className="text-xs text-green-600">Your application has been submitted successfully!</p>
        </div>
      )
    }

    if (applicationStatus === 'error') {
      return (
        <div className="flex flex-col items-center gap-2">
          <button 
            className={`${className} bg-red-600 text-white hover:bg-red-700`}
            onClick={handleApply}
            disabled={isApplying}
          >
            {isApplying ? 'Retrying...' : 'Retry Application'}
          </button>
          <p className="text-xs text-red-600">Application failed. Click to retry.</p>
        </div>
      )
    }

    return (
      <button 
        className={`${className} bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400`}
        onClick={handleApply}
        disabled={isApplying}
      >
        {isApplying ? 'Applying...' : 'Apply Now'}
      </button>
    )
  }

  return JobData ? (
    <>
    <NavBar />
    <div className='min-h-screen flex felx-col py-10 container px-4 lg:px-20 mx-auto'>
      <div className='bg-white text-black rounded-lg w-full'>
        <div className='flex justify-center md:justify-between flex-wrap gap-8 px-14 py-20 mb-6 bg-sky-50 border border-sky-400 rounded-xl'>
          <div className='flex felx-col md:flex-row items-center'>
            <img className='h-24 bg-white rounded-lg p-4 mr-4 max-md:mb-4 border border-gray-300' src={JobData.company.image} alt="" />
            <div className='text-center md:text-left text-neutral-700'>
              <h1 className='text-2xl sm:text-4xl font-medium'>{JobData.title}</h1>
              <div className='flex flex-row flex-wrap max-md:justify-center gap-y-2 gap-6 items-center text-gray-600 mt-2'>
                <span className='flex items-center gap-1'> <img src={assets.suitcase_icon} alt="" /> {JobData.company.name} </span>
                <span className='flex items-center gap-1'> <img src={assets.location_icon} alt="" /> {JobData.location}</span>
                <span className='flex items-center gap-1'> <img src={assets.person_icon} alt="" /> {JobData.level}</span>
                <span className='flex items-center gap-1'> <img src={assets.money_icon} alt="" />CTC: {kconvert.convertTo(JobData.salary)}</span>
              </div>
            </div>
          </div>
          <div className='flex flex-col justify-center text-end text-sm max-md:mx-auto max-md:text-center'>
            <ApplyButton className="p-2.5 rounded transition-colors" />
            <p className='mt-1 text-gray-600'>Posted {moment(JobData.date).fromNow()}</p>
          </div>
        </div>

        <div className='flex flex-col lg:flex-row justify-between items-start'>
          <div className='w-full lg:w-2/3'>
            <h2 className='font-bold text-2xl mb-4'>Job description</h2>
            <div className='rich-text' dangerouslySetInnerHTML={{ __html: JobData.description }}></div>
            <div className="mt-10">
              <ApplyButton className="p-2.5 rounded transition-colors" />
            </div>
          </div>
          {/* Right side */}
          <div className='w-full lg:w-1/3 mt-8 lg:mt-0 lg:ml-8 space-y-5'>
            <h2>More jobs from {JobData.company.name}</h2>
            {
              jobs.filter(job => job._id !== JobData._id && job.company.id === JobData.company.id)
              .filter(job => true)
              .slice(0, 4).map((job, index) => <JobCard key={index} job={job} />)
            }
          </div>
        </div>

      </div>
    </div>
    </>
  ) : (
    <Loading />
  )
}

export default ApplyJob