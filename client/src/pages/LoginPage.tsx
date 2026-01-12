import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useGoogleLogin } from '@react-oauth/google'
import mobileLogo from '../assets/mobile-logo.svg'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setIsSignUp(searchParams.get('mode') === 'signup')
  }, [searchParams])
  
  // Forgot Password States
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [forgotStep, setForgotStep] = useState(1) // 1: Email, 2: New Password, 3: Success

  // Initialize mock users in localStorage if they don't exist
  const getMockUsers = () => {
    const users = localStorage.getItem('mock_users')
    if (users) return JSON.parse(users)
    
    const initialUsers = {
      'admin@blueprintx.com': { password: 'admin123', name: 'Admin User' },
      'user@example.com': { password: 'password123', name: 'Standard User' },
      'hrishit@blueprintx.com': { password: 'hrishit2026', name: 'Hrishit Biswas' }
    }
    localStorage.setItem('mock_users', JSON.stringify(initialUsers))
    return initialUsers
  }

  const handleSSO = (provider: string) => {
    if (provider === 'google') {
      console.log('Mocking Google login success...')
      const mockUserInfo = {
        name: 'Hrishit Biswas',
        email: 'hrishitbiswas20@gmail.com',
        picture: 'https://ui-avatars.com/api/?name=Hrishit+Biswas&background=7852FD&color=fff'
      }
      localStorage.setItem('user', JSON.stringify(mockUserInfo))
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
        navigate('/dashboard')
      }, 800)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const mockUsers = getMockUsers()

    if (isSignUp) {
      if (mockUsers[email]) {
        setError('User already exists with this email.')
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.')
        return
      }
      if (!name) {
        setError('Please enter your name.')
        return
      }

      // Add new user to mock database
      const users = getMockUsers()
      users[email] = { password, name }
      localStorage.setItem('mock_users', JSON.stringify(users))
      
      // Log them in immediately
      localStorage.setItem('user', JSON.stringify({ 
        name: name,
        email: email 
      }))
      navigate('/dashboard')
    } else {
      const userData = mockUsers[email]
      if (userData && (typeof userData === 'string' ? userData === password : userData.password === password)) {
        localStorage.setItem('user', JSON.stringify({ 
          name: typeof userData === 'string' ? email.split('@')[0] : userData.name,
          email: email 
        }))
        navigate('/dashboard')
      } else {
        setError('Invalid email or password. Hint: admin@blueprintx.com / admin123')
      }
    }
  }

  const handleForgotNext = () => {
    const mockUsers = getMockUsers()
    if (forgotStep === 1) {
      if (mockUsers[forgotEmail]) {
        setForgotStep(2)
      } else {
        alert('Email not found in our mock database.')
      }
    } else if (forgotStep === 2) {
      if (newPassword.length < 6) {
        alert('Password must be at least 6 characters.')
        return
      }
      // Update password in mock database
      const users = getMockUsers()
      const userData = users[forgotEmail]
      if (typeof userData === 'string') {
        users[forgotEmail] = newPassword
      } else {
        users[forgotEmail] = { ...userData, password: newPassword }
      }
      localStorage.setItem('mock_users', JSON.stringify(users))
      setForgotStep(3)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
            
            {forgotStep === 1 && (
              <div>
                <p className="text-gray-600 mb-6">Enter your email to search for your account.</p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="admin@blueprintx.com"
                />
              </div>
            )}

            {forgotStep === 2 && (
              <div>
                <p className="text-gray-600 mb-6">Create a new password for <b>{forgotEmail}</b></p>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-6 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Enter new password"
                />
              </div>
            )}

            {forgotStep === 3 && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-gray-900 font-medium text-lg mb-2">Password Changed!</p>
                <p className="text-gray-600 mb-6">You can now sign in with your new password.</p>
              </div>
            )}

            <div className="flex gap-4">
              {forgotStep < 3 ? (
                <>
                  <button
                    onClick={() => { setShowForgotModal(false); setForgotStep(1); }}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleForgotNext}
                    className="flex-1 px-4 py-3 text-white rounded-lg font-medium"
                    style={{ backgroundColor: '#7852FD' }}
                  >
                    {forgotStep === 1 ? 'Find Account' : 'Update Password'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setShowForgotModal(false); setForgotStep(1); }}
                  className="w-full px-4 py-3 text-white rounded-lg font-medium"
                  style={{ backgroundColor: '#7852FD' }}
                >
                  Back to Login
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Container with Border - Full Page */}
      <div className="w-full h-screen bg-white overflow-hidden relative">
        <div className="grid md:grid-cols-2 h-full">
          {/* Left Column - Login Form */}
          <div className="flex flex-col justify-center p-8 md:p-12 bg-white h-full">
            <div className="max-w-md mx-auto w-full">
              {/* Back Button */}
              <Link
                to="/"
                className="inline-flex items-center text-gray-600 hover:text-primary transition-colors mb-6"
                style={{ color: '#7852FD' }}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </Link>

              {/* Welcome Message */}
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {isSignUp ? 'Create Account' : 'Welcome Back'} <span className="inline-block">{isSignUp ? '✨' : '👋'}</span>
                </h1>
                <p className="text-gray-600 mt-3">
                  {isSignUp 
                    ? 'Join us today and start managing your projects with ease.' 
                    : 'Today is a new day. Sign in to start managing your projects.'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {isSignUp && (
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="John Doe"
                      required={isSignUp}
                    />
                  </div>
                )}
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="admin@blueprintx.com"
                    required
                  />
                </div>

                {/* Password Field */}
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="At least 6 characters"
                    required
                  />
                </div>

                {/* Forgot Password Link */}
                {!isSignUp && (
                  <div className="flex justify-end mb-6">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-sm text-primary hover:underline"
                      style={{ color: '#7852FD' }}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Sign In/Up Button */}
                <button
                  type="submit"
                  className="w-full px-4 py-3 rounded-lg font-semibold text-white mb-6 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 mt-2"
                  style={{ backgroundColor: '#7852FD', cursor: 'pointer' }}
                  disabled={isLoading}
                >
                  {isLoading ? (isSignUp ? 'Creating...' : 'Signing in...') : (isSignUp ? 'Create Account' : 'Sign In')}
                </button>
              </form>

              {/* Separator */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500">Or</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="space-y-3 mb-6">
                {/* Google Button */}
                <button
                  onClick={() => handleSSO('google')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
                  style={{ cursor: 'pointer' }}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>

              {/* Toggle Login/SignUp Link */}
              <p className="text-center text-sm text-gray-600 mb-6">
                {isSignUp ? 'Already have an account?' : "Don't you have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setError('')
                  }}
                  className="text-primary hover:underline font-medium"
                  style={{ color: '#7852FD' }}
                >
                  {isSignUp ? 'Sign In' : 'Sign up'}
                </button>
              </p>

              {/* Copyright */}
              <p className="text-center text-xs text-gray-400">
                © 2026 ALL RIGHTS RESERVED
              </p>
            </div>
          </div>

          {/* Right Column - Mobile Logo Image */}
          <div className="hidden md:block relative">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <img 
                  src={mobileLogo} 
                  alt="Mobile login interface" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
