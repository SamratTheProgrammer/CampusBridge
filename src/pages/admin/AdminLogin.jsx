import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import logoLight from '../../assets/CampusLogoLight.png'
import logoDark from '../../assets/CampusLogoDark.png'
import API_BASE from '../../utils/api'

const AdminLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState('super-admin')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    
    setIsLoading(true)
    try {
      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, role })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid admin credentials')
      }

      localStorage.setItem('adminToken', data.token)
      localStorage.setItem('adminUser', JSON.stringify(data.user))

      toast.success(data.message || `Successfully logged in as ${role.replace('-', ' ')}`)
      navigate('/admin')
    } catch (error) {
      console.error('Admin authentication error:', error)
      toast.error(error.message || 'Authentication failed. Please check credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-md w-full space-y-8 bg-card border border-border/50 p-8 sm:p-10 rounded-3xl shadow-xl backdrop-blur-sm relative">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </Link>

        <div className="text-center flex flex-col items-center">
          <Link to="/" className="mb-4">
            <img src={logoLight} alt="CampusBridge" className="h-16 w-auto block dark:hidden" />
            <img src={logoDark} alt="CampusBridge" className="h-16 w-auto hidden dark:block" />
          </Link>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">Admin Portal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to access control panel
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            {/* Role Select */}
            <div>
              <label htmlFor="role" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Admin Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-3 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all appearance-none cursor-pointer"
              >
                <option value="super-admin">Super Admin</option>
                <option value="moderator">Moderator</option>
                <option value="editor">Editor</option>
              </select>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@campusbridge.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
              <label htmlFor="remember-me" className="ml-2 text-muted-foreground cursor-pointer select-none">
                Remember device
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-all shadow-md shadow-primary/20"
            >
              {isLoading ? 'Authenticating...' : 'Access Console'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
