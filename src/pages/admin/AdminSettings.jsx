import React, { useState, useEffect } from 'react'
import { Settings, Shield, Key, Mail, Lock, Sliders, Globe, Eye, Sun, Moon, MonitorSmartphone, PartyPopper, Sparkles } from 'lucide-react'
import { useTheme } from '../../components/ThemeProvider'
import toast from 'react-hot-toast'
import API_BASE from '../../utils/api'

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('General')
  const { theme, setTheme, globalTheme, setGlobalTheme } = useTheme()
  
  // Form State
  const [platformName, setPlatformName] = useState('CampusBridge')
  const [tagline, setTagline] = useState('Connecting Mentor. Inspiring Futures.')
  const [email, setEmail] = useState('support@campusbridge.com')
  const [phone, setPhone] = useState('+91-6289258359')
  const [address, setAddress] = useState('Chandigarh University, Mohali, Punjab, India')

  const [adminGlobalTheme, setAdminGlobalTheme] = useState(globalTheme || 'system')
  const [suggestedTheme, setSuggestedTheme] = useState(null)
  const [holidayName, setHolidayName] = useState(null)
  const [isThemeLoading, setIsThemeLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'Appearance') {
      fetchGlobalThemeSettings()
    }
  }, [activeTab])

  const fetchGlobalThemeSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/theme`)
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setAdminGlobalTheme(data.globalTheme)
          setSuggestedTheme(data.suggestedTheme)
          setHolidayName(data.holidayName)
        }
      }
    } catch (error) {
      console.error('Error fetching theme settings:', error)
    }
  }

  const handleUpdateGlobalTheme = async (newTheme) => {
    setIsThemeLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ globalTheme: newTheme })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setAdminGlobalTheme(data.globalTheme)
          if (setGlobalTheme) setGlobalTheme(data.globalTheme)
          toast.success(`Global theme updated to ${newTheme}!`)
        }
      } else {
        toast.error('Failed to update global theme')
      }
    } catch (error) {
      console.error('Error updating global theme:', error)
      toast.error('Server error updating global theme')
    } finally {
      setIsThemeLoading(false)
    }
  }

  const handleSave = (e) => {
    e.preventDefault()
    toast.success('Settings updated successfully!')
  }

  const tabs = [
    { name: 'General', icon: Sliders },
    { name: 'Appearance', icon: Eye },
    { name: 'Authentication', icon: Shield },
    { name: 'Email & Notifications', icon: Mail },
    { name: 'Security', icon: Lock },
    { name: 'Privacy', icon: Key },
    { name: 'Integrations', icon: Globe },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage global system configurations and platform settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Settings Navigation */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm md:col-span-4 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.name
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </div>

        {/* Settings Form panel */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-sm md:col-span-8">
          <h2 className="text-lg font-bold text-foreground mb-6 border-b border-border/40 pb-3">
            {activeTab} Settings
          </h2>

          {activeTab === 'General' ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Platform Name</label>
                <input 
                  type="text" 
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Tagline</label>
                <input 
                  type="text" 
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Support Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Support Phone</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Platform Address</label>
                <textarea 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows="3"
                  className="w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
                  required
                />
              </div>

              <button 
                type="submit"
                className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/95 transition-all text-sm shadow-md shadow-primary/10"
              >
                Save Changes
              </button>
            </form>
          ) : activeTab === 'Appearance' ? (
            <div className="space-y-8">
              
              {/* Global Theme Override */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-1 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Global Theme Override (Admin Only)
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Enable a festive event theme globally. Users will still retain control of their Light/Dark mode.
                    </p>
                  </div>
                  {holidayName && suggestedTheme && (
                    <div className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
                      <PartyPopper className="w-4 h-4" />
                      Suggested: {holidayName} Theme
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['none', 'diwali', 'holi', 'independence'].map((t) => (
                    <button
                      key={t}
                      disabled={isThemeLoading}
                      onClick={() => handleUpdateGlobalTheme(t)}
                      className={`py-3 px-4 rounded-xl border-2 transition-all text-sm font-semibold capitalize flex items-center justify-center gap-2 ${
                        adminGlobalTheme === t
                          ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                          : 'border-border/50 bg-card hover:border-primary/50 text-muted-foreground hover:text-foreground'
                      } ${(t === 'diwali' || t === 'holi' || t === 'independence') && adminGlobalTheme !== t ? 'text-amber-600 border-amber-500/20 bg-amber-500/5 hover:border-amber-500/50' : ''}`}
                    >
                      {t === 'none' ? 'No Event' : t}
                      {t === suggestedTheme && adminGlobalTheme !== t && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border/40 pt-8">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Your Local Theme</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                      theme === 'light' 
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 text-primary' 
                        : 'border-border/50 bg-muted/20 hover:border-border hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Sun className="w-8 h-8 mb-3" />
                    <span className="font-semibold text-sm">Light Mode</span>
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                      theme === 'dark' 
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 text-primary' 
                        : 'border-border/50 bg-muted/20 hover:border-border hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <Moon className="w-8 h-8 mb-3" />
                    <span className="font-semibold text-sm">Dark Mode</span>
                  </button>

                  <button
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                      theme === 'system' 
                        ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 text-primary' 
                        : 'border-border/50 bg-muted/20 hover:border-border hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <MonitorSmartphone className="w-8 h-8 mb-3" />
                    <span className="font-semibold text-sm">System Sync</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  This only affects your current browser session. Local themes are ALWAYS respected. Global event themes apply festive accents on top of your local mode.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Configuration options for {activeTab} will be available in the next release.
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default AdminSettings
