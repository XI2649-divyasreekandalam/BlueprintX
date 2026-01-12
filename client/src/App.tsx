import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UploadPage from './pages/UploadPage'
import ResultsPage from './pages/ResultsPage'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicRoute from './components/auth/PublicRoute'

function App() {
  // IMPORTANT: Replace the clientId below with your actual Google Client ID from Google Cloud Console
  const GOOGLE_CLIENT_ID = "102796246387-v7r50u7o07a8u0l7p1p7p1p7p1p7p1p.apps.googleusercontent.com"; 

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes - Accessible only when NOT logged in */}
          <Route element={<PublicRoute />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected Routes - Accessible only when logged in */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/results/:id" element={<ResultsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  )
}

export default App
