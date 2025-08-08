import React, { use, useContext, useEffect, useState } from 'react'
import { assets } from '../assets/assets'
import { AppContext } from '../context/AppContext'
import { useCompany } from '../context/CompanyContext'

const CompanyLogin = () => {
    const [state, setState] = useState('Login')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState('') // 'success' or 'error'

    const { setShowCompanyLogin } = useContext(AppContext)
    const { login, signup, loading, error } = useCompany()

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        setMessage('')
        
        try {
            let result;
            if (state === 'Login') {
                result = await login(email, password)
            } else {
                result = await signup(name, email, password)
            }

            if (result.success) {
                setMessage(result.message)
                setMessageType('success')
                setTimeout(() => {
                    setShowCompanyLogin(false)
                }, 1500)
            } else {
                setMessage(result.message)
                setMessageType('error')
            }
        } catch (err) {
            setMessage('An unexpected error occurred')
            setMessageType('error')
        }
    }

    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [])

    useEffect(() => {
        if (error) {
            setMessage(error)
            setMessageType('error')
        }
    }, [error])

    return (
        <div className='absolute top-0 left-0 bottom-0 right-0 z-50 backdrop-blur-sm bg-black/30 flex justify-center items-center'>
            <form onSubmit={onSubmitHandler} className='relative bg-white p-10 rounded-xl text-slate-500 w-96'>
                <h1 className='text-center text-2xl text-neutral-700 font-medium'>Company {state}</h1>
                <p className='text-sm text-center mb-6'>Welcome back! Please sign in to continue</p>
                
                {message && (
                    <div className={`text-center p-2 rounded mb-4 ${
                        messageType === 'success' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                    }`}>
                        {message}
                    </div>
                )}

                {state !== 'Login' && (
                    <div className='border border-gray-300 px-4 py-2 flex items-center gap-2 rounded-full mt-5'>
                        <img src={assets.person_icon} alt="" />
                        <input 
                            className='outline-none w-full' 
                            onChange={e => setName(e.target.value)} 
                            value={name} 
                            type="text" 
                            placeholder='Company Name' 
                            required 
                        />
                    </div>
                )}

                <div className='border border-gray-300 px-4 py-2 flex items-center gap-2 rounded-full mt-5'>
                    <img src={assets.email_icon} alt="" />
                    <input 
                        className='outline-none w-full' 
                        onChange={e => setEmail(e.target.value)} 
                        value={email} 
                        type="email" 
                        placeholder='Email Id' 
                        required 
                    />
                </div>

                <div className='border border-gray-300 px-4 py-2 flex items-center gap-2 rounded-full mt-5'>
                    <img src={assets.lock_icon} alt="" />
                    <input 
                        className='outline-none w-full' 
                        onChange={e => setPassword(e.target.value)} 
                        value={password} 
                        type="password" 
                        placeholder='Password' 
                        required 
                    />
                </div>

                {state === "Login" && <p className='text-sm text-blue-600 my-4 cursor-pointer'>Forgot Password</p>}
                
                <button 
                    type='submit' 
                    disabled={loading}
                    className='bg-blue-600 w-full text-white rounded-full py-2 mt-6 disabled:opacity-50'
                >
                    {loading ? 'Please wait...' : state === 'Login' ? 'Login' : 'Sign Up'}
                </button>
                
                {state === 'Login'
                    ? <p className='mt-5 text-center'> Don't have an account? <span onClick={e => setState('Sign Up')} className='text-blue-600 cursor-pointer'>Sign Up</span></p>
                    : <p className='mt-5 text-center'> Already have an account? <span onClick={e => setState('Login')} className='text-blue-600 cursor-pointer'>Login</span></p>
                }

                <img 
                    onClick={e => setShowCompanyLogin(false)} 
                    className='absolute top-5 right-5 cursor-pointer' 
                    src={assets.cross_icon} 
                    alt="" 
                />
            </form>
        </div>
    )
}

export default CompanyLogin