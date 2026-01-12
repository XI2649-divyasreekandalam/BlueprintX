import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

type LoadingState = 'idle' | 'uploading' | 'analyzing' | 'generating' | 'processing'

export default function UploadPage() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<File[]>([])
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(Array.from(e.target.files))
    }
  }

  const handleSubmit = async () => {
    if (files.length === 0) return

    // Simulate processing states
    setLoadingState('uploading')
    await new Promise(resolve => setTimeout(resolve, 1500))

    setLoadingState('analyzing')
    await new Promise(resolve => setTimeout(resolve, 2000))

    setLoadingState('generating')
    await new Promise(resolve => setTimeout(resolve, 2000))

    setLoadingState('processing')
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Navigate to results page
    navigate('/results/1')
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const getLoadingMessage = () => {
    switch (loadingState) {
      case 'uploading':
        return 'Uploading files...'
      case 'analyzing':
        return 'Analyzing documents...'
      case 'generating':
        return 'Generating AI proposals...'
      case 'processing':
        return 'Processing results...'
      default:
        return ''
    }
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-2xl font-bold text-primary">BlueprintX</div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-text/70 hover:text-text transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text mb-4">Upload Requirements</h1>
          <p className="text-text/70 text-lg">
            Upload your requirements documents and other necessary files
          </p>
        </div>

        {/* Upload Area */}
        <div className="bg-background rounded-xl border-2 border-dashed border-border p-12 mb-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`text-center ${dragActive ? 'border-primary' : ''}`}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileInput}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <svg
                className="w-16 h-16 text-text/30 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-xl font-semibold text-text mb-2">
                Drag and drop files here, or click to browse
              </p>
              <p className="text-text/70 mb-4">
                Supported formats: PDF, DOC, DOCX, TXT
              </p>
              <button
                type="button"
                className="px-6 py-2 bg-surface border border-border rounded-lg text-text hover:bg-border transition-colors"
              >
                Select Files
              </button>
            </label>
          </div>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="bg-background rounded-xl border border-border p-6 mb-6">
            <h3 className="text-lg font-semibold text-text mb-4">Selected Files</h3>
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-surface rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-text/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-text">{file.name}</span>
                    <span className="text-text/50 text-sm">({(file.size / 1024).toFixed(2)} KB)</span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-error hover:text-error/80 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading States */}
        {loadingState !== 'idle' && (
          <div className="bg-background rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <div>
                <p className="font-semibold text-text">{getLoadingMessage()}</p>
                <div className="w-full bg-surface rounded-full h-2 mt-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{
                      width: loadingState === 'uploading' ? '25%' :
                             loadingState === 'analyzing' ? '50%' :
                             loadingState === 'generating' ? '75%' : '100%'
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={files.length === 0 || loadingState !== 'idle'}
            className="px-8 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingState === 'idle' ? 'Generate Proposals' : 'Processing...'}
          </button>
        </div>
      </main>
    </div>
  )
}
