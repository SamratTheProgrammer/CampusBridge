import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun, Menu, X, Search } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import ThemeToggle from './ThemeToggle'
import { useUser, useClerk } from '@clerk/clerk-react'
import { motion, AnimatePresence } from 'framer-motion'
import SearchModal from './SearchModal'
import logoLight from '../assets/CampusLogoLight.png'
import logoDark from '../assets/CampusLogoDark.png'

const Navbar = () => {
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  
  const { isSignedIn, user, isLoaded } = useUser()
  const { signOut } = useClerk()

  const navLinks = [
    { name: 'Home', path: '/#home', id: 'home' },
    { name: 'Mentor', path: '/#mentor', id: 'mentor' },
    { name: 'Mentorship', path: '/#mentorship', id: 'mentorship' },
    { name: 'Jobs', path: '/#jobs', id: 'jobs' },
    { name: 'Events', path: '/#events', id: 'events' },
    { name: 'Resources', path: '/#resources', id: 'resources' },
    { name: 'About', path: '/#about', id: 'about' },
  ]

  // Handle scroll detection and active nav link
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)

      // Only run scrollspy if on the home page
      if (window.location.pathname === '/') {
        let current = 'home'
        let minDistance = Infinity
        for (const link of navLinks) {
          const element = document.getElementById(link.id)
          if (element) {
            const rect = element.getBoundingClientRect()
            if (rect.top <= 300) {
              const distance = 300 - rect.top
              if (distance < minDistance) {
                minDistance = distance
                current = link.id
              }
            }
          }
        }
        setActiveSection(current)
      }
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Trigger once on mount
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (e, path, id) => {
    if (path.startsWith('/#') && window.location.pathname === '/') {
      e.preventDefault()
      const element = document.getElementById(id)
      if (element) {
        const offset = 80 // navbar height
        const bodyRect = document.body.getBoundingClientRect().top
        const elementRect = element.getBoundingClientRect().top
        const elementPosition = elementRect - bodyRect
        const offsetPosition = elementPosition - offset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
        
        window.history.pushState(null, '', path)
        setActiveSection(id)
      }
      setIsMobileMenuOpen(false)
    }
  }

  // Handle Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <nav
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled
            ? 'border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm py-0'
            : 'bg-transparent border-transparent py-2'
          }`}
      >
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-4">
          <div className="flex h-16 items-center justify-between">

            {/* Logo */}
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center">
                <img src={logoLight} alt="CampusBridge" className="h-12 md:h-12 w-auto block dark:hidden" />
                <img src={logoDark} alt="CampusBridge" className="h-12 md:h-12 w-auto hidden dark:block" />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = activeSection === link.id && window.location.pathname === '/'
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={(e) => handleNavClick(e, link.path, link.id)}
                    className={`text-base font-medium transition-colors relative px-1 py-1 ${
                      isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {link.name}
                    {isActive && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-primary rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Right Side Actions */}
            <div className="hidden lg:flex items-center gap-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors bg-muted/50 px-3 py-1.5 rounded-full border border-border/50 hover:border-border"
              >
                <Search className="h-4 w-4" />
                <span>Search...</span>
                <kbd className="hidden sm:inline-block pointer-events-none text-[10px] font-sans font-semibold bg-background border border-border/50 px-1.5 py-0.5 rounded ml-2">
                  ⌘K
                </kbd>
              </button>
              <ThemeToggle />
              
              {!isLoaded ? (
                <div className="w-20 h-8 bg-muted animate-pulse rounded-md"></div>
              ) : isSignedIn ? (
                <div className="relative">
                  <button 
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center gap-2 p-1 pl-3 pr-1 rounded-full border border-border/50 hover:bg-muted transition-colors"
                  >
                    <span className="text-sm font-medium hidden sm:block">{user.firstName}</span>
                    <img 
                      src={user.imageUrl} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  </button>
                  
                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg overflow-hidden flex flex-col py-1"
                      >
                        <div className="px-4 py-2 border-b border-border/50">
                          <p className="text-sm font-medium">{user.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.primaryEmailAddress?.emailAddress}</p>
                        </div>
                        <Link 
                          to={(user.publicMetadata?.role || sessionStorage.getItem('campusbridge_user_role')) === 'mentor' ? '/mentor-dashboard' : '/dashboard'} 
                          className="px-4 py-2 text-sm hover:bg-muted transition-colors font-medium text-primary"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          Go to Dashboard
                        </Link>
                        <button 
                          onClick={() => {
                            setIsProfileOpen(false)
                            signOut()
                          }}
                          className="px-4 py-2 text-sm text-left text-destructive hover:bg-muted transition-colors"
                        >
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
                    Login
                  </Link>
                  <Link to="/signup" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-md hover:bg-muted transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md hover:bg-muted transition-colors"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-border/40 bg-background overflow-hidden"
            >
              <div className="flex flex-col px-6 py-4 space-y-4">
                {navLinks.map((link) => {
                  const isActive = activeSection === link.id && window.location.pathname === '/'
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={(e) => handleNavClick(e, link.path, link.id)}
                      className={`text-base font-medium transition-colors ${
                        isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {link.name}
                    </Link>
                  )
                })}
                <div className="pt-4 border-t border-border/40 flex flex-col gap-3">
                  {!isLoaded ? null : isSignedIn ? (
                    <>
                      <Link
                        to={(user.publicMetadata?.role || sessionStorage.getItem('campusbridge_user_role')) === 'mentor' ? '/mentor-dashboard' : '/dashboard'}
                        className="w-full text-center py-2 text-sm font-medium border border-input rounded-md hover:bg-accent transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Go to Dashboard
                      </Link>
                      <button
                        onClick={() => {
                          setIsMobileMenuOpen(false)
                          signOut()
                        }}
                        className="w-full text-center py-2 text-sm font-medium text-destructive border border-destructive/20 rounded-md hover:bg-destructive/10 transition-colors"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="w-full text-center py-2 text-sm font-medium border border-input rounded-md hover:bg-accent transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        to="/signup"
                        className="w-full text-center py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}

export default Navbar
