import { useNavigate, useParams, Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import logo from '../assets/logo.svg'
import Footer from '../components/layout/Footer'

export default function ResultsPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [user, setUser] = useState<{ name: string; picture?: string; email?: string } | null>(null)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const SERVICE_URL = import.meta.env.VITE_BLUEPRINTX_SERVICE_URL || 'http://localhost:8000'

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }

    let currentUrl: string | null = null

    const fetchPdf = async () => {
      if (!id) return
      setIsLoading(true)
      setError(null)
      
      try {
        const res = await fetch(`${SERVICE_URL}/api/v1/generate-blueprint/${id}`, {
          method: 'POST'
        })
        
        if (res.ok) {
          const blob = await res.blob()
          if (blob.size > 0) {
            const pdfBlob = new Blob([blob], { type: 'application/pdf' })
            currentUrl = URL.createObjectURL(pdfBlob)
            setPdfUrl(currentUrl)
          } else {
            setError('The generated blueprint is empty. Please try regenerating it from the dashboard.')
          }
        } else {
          const errorData = await res.json().catch(() => ({}))
          setError(errorData.detail || `Generation failed (Status ${res.status}). This often happens due to AI service rate limits.`)
        }
      } catch (err) {
        console.error('Failed to fetch PDF:', err)
        setError('Could not connect to the server. Please ensure the backend is running.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPdf()

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    
    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
      if (currentUrl) URL.revokeObjectURL(currentUrl)
    }
  }, [id, SERVICE_URL])

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `blueprint_${id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard">
              <img src={logo} alt="BlueprintX" className="h-8" />
            </Link>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer"
              >
                <span className="text-gray-800 font-medium">{user?.name || 'Username'}</span>
                {user?.picture ? (
                  <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full border border-gray-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                )}
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 mb-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        {/* Top bar with Breadcrumbs and Download */}
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center mb-8 flex-shrink-0">
          <div className="flex items-center text-sm text-gray-500">
            <Link to="/dashboard" className="hover:text-primary transition-colors">List</Link>
            <span className="mx-2">→</span>
            <span className="text-gray-900 font-medium">Details</span>
          </div>
          <button 
            onClick={handleDownload}
            disabled={!pdfUrl}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#7852FD] text-white rounded-lg font-semibold hover:bg-[#6a45e4] transition-all shadow-md active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Download
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>

        {/* Document View Area */}
        <div className="flex-1 w-full flex justify-center items-stretch overflow-hidden">
          {isLoading ? (
            <div className="w-full flex flex-col items-center justify-center py-20 bg-white shadow-xl rounded-lg border border-gray-100">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-primary/10 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="mt-6 text-gray-600 font-semibold animate-pulse">Building your AI blueprint...</p>
              <p className="mt-2 text-gray-400 text-sm">This may take up to 30 seconds</p>
            </div>
          ) : error ? (
            <div className="w-full flex flex-col items-center justify-center py-20 bg-white shadow-xl rounded-lg border border-red-100">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to display blueprint</h3>
              <p className="text-gray-500 text-center max-w-md px-6 mb-8">{error}</p>
              <div className="flex gap-4">
                <Link to="/dashboard" className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all">
                  Go to Dashboard
                </Link>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-[#7852FD] text-white rounded-lg font-medium hover:bg-[#6a45e4] transition-all"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : pdfUrl ? (
            <div className="w-full h-full bg-white shadow-xl rounded-lg overflow-hidden border border-gray-200">
              <iframe 
                src={pdfUrl} 
                className="w-full h-full border-none"
                style={{ minHeight: 'calc(100vh - 250px)' }}
                title="Blueprint PDF"
              >
                <p>Your browser does not support iframes. 
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    View the PDF directly
                  </a>
                </p>
              </iframe>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-20 bg-white shadow-xl rounded-lg border border-gray-100">
              <p className="text-gray-500">No document found for this ID.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
