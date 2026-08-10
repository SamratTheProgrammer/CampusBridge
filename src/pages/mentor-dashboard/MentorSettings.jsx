import React, { useState, useRef, useEffect } from 'react'
import { Bell, Lock, User, Save, Globe, Shield, CreditCard, Loader2, AtSign, Check, AlertCircle, Laptop, Smartphone, MapPin, Trash2 } from 'lucide-react'
import { useUser, useSessionList, useSession } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import ImageCropModal from '../../components/ImageCropModal'
import ConfirmModal from '../../components/modals/ConfirmModal'
import { useCurrentDevice } from '../../hooks/useCurrentDevice'

import { calculateProfileCompleteness } from '../../utils/profileCompleteness'

const MentorSettings = () => {
  const { user, isLoaded } = useUser()
  const { sessions } = useSessionList()
  const { session: currentSession } = useSession()
  const currentDeviceInfo = useCurrentDevice()
  const [activeTab, setActiveTab] = useState('profile')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [profileVisibility, setProfileVisibility] = useState('public')
  const [userDoc, setUserDoc] = useState(null)
  const [completeness, setCompleteness] = useState({ percentage: 0, missingFields: [] })
  
  // Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [headline, setHeadline] = useState('')
  const [aboutMe, setAboutMe] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [yearsOfExperience, setYearsOfExperience] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [usernameValue, setUsernameValue] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const fileInputRef = useRef(null)
  
  // Image crop state
  const [cropModalData, setCropModalData] = useState(null)

  const fetchProfile = async () => {
    if (!user) return
    try {
      const res = await fetch(`/api/users/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setUserDoc(data);
        setUsernameValue(data.username || '');
        setFirstName(data.firstName || user.firstName || '');
        setLastName(data.lastName || user.lastName || '');
        setHeadline(data.headline || '');
        setAboutMe(data.aboutMe || '');
        setPhone(data.phone || user.unsafeMetadata?.phone || '');
        setAddress(data.address || user.unsafeMetadata?.address || '');
        setYearsOfExperience(data.yearsOfExperience || '');
        if (data.profileVisibility) setProfileVisibility(data.profileVisibility);
        
        const comp = calculateProfileCompleteness(data);
        setCompleteness(comp);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user])

  const handleProfilePicSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCropModalData({ src: reader.result, type: 'dp' })
    }
    reader.readAsDataURL(file)
    e.target.value = '' // reset input
  }

  const uploadProfilePic = async (file) => {
    try {
      toast.loading('Updating profile picture...', { id: 'pic-upload' })
      await user.setProfileImage({ file })
      await user.reload()
      
      // Explicitly sync the new image URL to our backend to ensure it reflects everywhere
      // even if Clerk webhooks are delayed or not running in local dev.
      await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: user.imageUrl })
      })

      toast.success('Profile picture updated!', { id: 'pic-upload' })
    } catch (err) {
      toast.error('Failed to update profile picture', { id: 'pic-upload' })
      console.error(err)
    } finally {
      setCropModalData(null)
    }
  }

  const handleCropComplete = (croppedFile) => {
    if (cropModalData?.type === 'dp') {
      uploadProfilePic(croppedFile)
    }
  }

  const handleRemoveImage = async () => {
    try {
      // Clerk doesn't have a direct remove image method, but we can set it to null or use a default
      toast.error('Direct removal is currently not supported. Please upload a new image.')
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    try {
      toast.loading("Deleting account and all profile data...", { id: "delete-acc" });
      await fetch(`/api/users/${user.id}`, { method: 'DELETE' });
      await user.delete();
      toast.success("Account deleted successfully", { id: "delete-acc" });
    } catch(e) {
      console.error('Error deleting account:', e);
      toast.error("Failed to delete account", { id: "delete-acc" });
    } finally {
      setIsConfirmOpen(false);
    }
  }

  const validateUsername = (value) => {
    if (!value) return ''
    if (value.length < 3) return 'Username must be at least 3 characters'
    if (value.length > 30) return 'Username must be 30 characters or less'
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(value) && value.length > 1) return 'Only lowercase letters, numbers, and hyphens allowed'
    if (/--/.test(value)) return 'No consecutive hyphens allowed'
    return ''
  }

  const handleUsernameChange = (value) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setUsernameValue(cleaned)
    setUsernameError(validateUsername(cleaned))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    try {
      // Save username separately (has its own uniqueness check)
      if (usernameValue) {
        const usernameRes = await fetch(`/api/users/${user.id}/username`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameValue })
        });
        if (!usernameRes.ok) {
          const data = await usernameRes.json();
          if (data.message?.includes('taken')) {
            setUsernameError('This username is already taken');
            toast.error('Username is already taken');
            setIsSaving(false);
            return;
          }
        }
      }

      await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          headline,
          aboutMe,
          address,
          phone,
          yearsOfExperience
        })
      });

      await user.update({
        firstName,
        lastName,
        unsafeMetadata: {
          ...user.unsafeMetadata,
          headline,
          address,
          phone
        }
      })

      const checkRes = await fetch(`/api/users/${user.id}`);
      if (checkRes.ok) {
        const updatedData = await checkRes.json();
        setUserDoc(updatedData);
        const comp = calculateProfileCompleteness(updatedData);
        setCompleteness(comp);

        if (comp.percentage >= 80) {
          if (updatedData.verificationStatus !== 'Approved') {
            await fetch(`/api/users/${user.id}/profile`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ verificationStatus: 'Pending' })
            });
            toast.success(`🎉 Profile updated (${comp.percentage}% complete)! Verification application submitted to Admin.`);
          } else {
            toast.success(`Profile updated (${comp.percentage}% complete)!`);
          }
        } else {
          toast.success(`Profile updated (${comp.percentage}% complete). Reach 80% to unlock full features.`);
        }
      }
    } catch (err) {
      toast.error('Failed to save changes')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    try {
      await user.updatePassword({ currentPassword, newPassword })
      toast.success('Password updated securely!')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      console.error(err)
      toast.error(err.errors?.[0]?.longMessage || 'Failed to update password')
    } finally {
      setIsSaving(false)
    }
  }

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

  const [chatNotifs, setChatNotifs] = useState(localStorage.getItem('campusbridge_chat_notifs') !== 'false')
  
  const handleChatNotifsToggle = (val) => {
    setChatNotifs(val)
    localStorage.setItem('campusbridge_chat_notifs', val.toString())
    toast.success(val ? 'Chat notifications enabled' : 'Chat notifications disabled')
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile credentials and account configurations.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none bg-card border border-border/50 rounded-2xl p-2 sm:p-3 shadow-sm md:bg-transparent md:border-0 md:p-0 md:shadow-none">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === 'profile' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <User className="w-4 h-4 shrink-0" /> Account Profile
          </button>
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === 'notifications' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Bell className="w-4 h-4 shrink-0" /> Notifications
          </button>
          <button 
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === 'privacy' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <Lock className="w-4 h-4 shrink-0" /> Privacy & Security
          </button>
          <button 
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${activeTab === 'billing' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted'}`}
          >
            <CreditCard className="w-4 h-4 shrink-0" /> Payments
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-card border border-border/50 rounded-2xl p-4 sm:p-8 shadow-sm">
          
          {activeTab === 'profile' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Account Profile</h2>
                <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                  completeness.percentage >= 80 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                  {completeness.percentage}% Complete (Min: 80%)
                </span>
              </div>

              {/* Progress gauge banner inside settings */}
              <div className="bg-muted/30 border border-border/40 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Profile Completeness Score</span>
                  <span className={completeness.percentage >= 80 ? 'text-emerald-500' : 'text-amber-500'}>{completeness.percentage}%</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${completeness.percentage >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${completeness.percentage}%` }}
                  />
                </div>
                {completeness.missingFields.length > 0 && (
                  <p className="text-[11px] text-muted-foreground pt-1">
                    <strong className="text-foreground">Missing items:</strong> {completeness.missingFields.join(', ')}
                  </p>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-6 border-b border-border/40 text-center sm:text-left">
                <img 
                  src={user?.imageUrl || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover border-2 border-border"
                />
                <div className="space-y-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleProfilePicSelect} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                    >
                      Upload New Photo
                    </button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">First Name</label>
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Last Name</label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    disabled 
                    value={user?.primaryEmailAddress?.emailAddress || ''} 
                    className="w-full px-3 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-not-allowed" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Headline / Professional Title (+15%)</label>
                  <input 
                    type="text" 
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Senior Software Engineer at Amazon | Cloud Specialist" 
                    className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">About Me / Professional Bio (+15%)</label>
                  <textarea 
                    rows="3"
                    value={aboutMe}
                    onChange={(e) => setAboutMe(e.target.value)}
                    placeholder="Describe your background, expertise, and what you offer to students as a mentor..."
                    className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Address / Location</label>
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Kolkata, West Bengal"
                      className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Years of Experience</label>
                    <input 
                      type="text" 
                      value={yearsOfExperience}
                      onChange={(e) => setYearsOfExperience(e.target.value)}
                      placeholder="e.g. 5+ years" 
                      className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button type="submit" disabled={isSaving} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-sm disabled:opacity-70">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-foreground mb-6">Notification Preferences</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border/30">
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Chat Pop-up Notifications & Sounds</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">Receive sound alerts and pop-up notifications for new messages.</p>
                  </div>
                  <button 
                    onClick={() => handleChatNotifsToggle(!chatNotifs)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${chatNotifs ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${chatNotifs ? 'translate-x-2' : '-translate-x-2'}`} />
                  </button>
                </div>
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
                    <select 
                      value={profileVisibility}
                      onChange={(e) => {
                        setProfileVisibility(e.target.value);
                        fetch(`/api/users/${user.id}/profile`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ profileVisibility: e.target.value })
                        }).then(() => toast.success('Visibility updated'));
                      }}
                      className="bg-background border border-border/50 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-xs"
                    >
                      <option value="public">Public (Everyone)</option>
                      <option value="restricted">Verified Students Only</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-muted/30 border border-border/40 rounded-xl">
                  <Shield className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Change Password</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">Update your account password securely.</p>
                    <form onSubmit={handleUpdatePassword} className="space-y-3 max-w-sm">
                      <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required placeholder="Current Password" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="New Password" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                      <button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="flex gap-4 p-4 bg-muted/30 border border-border/40 rounded-xl">
                  <Laptop className="w-5 h-5 text-primary shrink-0" />
                  <div className="w-full">
                    <h4 className="font-semibold text-sm text-foreground">Active Devices</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">Devices that are currently logged into your account.</p>
                    <div className="space-y-3">
                      {sessions?.map(session => (
                        <div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 bg-background border border-border/50 rounded-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            {session.latestActivity?.isMobile ? <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" /> : <Laptop className="w-4 h-4 text-muted-foreground shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground flex items-center flex-wrap gap-1.5 sm:gap-2">
                                <span className="truncate">{session.id === currentSession?.id 
                                  ? `${currentDeviceInfo.browser} on ${currentDeviceInfo.os}`
                                  : `${session.latestActivity?.browserName || 'Unknown Browser'} on ${session.latestActivity?.deviceType || 'Unknown Device'}`
                                }</span>
                                {session.id === currentSession?.id && <span className="bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0">This Device</span>}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{session.id === currentSession?.id 
                                  ? `${currentDeviceInfo.city}, ${currentDeviceInfo.country} • ${currentDeviceInfo.ip}`
                                  : `${session.latestActivity?.city ? `${session.latestActivity.city}, ` : ''}${session.latestActivity?.country || 'Unknown Location'} • ${session.latestActivity?.ipAddress || 'IP Hidden'}`
                                }</span>
                              </p>
                            </div>
                          </div>
                          {session.id !== currentSession?.id && (
                            <button onClick={async () => {
                              try {
                                await session.revoke();
                                toast.success("Session revoked successfully");
                              } catch(e) {
                                toast.error("Failed to revoke session");
                              }
                            }} className="text-xs font-medium text-destructive hover:underline px-2 py-1">Revoke</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Delete Account */}
                <div className="flex gap-4 p-4 border border-destructive/30 bg-destructive/5 rounded-xl mt-8">
                  <Trash2 className="w-5 h-5 text-destructive shrink-0" />
                  <div className="w-full">
                    <h4 className="font-semibold text-sm text-destructive">Delete Account</h4>
                    <p className="text-xs text-destructive/80 mt-1 mb-3">Permanently remove your account and all associated data. This action cannot be undone.</p>
                    <button 
                      onClick={() => setIsConfirmOpen(true)}
                      className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground text-sm font-semibold rounded-lg transition-colors"
                    >
                      Delete Account
                    </button>
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

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you absolutely sure you want to delete your mentor account? This action cannot be undone."
      />

      {/* Render Image Crop Modal if active */}
      <AnimatePresence>
        {cropModalData && (
          <ImageCropModal 
            imageSrc={cropModalData.src}
            aspectRatio={1}
            onCropComplete={handleCropComplete}
            onCancel={() => setCropModalData(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default MentorSettings

