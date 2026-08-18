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

  const fetchAuthSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings/auth')
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
      const res = await fetch('/api/admin/settings/auth', {
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
      const res = await fetch('/api/admin/settings/email')
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
      const res = await fetch('/api/admin/settings/email', {
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
      const res = await fetch('/api/admin/settings/security')
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
      const res = await fetch('/api/admin/settings/security', {
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
      const res = await fetch('/api/admin/settings/privacy')
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
      const res = await fetch('/api/admin/settings/privacy', {
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
      const res = await fetch('/api/admin/settings/integrations')
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
      const res = await fetch('/api/admin/settings/integrations', {
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
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 sm:p-6">
                <div className="flex flex-col md:flex-row items-start md:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-1 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> Global Theme Override
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Enable a festive event theme globally. Users will still retain control of their Light/Dark mode.
                    </p>
                  </div>
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
