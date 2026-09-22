import React, { useState, useEffect } from 'react'
import { Settings, Shield, Key, Mail, Lock, Sliders, Globe, Eye, Sun, Moon, MonitorSmartphone, PartyPopper, Sparkles, Flame, Palette, Flag, CheckCircle2, Check } from 'lucide-react'
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

  const [adminGlobalTheme, setAdminGlobalTheme] = useState(() => {
    return (globalTheme === 'system' || !globalTheme) ? 'none' : globalTheme;
  })
  const [suggestedTheme, setSuggestedTheme] = useState(null)
  const [holidayName, setHolidayName] = useState(null)
  const [isThemeLoading, setIsThemeLoading] = useState(false)

  // Keep adminGlobalTheme in sync when globalTheme changes in context
  useEffect(() => {
    if (globalTheme) {
      setAdminGlobalTheme(globalTheme === 'system' ? 'none' : globalTheme);
    }
  }, [globalTheme]);

  // Auth State
  const [authSettings, setAuthSettings] = useState({
    allowSignups: true,
    requireEmailVerification: true,
    enableGoogleAuth: true
  })
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  // Email & Notifications State
  const [emailSettings, setEmailSettings] = useState({
    enableEmailNotifications: true,
    enablePushNotifications: true,
    notifyOnNewJobPost: true,
    notifyOnNewEvent: true,
    senderEmailAddress: 'noreply@campusbridge.com'
  })
  const [isEmailLoading, setIsEmailLoading] = useState(false)

  const [securitySettings, setSecuritySettings] = useState({
    requireTwoFactorAuth: false,
    enforceStrongPasswords: true,
    sessionTimeoutValue: 60,
    sessionTimeoutUnit: 'days',
    maxFailedLoginAttempts: 5,
    allowedIPRanges: ''
  })
  const [isSecurityLoading, setIsSecurityLoading] = useState(false)

  // Privacy State
  const [privacySettings, setPrivacySettings] = useState({
    requireCookieConsent: true,
    allowAnalyticsTracking: true,
    dataRetentionDays: 365,
    displayUserProfilesPublicly: false
  })
  const [isPrivacyLoading, setIsPrivacyLoading] = useState(false)

  // Integrations State
  const [integrationSettings, setIntegrationSettings] = useState({
    enableZoomIntegration: false,
    enableGoogleCalendar: false,
    googleAnalyticsTrackingId: '',
    slackWebhookUrl: ''
  })
  const [isIntegrationLoading, setIsIntegrationLoading] = useState(false)

  useEffect(() => {
    if (activeTab === 'Appearance') {
      fetchGlobalThemeSettings()
    } else if (activeTab === 'Authentication') {
      fetchAuthSettings()
    } else if (activeTab === 'Email & Notifications') {
      fetchEmailSettings()
    } else if (activeTab === 'Security') {
      fetchSecuritySettings()
    } else if (activeTab === 'Privacy') {
      fetchPrivacySettings()
    } else if (activeTab === 'Integrations') {
      fetchIntegrationSettings()
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
    const normalized = newTheme === 'system' ? 'none' : newTheme;
    // Optimistically update theme state immediately
    setAdminGlobalTheme(normalized);
    if (setGlobalTheme) setGlobalTheme(normalized);

    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ globalTheme: normalized })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          const finalTheme = data.globalTheme === 'system' ? 'none' : data.globalTheme;
          setAdminGlobalTheme(finalTheme)
          if (setGlobalTheme) setGlobalTheme(finalTheme)
          const display = finalTheme === 'none' ? 'Default (No Event)' : finalTheme.charAt(0).toUpperCase() + finalTheme.slice(1);
          toast.success(`Global theme updated to ${display}!`)
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

  const fetchAuthSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/auth`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.authSettings) {
          setAuthSettings(prev => ({ ...prev, ...data.authSettings }))
        }
      }
    } catch (error) {
      console.error('Error fetching auth settings:', error)
    }
  }

  const handleUpdateAuthSettings = async (e) => {
    e.preventDefault()
    setIsAuthLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/auth`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authSettings })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setAuthSettings(prev => ({ ...prev, ...data.authSettings }))
          toast.success('Authentication settings updated!')
        }
      } else {
        toast.error('Failed to update auth settings')
      }
    } catch (error) {
      console.error('Error updating auth settings:', error)
      toast.error('Server error updating auth settings')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleAuthToggle = (key) => {
    setAuthSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const fetchEmailSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/email`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.emailSettings) {
          setEmailSettings(prev => ({ ...prev, ...data.emailSettings }))
        }
      }
    } catch (error) {
      console.error('Error fetching email settings:', error)
    }
  }

  const handleUpdateEmailSettings = async (e) => {
    e.preventDefault()
    setIsEmailLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/email`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailSettings })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setEmailSettings(prev => ({ ...prev, ...data.emailSettings }))
          toast.success('Email & Notification settings updated!')
        }
      } else {
        toast.error('Failed to update email settings')
      }
    } catch (error) {
      console.error('Error updating email settings:', error)
      toast.error('Server error updating email settings')
    } finally {
      setIsEmailLoading(false)
    }
  }

  const handleEmailToggle = (key) => {
    setEmailSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleEmailInputChange = (e) => {
    const { name, value } = e.target;
    setEmailSettings(prev => ({ ...prev, [name]: value }))
  }

  const fetchSecuritySettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/security`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.securitySettings) {
          setSecuritySettings(prev => ({ ...prev, ...data.securitySettings }))
        }
      }
    } catch (error) {
      console.error('Error fetching security settings:', error)
    }
  }

  const handleUpdateSecuritySettings = async (e) => {
    e.preventDefault()
    setIsSecurityLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/security`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ securitySettings })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setSecuritySettings(prev => ({ ...prev, ...data.securitySettings }))
          toast.success('Security settings updated!')
        }
      } else {
        toast.error('Failed to update security settings')
      }
    } catch (error) {
      console.error('Error updating security settings:', error)
      toast.error('Server error updating security settings')
    } finally {
      setIsSecurityLoading(false)
    }
  }

  const handleSecurityToggle = (key) => {
    setSecuritySettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSecurityInputChange = (e) => {
    const { name, value } = e.target;
    setSecuritySettings(prev => ({ ...prev, [name]: value }))
  }

  const fetchPrivacySettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/privacy`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.privacySettings) {
          setPrivacySettings(prev => ({ ...prev, ...data.privacySettings }))
        }
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error)
    }
  }

  const handleUpdatePrivacySettings = async (e) => {
    e.preventDefault()
    setIsPrivacyLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/privacy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privacySettings })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setPrivacySettings(prev => ({ ...prev, ...data.privacySettings }))
          toast.success('Privacy settings updated!')
        }
      } else {
        toast.error('Failed to update privacy settings')
      }
    } catch (error) {
      console.error('Error updating privacy settings:', error)
      toast.error('Server error updating privacy settings')
    } finally {
      setIsPrivacyLoading(false)
    }
  }

  const handlePrivacyToggle = (key) => {
    setPrivacySettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handlePrivacyInputChange = (e) => {
    const { name, value } = e.target;
    setPrivacySettings(prev => ({ ...prev, [name]: value }))
  }

  const fetchIntegrationSettings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/integrations`)
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.integrationSettings) {
          setIntegrationSettings(prev => ({ ...prev, ...data.integrationSettings }))
        }
      }
    } catch (error) {
      console.error('Error fetching integration settings:', error)
    }
  }

  const handleUpdateIntegrationSettings = async (e) => {
    e.preventDefault()
    setIsIntegrationLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings/integrations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationSettings })
      })
      if (res.ok) {
        const data = await res.json()
        if (data.success) {
          setIntegrationSettings(prev => ({ ...prev, ...data.integrationSettings }))
          toast.success('Integration settings updated!')
        }
      } else {
        toast.error('Failed to update integration settings')
      }
    } catch (error) {
      console.error('Error updating integration settings:', error)
      toast.error('Server error updating integration settings')
    } finally {
      setIsIntegrationLoading(false)
    }
  }

  const handleIntegrationToggle = (key) => {
    setIntegrationSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleIntegrationInputChange = (e) => {
    const { name, value } = e.target;
    setIntegrationSettings(prev => ({ ...prev, [name]: value }))
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
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage global system configurations and platform settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Settings Navigation */}
        <div className="bg-card border border-border/50 rounded-2xl p-3 sm:p-4 shadow-sm md:col-span-4 lg:col-span-3 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.name
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/10'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{tab.name}</span>
              </button>
            )
          })}
        </div>

        {/* Settings Form panel */}
        <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-sm md:col-span-8 lg:col-span-9">
          {activeTab !== 'Appearance' && (
            <h2 className="text-lg font-bold text-foreground mb-6 border-b border-border/40 pb-3">
              {activeTab} Settings
            </h2>
          )}

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
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
                <div>
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" /> Theme & Appearance
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Customize platform-wide festive themes and personal workspace visual preferences.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary self-start sm:self-auto shrink-0 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Active Global Theme: <span className="capitalize font-bold">{adminGlobalTheme === 'none' ? 'Default' : adminGlobalTheme}</span></span>
                </div>
              </div>
              
              {/* Global Theme Override */}
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                      <Globe className="w-4 h-4" /> Global Platform Event Theme
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      Enable a festive campus event theme for all users across the platform. Users will still retain personal control of their Light/Dark/System mode.
                    </p>
                  </div>
                  {holidayName && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-semibold shrink-0">
                      <PartyPopper className="w-4 h-4" />
                      <span>Upcoming: <strong>{holidayName}</strong></span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                  {[
                    {
                      id: 'none',
                      title: 'Default Theme',
                      subtitle: 'Classic CampusBridge purple & indigo palette',
                      icon: Sparkles,
                      iconColor: 'text-violet-500 dark:text-violet-400',
                      iconBg: 'bg-violet-500/10 dark:bg-violet-500/20',
                      accentGradient: 'from-violet-500 to-indigo-500',
                      palette: ['#8b5cf6', '#6366f1', '#3b82f6', '#10b981'],
                      badge: 'Default',
                    },
                    {
                      id: 'diwali',
                      title: 'Diwali Theme',
                      subtitle: 'Warm golden amber, glowing lights & diyas',
                      icon: Flame,
                      iconColor: 'text-amber-500 dark:text-amber-400',
                      iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
                      accentGradient: 'from-amber-500 to-orange-500',
                      palette: ['#f59e0b', '#d97706', '#ea580c', '#fbbf24'],
                      badge: 'Festival of Lights',
                    },
                    {
                      id: 'holi',
                      title: 'Holi Theme',
                      subtitle: 'Vibrant celebratory colors & lively gulal',
                      icon: Palette,
                      iconColor: 'text-pink-500 dark:text-pink-400',
                      iconBg: 'bg-pink-500/10 dark:bg-pink-500/20',
                      accentGradient: 'from-pink-500 via-rose-500 to-cyan-500',
                      palette: ['#ec4899', '#06b6d4', '#f97316', '#a855f7'],
                      badge: 'Festival of Colors',
                    },
                    {
                      id: 'independence',
                      title: 'Independence Day',
                      subtitle: 'Saffron, white & green national tricolor',
                      icon: Flag,
                      iconColor: 'text-orange-500 dark:text-orange-400',
                      iconBg: 'bg-orange-500/10 dark:bg-orange-500/20',
                      accentGradient: 'from-orange-500 via-white to-emerald-600',
                      palette: ['#f97316', '#ffffff', '#16a34a', '#1e3a8a'],
                      badge: 'Patriotic Tricolor',
                    },
                  ].map((item) => {
                    const Icon = item.icon
                    const isSelected = adminGlobalTheme === item.id || (item.id === 'none' && (adminGlobalTheme === 'none' || adminGlobalTheme === 'system'))
                    const isRecommended = item.id === suggestedTheme && !isSelected
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={isThemeLoading}
                        onClick={() => handleUpdateGlobalTheme(item.id)}
                        className={`text-left p-5 sm:p-6 rounded-2xl border-2 transition-all duration-200 relative flex flex-col justify-between group overflow-hidden ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-2 ring-primary/25'
                            : 'border-border/60 bg-card hover:border-primary/40 hover:bg-muted/40 hover:shadow-sm'
                        } ${isRecommended ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
                      >
                        {/* Top accent gradient bar */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.accentGradient} opacity-70 group-hover:opacity-100 transition-opacity`} />

                        {/* Top Row: Icon on left, Active / Recommended badge on right */}
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div className={`w-10 h-10 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0 shadow-xs`}>
                            <Icon className="w-5 h-5" />
                          </div>

                          {/* Selection Badge / Indicator */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isRecommended && (
                              <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0 whitespace-nowrap animate-pulse">
                                Suggested
                              </span>
                            )}
                            {isSelected ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/15 px-3 py-1 rounded-full border border-primary/25 shrink-0 whitespace-nowrap shadow-xs">
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Active
                              </span>
                            ) : (
                              <span className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary/50 transition-colors shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Title, Badge & Subtitle - Full Width */}
                        <div className="space-y-1.5 mb-5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                              {item.title}
                            </h4>
                            <span className="text-[10px] font-semibold text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md border border-border/50 shrink-0">
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                            {item.subtitle}
                          </p>
                        </div>

                        {/* Color Palette Preview Swatches */}
                        <div className="flex items-center justify-between pt-3.5 border-t border-border/40 mt-auto">
                          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                            Palette
                          </span>
                          <div className="flex items-center gap-2">
                            {item.palette.map((color, idx) => (
                              <span 
                                key={idx} 
                                className="w-4 h-4 rounded-full border border-black/15 dark:border-white/25 shadow-xs shrink-0 transition-transform duration-200 group-hover:scale-110" 
                                style={{ backgroundColor: color }} 
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Local Theme Selector */}
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 sm:p-6 space-y-5">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Sun className="w-4 h-4 text-primary" /> Personal Workspace Theme
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    This preference applies to your current device and account session. Local themes are ALWAYS respected.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'light',
                      title: 'Light Mode',
                      desc: 'Clean & high clarity for bright environments',
                      icon: Sun,
                      iconColor: 'text-amber-500 dark:text-amber-400',
                      iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
                    },
                    {
                      id: 'dark',
                      title: 'Dark Mode',
                      desc: 'Deep modern aesthetic that is easy on the eyes',
                      icon: Moon,
                      iconColor: 'text-indigo-400 dark:text-indigo-300',
                      iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
                    },
                    {
                      id: 'system',
                      title: 'System Sync',
                      desc: 'Automatically matches your device OS preference',
                      icon: MonitorSmartphone,
                      iconColor: 'text-emerald-500 dark:text-emerald-400',
                      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
                    },
                  ].map((t) => {
                    const Icon = t.icon
                    const isSelected = theme === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id)}
                        className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between group ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-2 ring-primary/25'
                            : 'border-border/60 bg-card hover:border-border hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className={`w-10 h-10 rounded-xl ${t.iconBg} ${t.iconColor} flex items-center justify-center shrink-0 shadow-xs`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/15 px-2.5 py-1 rounded-full border border-primary/25 shrink-0 whitespace-nowrap shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Active
                            </span>
                          ) : (
                            <span className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary/50 transition-colors shrink-0" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-foreground mb-1 group-hover:text-primary transition-colors">{t.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : activeTab === 'Authentication' ? (
            <form onSubmit={handleUpdateAuthSettings} className="space-y-6">
              <div className="space-y-4">
                {[
                  { key: 'allowSignups', title: 'Allow New Signups', desc: 'Enable or disable new user registrations across the platform.' },
                  { key: 'requireEmailVerification', title: 'Require Email Verification', desc: 'Force users to verify their email before accessing the platform.' },
                  { key: 'enableGoogleAuth', title: 'Enable Google SSO', desc: 'Allow users to sign in using their Google account.' }
                ].map(setting => (
                  <div key={setting.key} className="flex items-center justify-between p-4 bg-muted/40 border border-border/50 rounded-xl">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{setting.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{setting.desc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAuthToggle(setting.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${authSettings[setting.key] ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-card shadow-sm transition-transform ${authSettings[setting.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                type="submit"
                disabled={isAuthLoading}
                className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/95 transition-all text-sm shadow-md shadow-primary/10 disabled:opacity-70"
              >
                {isAuthLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          ) : activeTab === 'Email & Notifications' ? (
            <form onSubmit={handleUpdateEmailSettings} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Sender Email Address</label>
                  <input 
                    type="email" 
                    name="senderEmailAddress"
                    value={emailSettings.senderEmailAddress}
                    onChange={handleEmailInputChange}
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">This email will be used as the "From" address for all automated platform emails.</p>
                </div>

                <div className="pt-4 border-t border-border/40">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'enableEmailNotifications', title: 'Global Email Notifications', desc: 'Enable or disable all outbound email communications.' },
                      { key: 'enablePushNotifications', title: 'Global Push Notifications', desc: 'Enable or disable web push notifications for users.' },
                      { key: 'notifyOnNewJobPost', title: 'New Job Alerts', desc: 'Automatically notify eligible users when a new job is posted.' },
                      { key: 'notifyOnNewEvent', title: 'New Event Alerts', desc: 'Automatically notify users when a new event is scheduled.' }
                    ].map(setting => (
                      <div key={setting.key} className="flex items-center justify-between p-4 bg-muted/40 border border-border/50 rounded-xl">
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{setting.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{setting.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleEmailToggle(setting.key)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailSettings[setting.key] ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-card shadow-sm transition-transform ${emailSettings[setting.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button 
                type="submit"
                disabled={isEmailLoading}
                className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/95 transition-all text-sm shadow-md shadow-primary/10 disabled:opacity-70"
              >
                {isEmailLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          ) : activeTab === 'Security' ? (
            <form onSubmit={handleUpdateSecuritySettings} className="space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Session Timeout</label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        name="sessionTimeoutValue"
                        value={securitySettings.sessionTimeoutValue}
                        onChange={handleSecurityInputChange}
                        min="1"
                        disabled={securitySettings.sessionTimeoutUnit === 'never'}
                        className={`w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all ${securitySettings.sessionTimeoutUnit === 'never' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        required={securitySettings.sessionTimeoutUnit !== 'never'}
                      />
                      <select
                        name="sessionTimeoutUnit"
                        value={securitySettings.sessionTimeoutUnit}
                        onChange={handleSecurityInputChange}
                        className="px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all outline-none"
                      >
                        <option value="days" className="bg-card text-foreground">Days</option>
                        <option value="months" className="bg-card text-foreground">Months</option>
                        <option value="never" className="bg-card text-foreground">Never</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Global API Rate Limit</label>
                    <input 
                      type="number" 
                      name="maxFailedLoginAttempts"
                      value={securitySettings.maxFailedLoginAttempts}
                      onChange={handleSecurityInputChange}
                      min="1"
                      className="w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                      required
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">Max API requests per 15 minutes per IP address.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Allowed IP Ranges (Comma separated)</label>
                  <input 
                    type="text" 
                    name="allowedIPRanges"
                    value={securitySettings.allowedIPRanges}
                    onChange={handleSecurityInputChange}
                    placeholder="e.g. 192.168.1.1, 10.0.0.0/24"
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">Leave blank to allow access from any IP address.</p>
                </div>

                <div className="pt-4 border-t border-border/40">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Security Policies</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'requireTwoFactorAuth', title: 'Require 2FA', desc: 'Force all users to configure Two-Factor Authentication.' },
                      { key: 'enforceStrongPasswords', title: 'Enforce Strong Passwords', desc: 'Require at least 8 characters, numbers, and symbols.' }
                    ].map(setting => (
                      <div key={setting.key} className="flex items-center justify-between p-4 bg-muted/40 border border-border/50 rounded-xl">
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{setting.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{setting.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSecurityToggle(setting.key)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${securitySettings[setting.key] ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-card shadow-sm transition-transform ${securitySettings[setting.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button 
                type="submit"
                disabled={isSecurityLoading}
                className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/95 transition-all text-sm shadow-md shadow-primary/10 disabled:opacity-70"
              >
                {isSecurityLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          ) : activeTab === 'Privacy' ? (
            <form onSubmit={handleUpdatePrivacySettings} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Data Retention (Days)</label>
                  <input 
                    type="number" 
                    name="dataRetentionDays"
                    value={privacySettings.dataRetentionDays}
                    onChange={handlePrivacyInputChange}
                    min="30"
                    className="w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">How long deleted accounts and inactive data should be retained on our servers.</p>
                </div>

                <div className="pt-4 border-t border-border/40">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Privacy Policies</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'requireCookieConsent', title: 'Require Cookie Consent', desc: 'Display a cookie consent banner to all new visitors.' },
                      { key: 'allowAnalyticsTracking', title: 'Allow Analytics Tracking', desc: 'Collect anonymous usage statistics to improve the platform.' },
                      { key: 'displayUserProfilesPublicly', title: 'Public Profiles', desc: 'Allow non-logged-in users (guests) to view user profiles.' }
                    ].map(setting => (
                      <div key={setting.key} className="flex items-center justify-between p-4 bg-muted/40 border border-border/50 rounded-xl">
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{setting.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{setting.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handlePrivacyToggle(setting.key)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacySettings[setting.key] ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-card shadow-sm transition-transform ${privacySettings[setting.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button 
                type="submit"
                disabled={isPrivacyLoading}
                className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/95 transition-all text-sm shadow-md shadow-primary/10 disabled:opacity-70"
              >
                {isPrivacyLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          ) : activeTab === 'Integrations' ? (
            <form onSubmit={handleUpdateIntegrationSettings} className="space-y-6">
              <div className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Google Analytics Measurement ID</label>
                    <input 
                      type="text" 
                      name="googleAnalyticsTrackingId"
                      value={integrationSettings.googleAnalyticsTrackingId}
                      onChange={handleIntegrationInputChange}
                      placeholder="G-XXXXXXXXXX"
                      className="w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Slack Webhook URL</label>
                    <input 
                      type="url" 
                      name="slackWebhookUrl"
                      value={integrationSettings.slackWebhookUrl}
                      onChange={handleIntegrationInputChange}
                      placeholder="https://hooks.slack.com/services/..."
                      className="w-full px-4 py-2.5 bg-muted/40 border border-border/50 rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border/40">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Service Integrations</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'enableZoomIntegration', title: 'Zoom Meetings Integration', desc: 'Allow mentors to automatically generate Zoom meeting links for sessions.' },
                      { key: 'enableGoogleCalendar', title: 'Google Calendar Sync', desc: 'Sync scheduled events and sessions directly to Google Calendar.' }
                    ].map(setting => (
                      <div key={setting.key} className="flex items-center justify-between p-4 bg-muted/40 border border-border/50 rounded-xl">
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{setting.title}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{setting.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleIntegrationToggle(setting.key)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${integrationSettings[setting.key] ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-card shadow-sm transition-transform ${integrationSettings[setting.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button 
                type="submit"
                disabled={isIntegrationLoading}
                className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-xl hover:bg-primary/95 transition-all text-sm shadow-md shadow-primary/10 disabled:opacity-70"
              >
                {isIntegrationLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
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
