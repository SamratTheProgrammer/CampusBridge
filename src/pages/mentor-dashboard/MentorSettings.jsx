import React, { useState } from 'react'
import { Bell, Lock, User, Save, Globe, Shield, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

const MentorSettings = () => {
  const [activeTab, setActiveTab] = useState('profile')
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    requests: true,
    messages: true,
    marketing: false
  })

  const handleSave = (e) => {
    e.preventDefault()
    toast.success('Settings saved successfully!')
  }

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account preferences and configurations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 space-y-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'profile' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <User className="w-4 h-4" /> Account Profile
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'notifications' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab('privacy')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'privacy' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Lock className="w-4 h-4" /> Privacy & Security
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'billing' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <CreditCard className="w-4 h-4" /> Payments
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-sm">
          
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-foreground mb-6">Account Profile</h2>
              
              <div className="flex items-center gap-6 pb-6 border-b border-border/40">
                <img 
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80" 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
                <div className="space-y-2">
                  <button className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                    Upload New Photo
                  </button>
                  <button className="bg-background border border-border/50 text-foreground px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors ml-3">
                    Remove
                  </button>
                </div>
              </div>

              <form onSubmit={handleSave} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">First Name</label>
                    <input type="text" defaultValue="Rohit" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Last Name</label>
                    <input type="text" defaultValue="Sharma" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                  <input type="email" defaultValue="rohit.sde@amazon.com" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Title / Designation</label>
                  <input type="text" defaultValue="Senior Software Engineer at Amazon" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>

                <div className="pt-4 flex justify-end">
                  <button type="submit" className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-sm">
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-foreground mb-6">Notification Preferences</h2>
              
              <div className="space-y-4">
                {[
                  { id: 'email', label: 'Email Notifications', desc: 'Receive daily digests and important updates via email.' },
                  { id: 'push', label: 'Push Notifications', desc: 'Get notified in your browser when someone messages you.' },
                  { id: 'requests', label: 'Mentorship Requests', desc: 'Get alerted immediately when a student requests mentorship.' },
                  { id: 'messages', label: 'Direct Messages', desc: 'Notify me when I receive a direct message.' },
                  { id: 'marketing', label: 'Marketing & Promos', desc: 'Receive offers and platform updates.' },
                ].map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{item.label}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                    <button 
                      onClick={() => toggleNotification(item.id)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${notifications[item.id] ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${notifications[item.id] ? 'translate-x-2' : '-translate-x-2'}`} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-6 flex justify-end">
                <button onClick={handleSave} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-sm">
                  <Save className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-foreground mb-6">Privacy & Security</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4 p-4 bg-muted/30 border border-border/40 rounded-xl">
                  <Globe className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Profile Visibility</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">Control who can see your mentor profile on the platform.</p>
                    <select className="bg-background border border-border/50 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-xs">
                      <option>Public (Everyone)</option>
                      <option>Verified Students Only</option>
                      <option>Hidden</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-muted/30 border border-border/40 rounded-xl">
                  <Shield className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Change Password</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">Update your account password securely.</p>
                    <div className="space-y-3 max-w-sm">
                      <input type="password" placeholder="Current Password" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                      <input type="password" placeholder="New Password" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                      <button onClick={handleSave} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-foreground mb-6">Payments & Payouts</h2>
              
              <div className="bg-muted/30 border border-border/40 rounded-xl p-6 text-center">
                <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground">No Payout Methods Linked</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">Link a bank account or UPI ID to receive payments for paid 1:1 sessions.</p>
                <button className="bg-foreground text-background px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-foreground/90 transition-all shadow-sm">
                  Add Bank Account
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  )
}

export default MentorSettings

