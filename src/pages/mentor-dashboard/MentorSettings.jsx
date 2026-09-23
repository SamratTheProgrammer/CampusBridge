import React, { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Bell, Lock, User, Save, Globe, Shield, CreditCard, Loader2, AtSign, Check, 
  AlertCircle, Laptop, Smartphone, MapPin, Trash2, Plus, Briefcase, GraduationCap, 
  FileText, ExternalLink, Sparkles, X, UploadCloud, Award, Edit2, Sun, Moon, MonitorSmartphone, Palette,
  CheckCircle2, Link as LinkIcon, HelpCircle, Mail, MessageSquare, Headphones
} from 'lucide-react'
import { useUser, useSessionList, useSession } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import { AnimatePresence } from 'framer-motion'
import ImageCropModal from '../../components/ImageCropModal'
import ConfirmModal from '../../components/modals/ConfirmModal'
import DeleteAccountModal from '../../components/modals/DeleteAccountModal'
import { useCurrentDevice } from '../../hooks/useCurrentDevice'
import MentorOnboardingBanner from '../../components/mentor/MentorOnboardingBanner'
import { socket } from '../../services/socket'

import { calculateProfileCompleteness } from '../../utils/profileCompleteness'
import API_BASE from '../../utils/api'
import { useTheme } from '../../components/ThemeProvider'
import { useProfileData } from '../../context/ProfileDataContext'

const MentorSettings = () => {
  const { user, isLoaded } = useUser()
  const { sessions } = useSessionList()
  const { session: currentSession } = useSession()
  const currentDeviceInfo = useCurrentDevice()
  const { theme, setTheme, globalTheme } = useTheme()
  const { mongoProfile, isMongoProfileLoading, refetchMongoProfile } = useProfileData()
  const [activeTab, setActiveTab] = useState('profile')
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [showPhotoUrlPrompt, setShowPhotoUrlPrompt] = useState(false)
  const [photoUrlInput, setPhotoUrlInput] = useState('')
  const [profileVisibility, setProfileVisibility] = useState('public')
  const [userDoc, setUserDoc] = useState(null)
  const [completeness, setCompleteness] = useState({ percentage: 0, missingFields: [] })
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  
  // Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [headline, setHeadline] = useState('')
  const [aboutMe, setAboutMe] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [yearsOfExperience, setYearsOfExperience] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [ageVisibility, setAgeVisibility] = useState('private')
  const [gender, setGender] = useState('Prefer not to say')
  
  // Work Experience, Education, Skills, Resume State
  const [experienceList, setExperienceList] = useState([])
  const [educationList, setEducationList] = useState([])
  const [skillsList, setSkillsList] = useState([])
  const [resumeUrl, setResumeUrl] = useState('')
  const [isUploadingResume, setIsUploadingResume] = useState(false)

  // Temp Inline Add Item Forms
  const [showAddExp, setShowAddExp] = useState(false)
  const [newExpTitle, setNewExpTitle] = useState('')
  const [newExpCompany, setNewExpCompany] = useState('')
  const [newExpDuration, setNewExpDuration] = useState('')
  const [newExpDesc, setNewExpDesc] = useState('')

  const [showAddEdu, setShowAddEdu] = useState(false)
  const [newEduDegree, setNewEduDegree] = useState('')
  const [newEduInst, setNewEduInst] = useState('')
  const [newEduDuration, setNewEduDuration] = useState('')
  const [newEduGrade, setNewEduGrade] = useState('')

  const [newSkillInput, setNewSkillInput] = useState('')
  const [editExpIndex, setEditExpIndex] = useState(null)
  const [editEduIndex, setEditEduIndex] = useState(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [usernameValue, setUsernameValue] = useState('')
  const [usernameError, setUsernameError] = useState('')

  const [chatNotifs, setChatNotifs] = useState(localStorage.getItem('campusbridge_chat_notifs') !== 'false')
  const [notificationSound, setNotificationSound] = useState(localStorage.getItem('campusbridge_notification_sound') !== 'false')
  
  const handleChatNotifsToggle = (val) => {
    setChatNotifs(val)
    localStorage.setItem('campusbridge_chat_notifs', val.toString())
    toast.success(val ? 'Chat notifications enabled' : 'Chat notifications disabled')
  }

  const handleNotificationSoundToggle = (val) => {
    setNotificationSound(val)
    localStorage.setItem('campusbridge_notification_sound', val.toString())
    toast.success(val ? 'Notification sound enabled' : 'Notification sound disabled')
  }
  
  const fileInputRef = useRef(null)
  const resumeInputRef = useRef(null)
  const formScrollRef = useRef(null)
  const contentGridRef = useRef(null)

  // Two-stage coordinated scroll: window scrolls down until tabs/form reach navbar (Picture 3 position),
  // then sticks firmly while only the right form container scrolls smoothly.
  useEffect(() => {
    const handleWheel = (e) => {
      if (window.innerWidth < 768) return; // Natural scroll on mobile devices
      const contentGrid = contentGridRef.current;
      const formContainer = formScrollRef.current;
      if (!contentGrid || !formContainer) return;

      const targetTop = 88; // 64px header + 24px gap

      const rect = contentGrid.getBoundingClientRect();

      if (e.deltaY > 0) {
        // SCROLLING DOWN
        if (rect.top > targetTop + 1) {
          // Stage 1: Window has not yet reached the stuck position
          e.preventDefault();
          const neededScroll = rect.top - targetTop;
          if (e.deltaY <= neededScroll) {
            window.scrollBy({ top: e.deltaY, behavior: 'instant' });
          } else {
            window.scrollBy({ top: neededScroll, behavior: 'instant' });
            formContainer.scrollTop += (e.deltaY - neededScroll);
          }
        } else {
          // Stage 2: Locked at the top!
          // Window remains rock-solid stationary, only the right form column scrolls
          e.preventDefault();
          formContainer.scrollTop += e.deltaY;
        }
      } else if (e.deltaY < 0) {
        // SCROLLING UP
        if (formContainer.scrollTop > 0) {
          // Form is scrolled down, so scroll form back UP
          e.preventDefault();
          const canScrollUp = formContainer.scrollTop;
          if (-e.deltaY <= canScrollUp) {
            formContainer.scrollTop += e.deltaY;
          } else {
            formContainer.scrollTop = 0;
            const leftover = e.deltaY + canScrollUp; // negative delta
            window.scrollBy({ top: leftover, behavior: 'instant' });
          }
        } else if (window.scrollY > 0) {
          // Form is at top (0), scroll window back UP to reveal Header & Onboarding Banner
          e.preventDefault();
          window.scrollBy({ top: e.deltaY, behavior: 'instant' });
        }
      }
    };

    const handleKeyDown = (e) => {
      if (window.innerWidth < 768) return;
      const contentGrid = contentGridRef.current;
      const formContainer = formScrollRef.current;
      if (!contentGrid || !formContainer) return;

      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        return;
      }

      const targetTop = 88; // 64px header + 24px gap
      const rect = contentGrid.getBoundingClientRect();

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        if (rect.top <= targetTop + 2) {
          e.preventDefault();
          formContainer.scrollTop += (e.key === 'ArrowDown' ? 80 : 300);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (formContainer.scrollTop > 0) {
          e.preventDefault();
          formContainer.scrollTop -= (e.key === 'ArrowUp' ? 80 : 300);
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
  
  // Image crop state
  const [cropModalData, setCropModalData] = useState(null)

  useEffect(() => {
    if (!user || isMongoProfileLoading) return;

    if (!hasInitialized) {
      if (mongoProfile) {
        setUserDoc(mongoProfile);
        const emailPrefix = user.primaryEmailAddress?.emailAddress?.split('@')[0] || user.emailAddresses?.[0]?.emailAddress?.split('@')[0];
        const defaultUsername = (user.username || emailPrefix || user.firstName || '').toLowerCase().replace(/[^a-z0-9-_]/g, '');
        setUsernameValue(mongoProfile.username || defaultUsername);
        setFirstName(mongoProfile.firstName || user.firstName || '');
        setLastName(mongoProfile.lastName || user.lastName || '');
        setHeadline(mongoProfile.headline || '');
        setAboutMe(mongoProfile.aboutMe || '');
        setPhone(mongoProfile.phone || user.unsafeMetadata?.phone || '');
        setAddress(mongoProfile.address || user.unsafeMetadata?.address || '');
        setYearsOfExperience(mongoProfile.yearsOfExperience !== undefined && mongoProfile.yearsOfExperience !== null ? String(mongoProfile.yearsOfExperience).replace(/[^0-9]/g, '') : '');
        setExperienceList(Array.isArray(mongoProfile.experience) ? mongoProfile.experience : []);
        setEducationList(Array.isArray(mongoProfile.education) ? mongoProfile.education : []);
        setSkillsList(Array.isArray(mongoProfile.skills) ? mongoProfile.skills : []);
        setResumeUrl(mongoProfile.resumeUrl || '');
        setDateOfBirth(mongoProfile.dateOfBirth || '');
        if (mongoProfile.ageVisibility) setAgeVisibility(mongoProfile.ageVisibility);
        if (mongoProfile.gender) setGender(mongoProfile.gender);
        if (mongoProfile.profileVisibility) setProfileVisibility(mongoProfile.profileVisibility);
        
        const comp = calculateProfileCompleteness(mongoProfile);
        setCompleteness(comp);
      } else {
        const emailPrefix = user.primaryEmailAddress?.emailAddress?.split('@')[0] || user.emailAddresses?.[0]?.emailAddress?.split('@')[0];
        const defaultUsername = (user.username || emailPrefix || user.firstName || '').toLowerCase().replace(/[^a-z0-9-_]/g, '');
        setUsernameValue(defaultUsername);
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setPhone(user.unsafeMetadata?.phone || '');
        setAddress(user.unsafeMetadata?.address || '');
      }
      setHasInitialized(true);
    }
  }, [user, hasInitialized, mongoProfile, isMongoProfileLoading])

  const handleProfilePicSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setCropModalData({ src: reader.result, type: 'dp' })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const uploadProfilePic = async (file) => {
    try {
      toast.loading('Updating profile picture...', { id: 'pic-upload' })
      await user.setProfileImage({ file })
      await user.reload()
      
      await fetch(`${API_BASE}/api/users/${user.id}/profile`, {
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

  const handleUpdateProfilePicUrl = async (url) => {
    if (!url || !url.trim()) return
    try {
      toast.loading('Updating profile picture...', { id: 'pic-upload' })
      const res = await fetch(`${API_BASE}/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url.trim() })
      })
      if (res.ok) {
        toast.success('Profile picture updated!', { id: 'pic-upload' })
        setShowPhotoUrlPrompt(false)
        setPhotoUrlInput('')
        refetchMongoProfile?.()
      } else {
        throw new Error('Failed to update')
      }
    } catch (err) {
      toast.error('Failed to update profile picture', { id: 'pic-upload' })
    }
  }

  const validateUsername = (value) => {
    if (!value) return ''
    if (value.length < 3) return 'Username must be at least 3 characters'
    if (value.length > 30) return 'Username must be 30 characters or less'
    if (!/^[a-z0-9][a-z0-9-_]*[a-z0-9]$/.test(value) && value.length > 1) return 'Only lowercase letters, numbers, hyphens, and underscores allowed'
    if (/--|__/.test(value)) return 'No consecutive special characters allowed'
    return ''
  }

  const handleUsernameChange = (value) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-_]/g, '')
    setUsernameValue(cleaned)
    setUsernameError(validateUsername(cleaned))
  }

  // Resume Upload Handler
  const handleResumeSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploadingResume(true)
    toast.loading('Uploading resume document...', { id: 'resume-up' })

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/api/upload/resume`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (res.ok && data.success && data.url) {
        setResumeUrl(data.url)
        toast.success('Resume uploaded successfully!', { id: 'resume-up' })
      } else {
        toast.error(data.message || 'Failed to upload resume', { id: 'resume-up' })
      }
    } catch (err) {
      console.error('Error uploading resume:', err)
      toast.error('Failed to upload resume', { id: 'resume-up' })
    } finally {
      setIsUploadingResume(false)
      e.target.value = ''
    }
  }

  // Experience Handlers
  const handleAddExperienceItem = (e) => {
    e.preventDefault()
    if (!newExpTitle || !newExpCompany) {
      toast.error('Job Title and Company Name are required.')
      return
    }
    const item = {
      title: newExpTitle,
      company: newExpCompany,
      duration: newExpDuration || 'Present',
      description: newExpDesc
    }
    if (editExpIndex !== null) {
      const updated = [...experienceList]
      updated[editExpIndex] = item
      setExperienceList(updated)
      setEditExpIndex(null)
      toast.success('Work Experience updated!')
    } else {
      setExperienceList([...experienceList, item])
      toast.success('Work Experience added!')
    }
    setNewExpTitle('')
    setNewExpCompany('')
    setNewExpDuration('')
    setNewExpDesc('')
    setShowAddExp(false)
  }

  const handleRemoveExperience = (index) => {
    setExperienceList(experienceList.filter((_, i) => i !== index))
    toast.success('Work Experience item removed.')
  }

  // Education Handlers
  const handleAddEducationItem = (e) => {
    e.preventDefault()
    if (!newEduDegree || !newEduInst) {
      toast.error('Degree/Field and Institution Name are required.')
      return
    }
    const item = {
      degree: newEduDegree,
      institution: newEduInst,
      duration: newEduDuration || 'Completed',
      grade: newEduGrade
    }
    if (editEduIndex !== null) {
      const updated = [...educationList]
      updated[editEduIndex] = item
      setEducationList(updated)
      setEditEduIndex(null)
      toast.success('Education credential updated!')
    } else {
      setEducationList([...educationList, item])
      toast.success('Education credential added!')
    }
    setNewEduDegree('')
    setNewEduInst('')
    setNewEduDuration('')
    setNewEduGrade('')
    setShowAddEdu(false)
  }

  const handleRemoveEducation = (index) => {
    setEducationList(educationList.filter((_, i) => i !== index))
    toast.success('Education item removed.')
  }

  // Skills Handlers
  const handleAddSkill = (e) => {
    e.preventDefault()
    if (!newSkillInput.trim()) return
    const cleanSkill = newSkillInput.trim()
    if (skillsList.includes(cleanSkill)) {
      toast.error('Skill already added.')
      return
    }
    setSkillsList([...skillsList, cleanSkill])
    setNewSkillInput('')
  }

  const handleRemoveSkill = (skillToRemove) => {
    setSkillsList(skillsList.filter(s => s !== skillToRemove))
  }

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    try {
      toast.loading("Deleting account and all profile data...", { id: "delete-acc" });
      await fetch(`${API_BASE}/api/users/${user.id}`, { method: 'DELETE' });
      await user.delete();
      toast.success("Account deleted successfully", { id: "delete-acc" });
    } catch(e) {
      console.error('Error deleting account:', e);
      toast.error("Failed to delete account", { id: "delete-acc" });
    } finally {
      setIsConfirmOpen(false);
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    try {
      const res = await fetch(`${API_BASE}/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          headline,
          aboutMe,
          address,
          phone,
          yearsOfExperience,
          experience: experienceList,
          education: educationList,
          skills: skillsList,
          resumeUrl,
          dateOfBirth,
          ageVisibility,
          gender,
          profileVisibility
        })
      });

      // Save username separately (has its own uniqueness check)
      if (usernameValue) {
        const usernameRes = await fetch(`${API_BASE}/api/users/${user.id}/username`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameValue })
        });
        if (!usernameRes.ok) {
          const data = await usernameRes.json().catch(() => ({}));
          const errMsg = data.message || 'Failed to update username';
          setUsernameError(errMsg);
          toast.error(errMsg);
          setIsSaving(false);
          return;
        }
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save to MongoDB');
      }

      try {
        await user.update({
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          ...(user.username ? { username: usernameValue || undefined } : {}),
          unsafeMetadata: {
            ...user.unsafeMetadata,
            headline,
            address,
            phone
          }
        });
      } catch (clerkErr) {
        console.warn('Clerk update failed, proceeding with DB update:', clerkErr);
      }

      await refetchMongoProfile();
      const checkRes = await fetch(`${API_BASE}/api/users/${user.id}`);
      if (checkRes.ok) {
        const updatedData = await checkRes.json();
        setUserDoc(updatedData);
        const comp = calculateProfileCompleteness(updatedData);
        setCompleteness(comp);

        if (comp.percentage >= 80) {
          if (updatedData.verificationStatus !== 'Approved') {
            await fetch(`${API_BASE}/api/users/${user.id}/profile`, {
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
        
        socket.emit('update_sidebar');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save changes')
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

  return (
    <div className="w-full min-w-0 max-w-6xl mx-auto space-y-4 sm:space-y-6 pb-12 md:pb-80">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your mentor profile, credentials, experience, resume, and skills.</p>
      </div>

      {/* Onboarding & Verification Completeness Banner */}
      {!isLoadingProfile && (
        <div className="shrink-0">
          <MentorOnboardingBanner 
            completeness={completeness} 
            verificationStatus={userDoc?.verificationStatus || (userDoc?.isVerified ? 'Approved' : 'Pending')} 
          />
        </div>
      )}

      <div ref={contentGridRef} className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start flex-1 min-h-0">
        
        {/* Sidebar Nav */}
        <div className="w-full md:w-64 bg-card/95 backdrop-blur-md border border-border/50 rounded-2xl p-1.5 sm:p-3 shadow-sm shrink-0 flex flex-row md:flex-col gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none sticky top-0 z-30 md:static h-auto md:h-fit min-w-0">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap shrink-0 ${activeTab === 'profile' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <User className="w-4 h-4 shrink-0" /> 
            <span>Account Profile</span>
            {completeness.percentage >= 80 && (
              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto hidden md:block" />
            )}
          </button>

          <button 
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap shrink-0 ${activeTab === 'appearance' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <Palette className="w-4 h-4 shrink-0" /> 
            <span>Appearance</span>
          </button>

          <button 
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap shrink-0 ${activeTab === 'privacy' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <Lock className="w-4 h-4 shrink-0" /> 
            <span>Privacy & Security</span>
          </button>

          <button 
            onClick={() => setActiveTab('help')}
            className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all text-left whitespace-nowrap shrink-0 ${activeTab === 'help' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            <HelpCircle className="w-4 h-4 shrink-0" /> 
            <span>Help & Support</span>
          </button>
        </div>

        {/* Content Area */}
        <div 
          ref={formScrollRef}
          className="flex-1 w-full bg-card border border-border/50 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm md:h-[calc(100vh-112px)] md:overflow-y-auto scrollbar-none min-w-0"
        >
          {activeTab === 'profile' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <h2 className="text-xl font-bold text-foreground">Account Profile</h2>
                <span className="text-xs font-bold px-3 py-1 rounded-full border bg-primary/10 text-primary border-primary/20">
                  {completeness.percentage}% Complete (Min: 80%)
                </span>
              </div>

              {/* Progress gauge banner inside settings */}
              <div className="bg-muted/30 border border-border/40 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-muted-foreground">Profile Completeness Score</span>
                  <span className="text-primary font-bold">{completeness.percentage}%</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-out"
                    style={{ width: `${completeness.percentage}%` }}
                  />
                </div>
                {completeness.missingFields && completeness.missingFields.length > 0 && (
                  <p className="text-[11px] text-muted-foreground pt-1">
                    <strong className="text-foreground">Missing items:</strong> {completeness.missingFields.join(', ')}
                  </p>
                )}
              </div>
              
              {/* Profile Photo */}
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

              {/* Main Settings Form */}
              <form onSubmit={handleSaveProfile} className="space-y-6">
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
                  <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                    <AtSign className="w-4 h-4 text-primary" /> Username
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={usernameValue} 
                      onChange={(e) => handleUsernameChange(e.target.value)} 
                      placeholder="e.g. mentor-john" 
                      className={`w-full px-3 py-2 bg-background border rounded-lg text-sm focus:outline-none focus:ring-1 transition-all ${
                        usernameError 
                          ? 'border-red-500/50 focus:ring-red-500/50' 
                          : 'border-border/50 focus:ring-primary'
                      }`} 
                    />
                    {usernameValue && !usernameError && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                    {usernameError && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                    )}
                  </div>
                  {usernameError ? (
                    <p className="text-xs text-red-500 mt-1">{usernameError}</p>
                  ) : usernameValue ? (
                    <p className="text-xs text-muted-foreground mt-1">campusbridge.com/profile/<span className="text-primary font-medium">{usernameValue}</span></p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Your unique profile URL. Auto-generated on signup.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Headline / Professional Title</label>
                  <input 
                    type="text" 
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Senior Software Engineer at Amazon | Cloud Specialist" 
                    className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">About Me / Professional Bio</label>
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
                    <div className="relative flex items-center">
                      <input 
                        type="number" 
                        min="0"
                        max="70"
                        value={yearsOfExperience}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setYearsOfExperience(val);
                        }}
                        placeholder="e.g. 5" 
                        className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary pr-28 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      />
                      {yearsOfExperience !== '' && (
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                          <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold px-2 py-0.5 rounded-md">
                            {Number(yearsOfExperience) === 1 ? '1 Year' : `${yearsOfExperience} Years`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Date of Birth</label>
                    <input 
                      type="date" 
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Age Visibility</label>
                    <select 
                      value={ageVisibility}
                      onChange={(e) => setAgeVisibility(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private (Hidden)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Gender</label>
                    <select 
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                </div>

                <div className="mt-2 p-4 bg-muted/30 border border-border/50 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Chat Pop-up Notifications & Sounds</h4>
                    <p className="text-xs text-muted-foreground mt-1">Receive sound alerts and pop-up notifications for new messages.</p>
                  </div>
                  <button 
                    onClick={() => handleChatNotifsToggle(!chatNotifs)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${chatNotifs ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${chatNotifs ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="mt-2 p-4 bg-muted/30 border border-border/50 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">General Notification Sound</h4>
                    <p className="text-xs text-muted-foreground mt-1">Play sound for system notifications.</p>
                  </div>
                  <button 
                    onClick={() => handleNotificationSoundToggle(!notificationSound)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationSound ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSound ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* 1. WORK EXPERIENCE SECTION (+20%) */}
                <div className="pt-6 border-t border-border/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-primary" /> Work Experience (+20%)
                      </h3>
                      <p className="text-xs text-muted-foreground">Add your past or current job roles to build credibility.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowAddExp(!showAddExp)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Experience
                    </button>
                  </div>

                  {/* Existing Experience Items List */}
                  <div className="space-y-2">
                    {experienceList.length > 0 ? (
                      experienceList.map((exp, idx) => (
                        <div key={idx} className="bg-muted/30 border border-border/50 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                              {exp.title} <span className="text-xs font-medium text-primary">({exp.duration})</span>
                            </h4>
                            <p className="text-muted-foreground font-semibold">{exp.company}</p>
                            {exp.description && <p className="text-muted-foreground text-[11px] leading-relaxed pt-1">{exp.description}</p>}
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button 
                              type="button"
                              onClick={() => {
                                setNewExpTitle(exp.title);
                                setNewExpCompany(exp.company);
                                setNewExpDuration(exp.duration);
                                setNewExpDesc(exp.description);
                                setEditExpIndex(idx);
                                setShowAddExp(true);
                              }}
                              className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Edit Experience"
                            >
                              <span className="text-xs font-semibold">Edit</span>
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleRemoveExperience(idx)}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Remove Experience"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center border border-dashed border-border/60 rounded-xl text-xs text-muted-foreground">
                        No work experience added yet. Click "+ Add Experience" above to add your work details.
                      </div>
                    )}
                  </div>

                  {/* Add Experience Form Box */}
                  {showAddExp && (
                    <div className="bg-muted/50 border border-primary/20 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                      <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">New Work Experience</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="Job Title (e.g. Senior Software Engineer)" 
                          value={newExpTitle}
                          onChange={(e) => setNewExpTitle(e.target.value)}
                          className="px-3 py-2 bg-background border border-border/50 rounded-lg text-xs"
                        />
                        <input 
                          type="text" 
                          placeholder="Company Name (e.g. Amazon / Google)" 
                          value={newExpCompany}
                          onChange={(e) => setNewExpCompany(e.target.value)}
                          className="px-3 py-2 bg-background border border-border/50 rounded-lg text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="Duration (e.g. 2021 - Present / 2 yrs)" 
                          value={newExpDuration}
                          onChange={(e) => setNewExpDuration(e.target.value)}
                          className="px-3 py-2 bg-background border border-border/50 rounded-lg text-xs"
                        />
                        <input 
                          type="text" 
                          placeholder="Short Role Description (optional)" 
                          value={newExpDesc}
                          onChange={(e) => setNewExpDesc(e.target.value)}
                          className="px-3 py-2 bg-background border border-border/50 rounded-lg text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button 
                          type="button" 
                          onClick={() => {
                            setShowAddExp(false)
                            setEditExpIndex(null)
                            setNewExpTitle('')
                            setNewExpCompany('')
                            setNewExpDuration('')
                            setNewExpDesc('')
                          }} 
                          className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          onClick={handleAddExperienceItem} 
                          className="px-4 py-1.5 text-xs bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90"
                        >
                          {editExpIndex !== null ? 'Update Item' : 'Save Item'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. EDUCATION CREDENTIALS SECTION (+20%) */}
                <div className="pt-6 border-t border-border/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" /> Education Credentials (+20%)
                      </h3>
                      <p className="text-xs text-muted-foreground">Add your university degrees or certifications.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowAddEdu(!showAddEdu)}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Education
                    </button>
                  </div>

                  {/* Existing Education Items List */}
                  <div className="space-y-2">
                    {educationList.length > 0 ? (
                      educationList.map((edu, idx) => (
                        <div key={idx} className="bg-muted/30 border border-border/50 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                              {edu.degree} <span className="text-xs font-medium text-primary">({edu.duration})</span>
                            </h4>
                            <p className="text-muted-foreground font-semibold">{edu.institution}</p>
                            {edu.grade && <p className="text-muted-foreground text-[11px]">Grade / Score: {edu.grade}</p>}
                          </div>
                          <div className="flex flex-col gap-2 shrink-0">
                            <button 
                              type="button"
                              onClick={() => {
                                setNewEduDegree(edu.degree);
                                setNewEduInst(edu.institution);
                                setNewEduDuration(edu.duration);
                                setNewEduGrade(edu.grade || '');
                                setEditEduIndex(idx);
                                setShowAddEdu(true);
                              }}
                              className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                              title="Edit Education"
                            >
                              <span className="text-xs font-semibold">Edit</span>
                            </button>
                            <button 
                              type="button"
                              onClick={() => handleRemoveEducation(idx)}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title="Remove Education"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center border border-dashed border-border/60 rounded-xl text-xs text-muted-foreground">
                        No education records added yet. Click "+ Add Education" above to add details.
                      </div>
                    )}
                  </div>

                  {/* Add Education Form Box */}
                  {showAddEdu && (
                    <div className="bg-muted/50 border border-primary/20 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                      <h4 className="font-bold text-xs text-foreground uppercase tracking-wider">New Education Credential</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="Degree / Specialization (e.g. B.Tech CS)" 
                          value={newEduDegree}
                          onChange={(e) => setNewEduDegree(e.target.value)}
                          className="px-3 py-2 bg-background border border-border/50 rounded-lg text-xs"
                        />
                        <input 
                          type="text" 
                          placeholder="Institution / University (e.g. NIT Trichy)" 
                          value={newEduInst}
                          onChange={(e) => setNewEduInst(e.target.value)}
                          className="px-3 py-2 bg-background border border-border/50 rounded-lg text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          placeholder="Graduation Year / Duration (e.g. 2018 - 2022)" 
                          value={newEduDuration}
                          onChange={(e) => setNewEduDuration(e.target.value)}
                          className="px-3 py-2 bg-background border border-border/50 rounded-lg text-xs"
                        />
                        <input 
                          type="text" 
                          placeholder="Grade / CGPA (e.g. 8.8 CGPA)" 
                          value={newEduGrade}
                          onChange={(e) => setNewEduGrade(e.target.value)}
                          className="px-3 py-2 bg-background border border-border/50 rounded-lg text-xs"
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button 
                          type="button" 
                          onClick={() => {
                            setShowAddEdu(false)
                            setEditEduIndex(null)
                            setNewEduDegree('')
                            setNewEduInst('')
                            setNewEduDuration('')
                            setNewEduGrade('')
                          }} 
                          className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold"
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          onClick={handleAddEducationItem} 
                          className="px-4 py-1.5 text-xs bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90"
                        >
                          {editEduIndex !== null ? 'Update Item' : 'Save Item'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. EXPERTISE & SKILLS SECTION (+15%) */}
                <div className="pt-6 border-t border-border/40 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" /> Expertise & Skills (+15%)
                    </h3>
                    <p className="text-xs text-muted-foreground">Add key technical skills or mentorship domains.</p>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add a skill (e.g. React, System Design, Data Structures)..." 
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      className="flex-1 px-3 py-2 bg-background border border-border/50 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddSkill} 
                      className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer"
                    >
                      + Add Skill
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {skillsList.map((skill, idx) => (
                      <span key={idx} className="bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-xl flex items-center gap-1.5">
                        {skill}
                        <button 
                          type="button" 
                          onClick={() => {
                            setNewSkillInput(skill);
                            handleRemoveSkill(skill);
                          }} 
                          className="hover:text-blue-500 ml-1 transition-colors cursor-pointer"
                          title="Edit Skill"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveSkill(skill)} 
                          className="hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 4. RESUME UPLOAD SECTION */}
                <div className="pt-6 border-t border-border/40 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" /> Upload Resume Document
                    </h3>
                    <p className="text-xs text-muted-foreground">Upload your latest PDF resume to attach to your mentor profile.</p>
                  </div>

                  <input 
                    type="file" 
                    ref={resumeInputRef}
                    onChange={handleResumeSelect}
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                  />

                  {resumeUrl ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3 flex-1 min-w-0 w-full sm:w-auto">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-foreground text-sm block truncate">Resume Document Attached</span>
                          <span className="text-[11px] text-muted-foreground block truncate">Ready for verification & student viewing</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto mt-1 sm:mt-0">
                        <a 
                          href={resumeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none px-3 py-1.5 bg-card border border-border/60 hover:bg-muted text-foreground font-bold rounded-xl transition-all flex items-center justify-center gap-1 text-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View PDF
                        </a>
                        <button 
                          type="button" 
                          onClick={() => setResumeUrl('')} 
                          className="flex-1 sm:flex-none px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold rounded-xl transition-all text-xs flex items-center justify-center"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => resumeInputRef.current?.click()}
                      className="border-2 border-dashed border-border/60 hover:border-primary/50 bg-muted/20 hover:bg-muted/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
                    >
                      <UploadCloud className="w-8 h-8 text-primary mx-auto animate-bounce" />
                      <p className="font-bold text-xs text-foreground">Click to Upload Resume (PDF / Word)</p>
                      <p className="text-[11px] text-muted-foreground">Supports .PDF, .DOC, .DOCX up to 10MB</p>
                    </div>
                  )}
                </div>

                {/* Save All Changes Button */}
                <div className="pt-6 border-t border-border/40 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isSaving} 
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/10 disabled:opacity-70 cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                    Save Account Profile
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h2 className="text-xl font-bold text-foreground mb-6">Notification Preferences</h2>
              <p className="text-xs text-muted-foreground">Manage your notification settings.</p>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <h2 className="text-xl font-bold text-foreground border-b border-border/40 pb-4">Theme & Appearance</h2>
                <p className="text-xs text-muted-foreground mt-2">Personalize how CampusBridge looks on this device and view active platform-wide themes.</p>
              </div>

              {/* Personal Workspace Theme */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Sun className="w-4 h-4 text-primary" /> Workspace Mode
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'light',
                      title: 'Light Mode',
                      desc: 'Clean & high clarity for day use',
                      icon: Sun,
                      iconColor: 'text-amber-500',
                      iconBg: 'bg-amber-500/10',
                    },
                    {
                      id: 'dark',
                      title: 'Dark Mode',
                      desc: 'Deep modern aesthetic easy on the eyes',
                      icon: Moon,
                      iconColor: 'text-indigo-400',
                      iconBg: 'bg-indigo-500/10',
                    },
                    {
                      id: 'system',
                      title: 'System Sync',
                      desc: 'Follows your operating system preference',
                      icon: MonitorSmartphone,
                      iconColor: 'text-emerald-500',
                      iconBg: 'bg-emerald-500/10',
                    },
                  ].map((t) => {
                    const Icon = t.icon
                    const isSelected = theme === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id)}
                        className={`text-left p-5 rounded-2xl border-2 transition-all flex flex-col justify-between group ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary/30'
                            : 'border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className={`w-10 h-10 rounded-xl ${t.iconBg} ${t.iconColor} flex items-center justify-center shrink-0`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                              <Check className="w-3 h-3 stroke-[3]" /> Active
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground mb-1">{t.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Global Platform Event Theme Info Banner */}
              <div className="bg-muted/30 border border-border/60 rounded-2xl p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-bold text-foreground">Active Campus Event Theme</h4>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize">
                    {globalTheme && globalTheme !== 'none' && globalTheme !== 'system' ? globalTheme : 'Default Platform Theme'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {globalTheme && globalTheme !== 'none' && globalTheme !== 'system'
                    ? `Campus administrators have currently activated the ${globalTheme.toUpperCase()} festive celebration theme across CampusBridge. Your personal Light/Dark mode choice remains respected.`
                    : 'The standard CampusBridge purple theme is currently active platform-wide. When college festivals or national holidays occur, special celebrations and festive accents will illuminate the app automatically.'}
                </p>
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
                        fetch(`${API_BASE}/api/users/${user.id}/profile`, {
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
                      <button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center cursor-pointer">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Active Sessions */}
                <div className="flex gap-4 p-4 bg-muted/30 border border-border/40 rounded-xl">
                  <Laptop className="w-5 h-5 text-primary shrink-0" />
                  <div className="w-full min-w-0">
                    <h4 className="font-semibold text-sm text-foreground">Active Devices</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-4">Devices that are currently logged into your account.</p>
                    <div className="space-y-3">
                      {sessions?.map(session => (
                        <div key={session.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 bg-background border border-border/50 rounded-lg">
                          <div className="flex items-center gap-3 min-w-0">
                            {session.latestActivity?.isMobile ? <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" /> : <Laptop className="w-4 h-4 text-muted-foreground shrink-0" />}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground flex items-center flex-wrap gap-1.5 sm:gap-2">
                                <span className="truncate min-w-0">{session.id === currentSession?.id 
                                  ? `${currentDeviceInfo.browser} on ${currentDeviceInfo.os}`
                                  : `${session.latestActivity?.browserName || 'Unknown Browser'} on ${session.latestActivity?.deviceType || 'Unknown Device'}`
                                }</span>
                                {session.id === currentSession?.id && <span className="bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0">This Device</span>}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate min-w-0">{session.id === currentSession?.id 
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
                      className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-border/40 pb-4">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-primary" />
                  Mentor Support & Contact Us
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Need help with verification approval, session scheduling, or mentee inquiries? Contact our admin team directly.
                </p>
              </div>

              {/* Direct Contact Card */}
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 sm:p-8 space-y-4">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                      <MessageSquare className="w-3.5 h-3.5" /> Mentor Priority Desk
                    </span>
                    <h3 className="text-xl font-extrabold text-foreground pt-1">Direct Contact Form</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
                      Send a priority support message directly to CampusBridge administrators regarding your mentor account, verification status, or feedback.
                    </p>
                  </div>
                  <Link
                    to="/#contact"
                    onClick={() => {
                      sessionStorage.setItem('campusbridge_tab_initialized', 'true')
                      sessionStorage.setItem('campusbridge_viewing_home', 'true')
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 transition-all cursor-pointer"
                  >
                    Open Contact Us Form
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Support Channels Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">Official Mentor Support Email</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Direct communication for profile verification assistance, payouts, and enterprise inquiries.
                  </p>
                  <a
                    href="mailto:campusbridgeofficial3@gmail.com"
                    className="text-xs font-semibold text-primary hover:underline block pt-1 break-all"
                  >
                    campusbridgeofficial3@gmail.com
                  </a>
                </div>

                <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-foreground">Mentor Guidelines & FAQs</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Find common answers regarding mentorship sessions, student communications, and requirements.
                  </p>
                  <Link
                    to="/#faq"
                    onClick={() => {
                      sessionStorage.setItem('campusbridge_tab_initialized', 'true')
                      sessionStorage.setItem('campusbridge_viewing_home', 'true')
                    }}
                    className="text-xs font-semibold text-primary hover:underline block pt-1"
                  >
                    View FAQs & Answers &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteAccountModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeleteAccount}
        userRole="mentor"
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
