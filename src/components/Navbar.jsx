import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Sun, Menu, X, Search } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { motion, AnimatePresence } from 'framer-motion'
import SearchModal from './SearchModal'

const Navbar = () => {
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

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

  const navLinks = [
    { name: 'Home', path: '/#home' },
    { name: 'Alumni', path: '/#alumni' },
    { name: 'Mentorship', path: '/#mentorship' },
    { name: 'Jobs', path: '/#jobs' },
    { name: 'Events', path: '/#events' },
    { name: 'Resources', path: '/#resources' },
    { name: 'About', path: '/#about' },
  ]

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
          <div className="flex h-16 items-center justify-between">
            
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <span className="font-bold text-xl tracking-tight">CampusBridge</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {link.name}
                </Link>
              ))}
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
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-md hover:bg-muted transition-colors"
                aria-label="Toggle dark mode"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">
                Login
              </Link>
              <Link to="/signup" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                Sign Up
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center gap-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 rounded-md hover:bg-muted transition-colors"
              >
                <Search className="h-5 w-5" />
              </button>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-md hover:bg-muted transition-colors"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
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
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-base font-medium text-muted-foreground hover:text-primary"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-4 border-t border-border/40 flex flex-col gap-3">
                  <Link
                    to="/login"
                    className="w-full text-center py-2 text-sm font-medium border border-input rounded-md hover:bg-accent transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="w-full text-center py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Sign Up
                  </Link>
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
