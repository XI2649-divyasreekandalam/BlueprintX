import { useState, useEffect } from 'react'
import logo from '../../assets/logo.svg'

export default function Footer() {
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="bg-white border-t border-gray-200 mt-20 relative pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {/* Left Column - Company Info */}
          <div>
            <img src={logo} alt="BlueprintX" className="h-8 mb-6" style={{marginLeft: '-20px'}} />
            <p className="text-gray-700 text-sm mb-3 leading-relaxed">
              Tower-B, BP414 Whitefield Main Rd, Pattandur Agrahara, Bengaluru 590008
            </p>
            <a href="tel:+14345464356" className="text-gray-700 underline hover:text-primary transition-colors block mb-2 text-sm">
              (434) 546-4356
            </a>
            <a href="mailto:contact@xebia.com" className="text-gray-700 underline hover:text-primary transition-colors text-sm">
              contact@xebia.com
            </a>
          </div>

          {/* Middle Column - Navigation */}
          <div>
            <ul className="space-y-3">
              <li>
                <a href="#about" className="text-gray-700 hover:text-primary transition-colors text-sm">
                  About
                </a>
              </li>
              <li>
                <a href="#growers" className="text-gray-700 hover:text-primary transition-colors text-sm">
                  Growers
                </a>
              </li>
              <li>
                <a href="#partners" className="text-gray-700 hover:text-primary transition-colors text-sm">
                  Partners
                </a>
              </li>
              <li>
                <a href="#contacts" className="text-gray-700 hover:text-primary transition-colors text-sm">
                  Contacts
                </a>
              </li>
            </ul>
          </div>

          {/* Right Column - Social Media & Copyright */}
          <div>
            <ul className="space-y-3 mb-8">
              <li>
                <a href="#facebook" className="text-gray-700 hover:text-primary transition-colors text-sm">
                  Facebook
                </a>
              </li>
              <li>
                <a href="#twitter" className="text-gray-700 hover:text-primary transition-colors text-sm">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#linkedin" className="text-gray-700 hover:text-primary transition-colors text-sm">
                  Linkedin
                </a>
              </li>
              <li>
                <a href="#instagram" className="text-gray-700 hover:text-primary transition-colors text-sm">
                  Instagram
                </a>
              </li>
            </ul>
            <p className="text-xs text-gray-500">©2026 Xebia. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#6a45e4] transition-all hover:scale-110 z-50"
          aria-label="Scroll to top"
          style={{ backgroundColor: '#7852FD', cursor: 'pointer' }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </footer>
  )
}
