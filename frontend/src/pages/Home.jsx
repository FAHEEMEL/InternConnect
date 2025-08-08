import React from 'react'
import NavBar from '../components/NavBar'
import Hero from '../components/Hero'
import JobListing from '../components/JobListing'

const Home = () => {
  return (
    <div>
        <NavBar />
        <Hero />
        <JobListing />
    </div>
  )
}

export default Home