import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Mail, Lock, GraduationCap, Building2 } from 'lucide-react'

const Login = () => {
  const [selectedRole, setSelectedRole] = useState(null) // 'student' | 'alumni' | null

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 overflow-hidden relative">
      <AnimatePresence mode="wait">
        {!selectedRole ? (
          <motion.div 
            key="role-selection"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-5xl"
          >
            <div className="text-center mb-8 md:mb-12">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-3">Welcome to CampusBridge</h1>
              <p className="text-base text-muted-foreground">Please select your role to continue</p>
            </div>

            <div className="flex flex-col md:flex-row relative max-w-5xl mx-auto">
              {/* Vertical divider on desktop */}
              <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-border/50 -translate-x-1/2"></div>
              
              {/* Alumni Side */}
              <div className="flex-1 flex flex-col items-center text-center px-6 md:px-16 py-6 md:py-4">
                <div className="text-[10px] uppercase tracking-widest font-bold bg-primary/10 text-primary px-3 py-1 rounded-full mb-4">
                  ALUMNI
                </div>
                <h2 className="text-3xl font-bold mb-4 text-foreground tracking-tight">For <span className="italic">Alumni</span></h2>
                <p className="text-base text-muted-foreground mb-8 max-w-sm leading-relaxed">
                  Give back to your alma mater, mentor upcoming talent, and network with other professionals.
                </p>
                <button 
                  onClick={() => setSelectedRole('alumni')}
                  className="px-8 py-3 w-full max-w-[240px] bg-primary text-primary-foreground text-base font-medium rounded-lg hover:bg-primary/90 transition-all shadow-md shadow-primary/25 hover:-translate-y-0.5"
                >
                  Login
                </button>
                <div className="mt-8 text-sm text-muted-foreground">
                  Don't have an account?<br />
                  <Link to="/signup" className="font-semibold text-primary hover:underline mt-1 inline-block">
                    Sign up.
                  </Link>
                </div>
              </div>

              {/* Horizontal divider on mobile */}
              <div className="w-full h-px bg-border/50 md:hidden my-6"></div>

              {/* Student Side */}
              <div className="flex-1 flex flex-col items-center text-center px-6 md:px-16 py-6 md:py-4">
                <div className="text-[10px] uppercase tracking-widest font-bold bg-primary/10 text-primary px-3 py-1 rounded-full mb-4">
                  STUDENTS
                </div>
                <h2 className="text-3xl font-bold mb-4 text-foreground tracking-tight">For <span className="italic">Students</span></h2>
                <p className="text-base text-muted-foreground mb-8 max-w-sm leading-relaxed">
                  Join the community, connect with mentors, discover job opportunities, and accelerate your career.
                </p>
                <button 
                  onClick={() => setSelectedRole('student')}
                  className="px-8 py-3 w-full max-w-[240px] bg-primary text-primary-foreground text-base font-medium rounded-lg hover:bg-primary/90 transition-all shadow-md shadow-primary/25 hover:-translate-y-0.5"
                >
                  Login
                </button>
                <div className="mt-8 text-sm text-muted-foreground">
                  Don't have an account?<br />
                  <Link to="/signup" className="font-semibold text-primary hover:underline mt-1 inline-block">
                    Sign up.
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-8">
               <Link to="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
               </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="login-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-card border border-border/40 rounded-2xl p-8 shadow-xl relative z-10 mx-auto"
          >
            <button 
              onClick={() => setSelectedRole(null)} 
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Change Role
            </button>
            
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                {selectedRole === 'student' ? <GraduationCap className="w-8 h-8 text-primary" /> : <Building2 className="w-8 h-8 text-primary" />}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                Welcome Back, {selectedRole === 'student' ? 'Student' : 'Alumni'}
              </h1>
              <p className="text-muted-foreground">Enter your credentials to access your account</p>
            </div>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="email" 
                    placeholder="name@example.com" 
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-foreground"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all mt-6 shadow-md shadow-primary/20"
              >
                Sign In
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/40"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <button className="w-full mt-6 py-2.5 flex items-center justify-center gap-2 border border-input rounded-lg hover:bg-muted transition-colors font-medium text-foreground">
                <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Login
