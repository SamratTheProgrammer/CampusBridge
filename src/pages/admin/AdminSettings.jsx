import React, { useState } from 'react'
import { Settings, Shield, Key, Mail, Lock, Sliders, Globe, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('General')
  
  // Form State
  const [platformName, setPlatformName] = useState('CampusBridge')
  const [tagline, setTagline] = useState('Connecting Mentor. Inspiring Futures.')
  const [email, setEmail] = useState('support@campusbridge.com')
  const [phone, setPhone] = useState('+91-6289258359')
  const [address, setAddress] = useState('Chandigarh University, Mohali, Punjab, India')

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
