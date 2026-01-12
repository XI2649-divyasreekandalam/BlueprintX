import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.svg'
import viewIcon from '../assets/view-icon.svg'
import deleteIcon from '../assets/delete-icon.svg'
import Footer from '../components/layout/Footer'

interface UploadedFile {
  id: string
  name: string
  size: number
  file: File
}

interface Document {
  id: string
  name: string
  size: string
  date: string
  status: 'Success' | 'Processing' | 'Failed'
}

type SortConfig = {
  key: keyof Document | null
  direction: 'ascending' | 'descending'
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [user, setUser] = useState<{ name: string; picture?: string; email?: string } | null>(null)
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [documents, setDocuments] = useState<Document[]>(() => {
    const saved = localStorage.getItem('dashboard_documents')
    return saved ? JSON.parse(saved) : []
  })
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' })
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const itemsPerPage = 10

  const SERVICE_URL = import.meta.env.VITE_BLUEPRINTX_SERVICE_URL || 'http://localhost:8000'

  useEffect(() => {
    localStorage.setItem('dashboard_documents', JSON.stringify(documents))
  }, [documents])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  useEffect(() => {
    // Load user data from localStorage
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    } else {
      // If no user, redirect to login
      navigate('/login')
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/login')
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + 'B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      handleFiles(files)
    }
  }

  const handleFiles = (files: File[]) => {
    const newFiles = files
      .filter(file => {
        const fileSizeMB = file.size / (1024 * 1024)
        return fileSizeMB <= 50
      })
      .slice(0, 5 - uploadedFiles.length)
      .map((file, index) => ({
        id: `${Date.now()}-${index}`,
        name: file.name,
        size: file.size,
        file: file,
      }))
    
    setUploadedFiles([...uploadedFiles, ...newFiles])
  }

  const removeFile = (id: string) => {
    setUploadedFiles(uploadedFiles.filter(file => file.id !== id))
  }

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) return
    setIsUploading(true)

    try {
      const results = await Promise.all(
        uploadedFiles.map(async (fileObj) => {
          const formData = new FormData()
          formData.append('file', fileObj.file)

          // 1. Upload File
          const uploadRes = await fetch(`${SERVICE_URL}/api/v1/upload`, {
            method: 'POST',
            body: formData,
          })

          if (!uploadRes.ok) throw new Error(`Upload failed for ${fileObj.name}`)
          
          const { document_id } = await uploadRes.json()

          // 2. Add to list with processing state
          const newDoc: Document = {
            id: document_id,
            name: fileObj.name,
            size: formatFileSize(fileObj.size),
            date: new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),
            status: 'Processing'
          }

          setDocuments(prev => [newDoc, ...prev])
          return { document_id, name: fileObj.name }
        })
      )

      setNotification({ message: 'Upload successful! Generating blueprints...', type: 'success' })
      setUploadedFiles([])

      // 3. Trigger Blueprint Generation
      results.forEach(async (res) => {
        try {
          const genRes = await fetch(`${SERVICE_URL}/api/v1/generate-blueprint/${res.document_id}`, {
            method: 'POST',
          })

          if (genRes.ok) {
            const pdfBlob = await genRes.blob()
            // Store the PDF blob URL in local state only for immediate use if needed
            // But we don't need to store it in localStorage since it won't persist
            // The ResultsPage will re-fetch it using the document_id
            
            setDocuments(prev => prev.map(doc => 
              doc.id === res.document_id ? { ...doc, status: 'Success' } : doc
            ))
          } else {
            setDocuments(prev => prev.map(doc => 
              doc.id === res.document_id ? { ...doc, status: 'Failed' } : doc
            ))
          }
        } catch (err) {
          console.error(`Generation error for ${res.name}:`, err)
          setDocuments(prev => prev.map(doc => 
            doc.id === res.document_id ? { ...doc, status: 'Failed' } : doc
          ))
        }
      })

    } catch (error) {
      console.error('Operation error:', error)
      setNotification({ message: error instanceof Error ? error.message : 'Operation failed', type: 'error' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setUploadedFiles([])
  }

  const handleSort = (key: keyof Document) => {
    let direction: 'ascending' | 'descending' = 'ascending'
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  const deleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id))
  }

  const handleView = (id: string) => {
    navigate(`/results/${id}`)
  }

  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.status.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (!sortConfig.key) return 0
    
    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]

    if (sortConfig.key === 'size') {
      const getBytes = (sizeStr: string) => {
        const num = parseFloat(sizeStr)
        if (sizeStr.includes('MB')) return num * 1024 * 1024
        if (sizeStr.includes('KB')) return num * 1024
        return num
      }
      return sortConfig.direction === 'ascending' 
        ? getBytes(a.size) - getBytes(b.size)
        : getBytes(b.size) - getBytes(a.size)
    }

    if (sortConfig.key === 'date') {
      const parseDate = (d: string) => new Date(d).getTime() || 0
      return sortConfig.direction === 'ascending'
        ? parseDate(a.date) - parseDate(b.date)
        : parseDate(b.date) - parseDate(a.date)
    }

    if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1
    if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage)
  const paginatedDocuments = sortedDocuments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-20 right-8 z-50 px-6 py-3 rounded-lg shadow-lg border transition-all animate-in slide-in-from-right ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center gap-3">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <p className="font-medium">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img src={logo} alt="BlueprintX" className="h-8" />
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

              {/* Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 mb-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false)
                      // Profile link logic could go here
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsUserDropdownOpen(false)
                      // Settings link logic could go here
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Section - Media Upload */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Got Documents?</h2>
            <p className="text-sm text-gray-600 mb-6">
            Drop them here. Up to 5 files, 5MB each.
            </p>

            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'
              }`}
            >
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-700 mb-2">Drag your file(s) to start uploading</p>
              <p className="text-gray-500 mb-4">OR</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 rounded-lg font-medium text-white transition-colors"
                style={{ backgroundColor: '#7852FD', cursor: 'pointer' }}
              >
                Browse files
              </button>
              <input    
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt"
              />
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="mb-6 space-y-3">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <svg
                        className="w-5 h-5 text-gray-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      className="ml-3 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center flex-shrink-0"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {uploadedFiles.length > 0 && (
              <div className="flex gap-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#7852FD' }}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    'Upload'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right Section - Documents Table */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg
                  className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th 
                      className="text-left py-3 px-2 text-sm font-semibold text-gray-700 w-1/3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Name
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${sortConfig.key === 'name' && sortConfig.direction === 'descending' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-2 text-sm font-semibold text-gray-700 w-[12%] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('size')}
                    >
                      <div className="flex items-center gap-2">
                        Size
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${sortConfig.key === 'size' && sortConfig.direction === 'descending' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-2 text-sm font-semibold text-gray-700 w-[18%] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center gap-2">
                        Date
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${sortConfig.key === 'date' && sortConfig.direction === 'descending' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </div>
                    </th>
                    <th 
                      className="text-left py-3 px-2 text-sm font-semibold text-gray-700 w-[18%] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-2">
                        Status
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${sortConfig.key === 'status' && sortConfig.direction === 'descending' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </div>
                    </th>
                    <th className="text-left py-3 px-2 pl-8 text-sm font-semibold text-gray-700 w-[19%]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDocuments.length > 0 ? (
                    paginatedDocuments.map((doc) => (
                      <tr key={doc.id} className="border-b border-gray-200 hover:bg-gray-100">
                        <td className="py-3 px-2 text-sm text-gray-900 truncate" title={doc.name}>{doc.name}</td>
                        <td className="py-3 px-2 text-sm text-gray-600 truncate">{doc.size}</td>
                        <td className="py-3 px-2 text-sm text-gray-600 truncate">{doc.date}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center">
                          {doc.status === 'Processing' ? (
                            <div className="flex items-center justify-center w-full" title="AI is processing your document...">
                              <div className="relative flex items-center justify-center w-6 h-6">
                                <div className="absolute inset-0 border-2 border-amber-100 rounded-full"></div>
                                <div className="absolute inset-0 border-2 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
                              </div>
                            </div>
                          ) : (
                            <span className={`text-sm font-medium flex items-center gap-2 ${
                              doc.status === 'Success' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {doc.status === 'Success' ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                              )}
                              {doc.status}
                            </span>
                          )}
                        </div>
                      </td>
                        <td className="py-3 px-2 pl-8">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => deleteDocument(doc.id)}
                              disabled={doc.status === 'Processing'}
                              className="hover:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed p-1"
                              title="Delete document"
                              style={{cursor: doc.status === 'Processing' ? 'not-allowed' : 'pointer'}}
                            >
                              <img src={deleteIcon} alt="Delete" className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleView(doc.id)}
                              disabled={doc.status !== 'Success'}
                              className="hover:opacity-70 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed p-1"
                              title="View blueprint"
                              style={{ cursor: doc.status === 'Success' ? 'pointer' : 'not-allowed' }}
                            >
                              <img src={viewIcon} alt="View" className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500 italic">
                      No documents found. Upload a file to get started.
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                ←
              </button>
              <span className="text-sm text-gray-600">
                {currentPage} of {Math.max(1, totalPages)}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2 py-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
