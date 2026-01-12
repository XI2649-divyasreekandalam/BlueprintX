import { Link } from 'react-router-dom'
import logo from '../assets/logo.svg'
import documentAnalysisIcon from '../assets/document-analysis.svg'
import bulbIcon from '../assets/bulb.svg'
import diamondIcon from '../assets/diamond.svg'
import laptopIllustration from '../assets/landing-laptop.svg'
import Footer from '../components/layout/Footer'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <img src={logo} alt="BlueprintX" className="h-8" />
            <Link
              to="/login"
              className="text-gray-800 hover:text-primary transition-colors font-medium flex items-center gap-2"
            >
              <span>Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12 md:py-20">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Let Your Documents<br />
            Do the{' '}
            <span 
              className="vibur-regular"
              style={{
                fontSize: '94px',
                lineHeight: '100%',
                letterSpacing: '0%',
                color: '#7852FD'
              }}
            >
              Thinking
            </span>
          </h1>
          <p className="text-base md:text-lg text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed px-4">
            Upload your requirements documents and let BlueprintX identify innovative ways to apply AI to your use case. Streamline your workflow with intelligent, automation-driven recommendations.
          </p>
          <Link
            to="/login?mode=signup"
            className="inline-block px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-[#6a45e4] transition-colors shadow-md hover:shadow-lg mb-16"
            style={{backgroundColor: '#7852FD'}}
          >
            Get Started
          </Link>
          
          {/* Laptop Illustration */}
          <div className="mt-8 flex justify-center px-4">
            <img 
              src={laptopIllustration} 
              alt="Document analysis illustration" 
              className="w-full max-w-5xl h-auto"
            />
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 px-4">
          <h2 className="text-center text-3xl md:text-4xl text-gray-800 mb-16">
            <span className="vibur-regular" style={{color: '#7852FD'}}>Brownie</span> Features
          </h2>
          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {/* Document Analysis */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <img 
                  src={documentAnalysisIcon} 
                  alt="Document Analysis" 
                  className="w-14 h-16"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Document Analysis</h3>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                Upload your requirements documents and let our AI quickly analyze and understand your needs. Turn complex inputs into clear, actionable insights.
              </p>
            </div>

            {/* AI Proposals */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <img 
                  src={bulbIcon} 
                  alt="AI Proposals" 
                  className="w-14 h-16"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">AI Proposals</h3>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                Receive multiple AI-powered proposals tailored to your specific use case. Compare options and choose the best-fit solution with confidence.
              </p>
            </div>

            {/* Fast Results */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <img 
                  src={diamondIcon} 
                  alt="Fast Results" 
                  className="w-14 h-16"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Fast Results</h3>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                Get comprehensive proposals in minutes, not days. Accelerate your project planning with speed and precision.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
