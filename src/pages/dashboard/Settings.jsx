import React, { useState, useRef, useEffect } from 'react'
import { User, Briefcase, GraduationCap, Code, FileText, CheckCircle2, Save, Upload, Sparkles, Loader2, Lock, Shield, Globe, Laptop, Smartphone, Trash2, MapPin, AtSign, Check, AlertCircle, ChevronDown, Edit2 } from 'lucide-react'
import { useUser, useSessionList, useSession } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/modals/ConfirmModal'
import { AnimatePresence } from 'framer-motion'
import ImageCropModal from '../../components/ImageCropModal'
import { useCurrentDevice } from '../../hooks/useCurrentDevice'
import { getPdfViewUrl } from '../../utils/pdfViewer'
import { calculateStudentProfileProgress } from '../../utils/profileProgress'
import API_BASE from '../../utils/api'

const JOB_TITLES = [
  "Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "Mobile Developer", "iOS Developer", "Android Developer", "Web Developer",
  "Data Scientist", "Data Analyst", "Machine Learning Engineer", "AI Engineer",
  "DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer (SRE)",
  "Systems Administrator", "Database Administrator (DBA)", "Network Engineer",
  "Security Analyst", "Cybersecurity Engineer", "Penetration Tester",
  "Product Manager", "Project Manager", "Scrum Master", "Agile Coach",
  "UI/UX Designer", "Product Designer", "Graphic Designer", "Web Designer",
  "Quality Assurance (QA) Engineer", "Test Automation Engineer", "Software Tester",
  "Business Analyst", "Systems Analyst", "Technical Writer", "Developer Advocate",
  "IT Support Specialist", "Help Desk Technician", "Network Administrator",
  "Marketing Manager", "Digital Marketer", "SEO Specialist", "Content Writer",
  "Sales Representative", "Account Executive", "Customer Success Manager",
  "Human Resources (HR) Manager", "Recruiter", "Operations Manager",
  "Financial Analyst", "Accountant", "Consultant", "Research Assistant",
  "Teaching Assistant", "Intern", "Other"
];
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const jobTypes = ["Full-time", "Part-time", "Internship", "Freelance", "Contract"];
const EDUCATION_LEVELS = ["10th", "12th", "Graduation", "Post Graduation (PG)", "Higher Studies", "Other"];

const UG_DEGREES = [
  "B.Tech / B.E.", "B.Sc", "BCA (Computer Applications)", "B.Com", "B.A", "BBA", "B.Des",
  "MBBS", "B.Arch", "B.Pharm", "BHM (Hotel Management)", "LLB", "B.Ed", "BFA (Fine Arts)", "Other"
];
const PG_DEGREES = [
  "M.Tech / M.E.", "M.Sc", "MCA (Computer Applications)", "M.Com", "M.A", "MBA",
  "M.Sc (AI & Machine Learning)", "M.Sc (Data Science)", "M.Sc (Cybersecurity)", "M.Sc (Cloud Computing)",
  "M.Tech (AI & ML)", "M.Tech (Cloud Computing & DevOps)", "M.Tech (Data Science & Analytics)",
  "M.Tech (Cybersecurity)", "M.Tech (IoT)", "M.Tech (Software Engineering)",
  "MD", "M.Arch", "M.Pharm", "M.Des", "LLM", "M.Ed", "MFA (Fine Arts)",
  "PGDM", "PGDCA (Computer Applications)", "Other"
];
const STREAMS = [
  "Computer Science & Engineering (CSE)", "Computer Applications (CA)", "Information Technology (IT)",
  "Electronics & Communication (ECE)", "Electrical & Electronics (EEE)", "Electrical Engineering (EE)",
  "Mechanical Engineering (ME)", "Civil Engineering (CE)", "Chemical Engineering",
  "Artificial Intelligence & Machine Learning (AI/ML)", "Data Science & Analytics", "Cloud Computing & DevOps",
  "Cybersecurity & Ethical Hacking", "Internet of Things (IoT)", "Blockchain Technology",
  "Robotics & Automation", "Software Engineering", "Full Stack Development",
  "Business Administration / Management", "Finance / Accounting", "Marketing / Digital Marketing",
  "Human Resource Management", "Operations & Supply Chain", "International Business",
  "Physics", "Mathematics", "Chemistry", "Biotechnology / Bioinformatics",
  "Arts / Humanities", "Psychology", "Economics", "Political Science", "Sociology",
  "Law", "Medicine / Surgery", "Pharmacy", "Architecture", "Design / UX",
  "Journalism & Mass Communication", "Education / Teaching", "Other"
];

const POPULAR_SKILLS = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Ruby", "Go", "Rust", "PHP", "Swift", "Kotlin", "HTML", "CSS",
  "React.js", "Next.js", "Vue.js", "Angular", "Svelte", "Node.js", "Express.js", "Django", "Flask", "Spring Boot", "Ruby on Rails",
  "MongoDB", "PostgreSQL", "MySQL", "SQLite", "Redis", "Elasticsearch", "Cassandra", "Oracle DB", "Microsoft SQL Server",
  "Docker", "Kubernetes", "AWS", "Google Cloud Platform (GCP)", "Microsoft Azure", "Terraform", "Ansible", "Jenkins", "GitHub Actions",
  "Git", "GitHub", "GitLab", "Bitbucket", "Linux", "Bash", "PowerShell",
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Pandas", "NumPy", "Scikit-Learn", "Data Analysis", "Data Visualization",
  "Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator",
  "Agile Methodologies", "Scrum", "Jira", "Trello", "Confluence", "REST APIs", "GraphQL", "WebSockets", "Microservices"
].sort();

const COUNTRIES = [
  { name: 'Afghanistan', code: '+93', flag: '🇦🇫' }, { name: 'Albania', code: '+355', flag: '🇦🇱' }, { name: 'Algeria', code: '+213', flag: '🇩🇿' },
  { name: 'Andorra', code: '+376', flag: '🇦🇩' }, { name: 'Angola', code: '+244', flag: '🇦🇴' }, { name: 'Argentina', code: '+54', flag: '🇦🇷' },
  { name: 'Armenia', code: '+374', flag: '🇦🇲' }, { name: 'Australia', code: '+61', flag: '🇦🇺' }, { name: 'Austria', code: '+43', flag: '🇦🇹' },
  { name: 'Azerbaijan', code: '+994', flag: '🇦🇿' }, { name: 'Bahrain', code: '+973', flag: '🇧🇭' }, { name: 'Bangladesh', code: '+880', flag: '🇧🇩' },
  { name: 'Belarus', code: '+375', flag: '🇧🇾' }, { name: 'Belgium', code: '+32', flag: '🇧🇪' }, { name: 'Bhutan', code: '+975', flag: '🇧🇹' },
  { name: 'Bolivia', code: '+591', flag: '🇧🇴' }, { name: 'Bosnia and Herzegovina', code: '+387', flag: '🇧🇦' }, { name: 'Brazil', code: '+55', flag: '🇧🇷' },
  { name: 'Bulgaria', code: '+359', flag: '🇧🇬' }, { name: 'Cambodia', code: '+855', flag: '🇰🇭' }, { name: 'Cameroon', code: '+237', flag: '🇨🇲' },
  { name: 'Canada', code: '+1', flag: '🇨🇦' }, { name: 'Chile', code: '+56', flag: '🇨🇱' }, { name: 'China', code: '+86', flag: '🇨🇳' },
  { name: 'Colombia', code: '+57', flag: '🇨🇴' }, { name: 'Costa Rica', code: '+506', flag: '🇨🇷' }, { name: 'Croatia', code: '+385', flag: '🇭🇷' },
  { name: 'Cuba', code: '+53', flag: '🇨🇺' }, { name: 'Cyprus', code: '+357', flag: '🇨🇾' }, { name: 'Czech Republic', code: '+420', flag: '🇨🇿' },
  { name: 'Denmark', code: '+45', flag: '🇩🇰' }, { name: 'Ecuador', code: '+593', flag: '🇪🇨' }, { name: 'Egypt', code: '+20', flag: '🇪🇬' },
  { name: 'El Salvador', code: '+503', flag: '🇸🇻' }, { name: 'Estonia', code: '+372', flag: '🇪🇪' }, { name: 'Ethiopia', code: '+251', flag: '🇪🇹' },
  { name: 'Fiji', code: '+679', flag: '🇫🇯' }, { name: 'Finland', code: '+358', flag: '🇫🇮' }, { name: 'France', code: '+33', flag: '🇫🇷' },
  { name: 'Georgia', code: '+995', flag: '🇬🇪' }, { name: 'Germany', code: '+49', flag: '🇩🇪' }, { name: 'Ghana', code: '+233', flag: '🇬🇭' },
  { name: 'Greece', code: '+30', flag: '🇬🇷' }, { name: 'Guatemala', code: '+502', flag: '🇬🇹' }, { name: 'Honduras', code: '+504', flag: '🇭🇳' },
  { name: 'Hong Kong', code: '+852', flag: '🇭🇰' }, { name: 'Hungary', code: '+36', flag: '🇭🇺' }, { name: 'Iceland', code: '+354', flag: '🇮🇸' },
  { name: 'India', code: '+91', flag: '🇮🇳' }, { name: 'Indonesia', code: '+62', flag: '🇮🇩' }, { name: 'Iran', code: '+98', flag: '🇮🇷' },
  { name: 'Iraq', code: '+964', flag: '🇮🇶' }, { name: 'Ireland', code: '+353', flag: '🇮🇪' }, { name: 'Israel', code: '+972', flag: '🇮🇱' },
  { name: 'Italy', code: '+39', flag: '🇮🇹' }, { name: 'Jamaica', code: '+1-876', flag: '🇯🇲' }, { name: 'Japan', code: '+81', flag: '🇯🇵' },
  { name: 'Jordan', code: '+962', flag: '🇯🇴' }, { name: 'Kazakhstan', code: '+7', flag: '🇰🇿' }, { name: 'Kenya', code: '+254', flag: '🇰🇪' },
  { name: 'Kuwait', code: '+965', flag: '🇰🇼' }, { name: 'Lebanon', code: '+961', flag: '🇱🇧' }, { name: 'Malaysia', code: '+60', flag: '🇲🇾' },
  { name: 'Maldives', code: '+960', flag: '🇲🇻' }, { name: 'Mexico', code: '+52', flag: '🇲🇽' }, { name: 'Monaco', code: '+377', flag: '🇲🇨' },
  { name: 'Morocco', code: '+212', flag: '🇲🇦' }, { name: 'Myanmar', code: '+95', flag: '🇲🇲' }, { name: 'Nepal', code: '+977', flag: '🇳🇵' },
  { name: 'Netherlands', code: '+31', flag: '🇳🇱' }, { name: 'New Zealand', code: '+64', flag: '🇳🇿' }, { name: 'Nigeria', code: '+234', flag: '🇳🇬' },
  { name: 'Norway', code: '+47', flag: '🇳🇴' }, { name: 'Oman', code: '+968', flag: '🇴🇲' }, { name: 'Pakistan', code: '+92', flag: '🇵🇰' },
  { name: 'Panama', code: '+507', flag: '🇵🇦' }, { name: 'Paraguay', code: '+595', flag: '🇵🇾' }, { name: 'Peru', code: '+51', flag: '🇵🇪' },
  { name: 'Philippines', code: '+63', flag: '🇵🇭' }, { name: 'Poland', code: '+48', flag: '🇵🇱' }, { name: 'Portugal', code: '+351', flag: '🇵🇹' },
  { name: 'Qatar', code: '+974', flag: '🇶🇦' }, { name: 'Romania', code: '+40', flag: '🇷🇴' }, { name: 'Russia', code: '+7', flag: '🇷🇺' },
  { name: 'Saudi Arabia', code: '+966', flag: '🇸🇦' }, { name: 'Senegal', code: '+221', flag: '🇸🇳' }, { name: 'Serbia', code: '+381', flag: '🇷🇸' },
  { name: 'Singapore', code: '+65', flag: '🇸🇬' }, { name: 'South Africa', code: '+27', flag: '🇿🇦' }, { name: 'South Korea', code: '+82', flag: '🇰🇷' },
  { name: 'Spain', code: '+34', flag: '🇪🇸' }, { name: 'Sri Lanka', code: '+94', flag: '🇱🇰' }, { name: 'Sweden', code: '+46', flag: '🇸🇪' },
  { name: 'Switzerland', code: '+41', flag: '🇨🇭' }, { name: 'Taiwan', code: '+886', flag: '🇹🇼' }, { name: 'Thailand', code: '+66', flag: '🇹🇭' },
  { name: 'Tunisia', code: '+216', flag: '🇹🇳' }, { name: 'Turkey', code: '+90', flag: '🇹🇷' }, { name: 'Uganda', code: '+256', flag: '🇺🇬' },
  { name: 'Ukraine', code: '+380', flag: '🇺🇦' }, { name: 'United Arab Emirates', code: '+971', flag: '🇦🇪' }, { name: 'United Kingdom', code: '+44', flag: '🇬🇧' },
  { name: 'United States', code: '+1', flag: '🇺🇸' }, { name: 'Uruguay', code: '+598', flag: '🇺🇾' }, { name: 'Uzbekistan', code: '+998', flag: '🇺🇿' },
  { name: 'Vatican City', code: '+379', flag: '🇻🇦' }, { name: 'Venezuela', code: '+58', flag: '🇻🇪' }, { name: 'Vietnam', code: '+84', flag: '🇻🇳' },
  { name: 'Yemen', code: '+967', flag: '🇾🇪' }, { name: 'Zambia', code: '+260', flag: '🇿🇲' }, { name: 'Zimbabwe', code: '+263', flag: '🇿🇼' }
];

const getIso2FromFlag = (emoji) => {
  if (!emoji) return 'in';
  const code1 = emoji.codePointAt(0);
  const code2 = emoji.codePointAt(2);
  if (!code1 || !code2) return 'in';
  return String.fromCharCode(code1 - 0x1F1E6 + 97) + String.fromCharCode(code2 - 0x1F1E6 + 97);
};

const Settings = () => {
  const { user, isLoaded } = useUser()
  const { sessions } = useSessionList()
  const { session: currentSession } = useSession()
  const currentDeviceInfo = useCurrentDevice()
  const [activeTab, setActiveTab] = useState('basic')
  
  // Form State
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [headline, setHeadline] = useState('')
  const [location, setLocation] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [aboutMe, setAboutMe] = useState('')
  const [socialLinks, setSocialLinks] = useState([])
  const [showSocialForm, setShowSocialForm] = useState(false)
  const [newSocial, setNewSocial] = useState({ platform: 'LinkedIn', url: '' })
  const [resumeUrl, setResumeUrl] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [ageVisibility, setAgeVisibility] = useState('private')
  const [experience, setExperience] = useState([])
  const [education, setEducation] = useState([])
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [usernameValue, setUsernameValue] = useState('')
  const [usernameError, setUsernameError] = useState('')
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [showExpForm, setShowExpForm] = useState(false)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => (currentYear - i).toString());
  const futureYears = Array.from({ length: 56 }, (_, i) => (currentYear + 6 - i).toString());
  const [newExp, setNewExp] = useState({ 
    title: '', customTitle: '', type: 'Full-time', company: '', 
    startMonth: 'Jan', startYear: currentYear.toString(), 
    endMonth: 'Dec', endYear: currentYear.toString(), 
    isCurrent: false, description: '', searchQuery: '' 
  })
  const [showJobDropdown, setShowJobDropdown] = useState(false)
  const [editExpIndex, setEditExpIndex] = useState(null)
  
  const [showEduForm, setShowEduForm] = useState(false)
  const [eduSelectionMode, setEduSelectionMode] = useState(false)
  const [editEduIndex, setEditEduIndex] = useState(null)
  const [newEdu, setNewEdu] = useState({ level: '', degree: '', degreeBase: '', stream: '', institution: '', startMonth: 'Jan', startYear: currentYear.toString(), endMonth: 'Dec', endYear: currentYear.toString(), isCurrent: false, grade: '' })
  
  const [showSkillDropdown, setShowSkillDropdown] = useState(false)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)
  
  const [isUploading, setIsUploading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [profileVisibility, setProfileVisibility] = useState('public')
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

  // Image crop state
  const [cropModalData, setCropModalData] = useState(null)

  useEffect(() => {
    if (user && !hasInitialized) {
      // Set initial state from Clerk as a fallback
      setFirstName(user.firstName || '')
      setLastName(user.lastName || '')
      setHeadline(user.unsafeMetadata?.headline || '')
      setLocation(user.unsafeMetadata?.location || '')
      setAddress(user.unsafeMetadata?.address || '')
      setPhone(user.unsafeMetadata?.phone || '')
      setAboutMe(user.unsafeMetadata?.aboutMe || '')
      setSocialLinks(user.unsafeMetadata?.socialLinks || [])
      setResumeUrl(user.unsafeMetadata?.resumeUrl || '')
      setExperience(user.unsafeMetadata?.experience || [])
      setEducation(user.unsafeMetadata?.education || [])
      setSkills(user.unsafeMetadata?.skills || [])

      // Fetch from MongoDB for the source of truth
      const fetchMongoProfile = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/users/${user.id}`);
          if (res.ok) {
            const data = await res.json();
            setFirstName(data.firstName || user.firstName || '');
            setLastName(data.lastName || user.lastName || '');
            setUsernameValue(data.username || '');
            setHeadline(data.headline || user.unsafeMetadata?.headline || '');
            setLocation(data.location || user.unsafeMetadata?.location || '');
            setAddress(data.address || user.unsafeMetadata?.address || '');
            setPhone(data.phone || user.unsafeMetadata?.phone || '');
            setAboutMe(data.aboutMe || user.unsafeMetadata?.aboutMe || '');
            setSocialLinks(data.socialLinks?.length ? data.socialLinks : (user.unsafeMetadata?.socialLinks || []));
            setResumeUrl(data.resumeUrl || user.unsafeMetadata?.resumeUrl || '');
            setExperience(data.experience?.length ? data.experience : (user.unsafeMetadata?.experience || []));
            setEducation(data.education?.length ? data.education : (user.unsafeMetadata?.education || []));
            setSkills(data.skills?.length ? data.skills : (user.unsafeMetadata?.skills || []));
            setDateOfBirth(data.dateOfBirth || '');
            if (data.ageVisibility) setAgeVisibility(data.ageVisibility);
            if (data.profileVisibility) setProfileVisibility(data.profileVisibility);
            setHasInitialized(true);
          }
        } catch (error) {
          console.error("Failed to fetch mongo profile:", error);
          setHasInitialized(true); // Proceed even if fetch fails to avoid getting stuck
        }
      };
      fetchMongoProfile();
    }
  }, [user, hasInitialized])

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
      
      // Immediately sync the new image URL to MongoDB
      await fetch(`${API_BASE}/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: user.imageUrl
        })
      });
      
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

  const handleSaveChanges = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      // Save username separately (has its own uniqueness check)
      if (usernameValue) {
        const usernameRes = await fetch(`${API_BASE}/api/users/${user.id}/username`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: usernameValue })
        });
        if (!usernameRes.ok) {
          const data = await usernameRes.json().catch(() => ({}));
          if (data.message?.includes('taken')) {
            setUsernameError('This username is already taken');
            toast.error('Username is already taken');
            setIsSaving(false);
            return;
          }
        }
      }

      // Save to Clerk (fallback/auth layer)
      try {
        await user.update({
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
          ...(user.username ? { username: usernameValue || undefined } : {}),
          unsafeMetadata: {
            ...user.unsafeMetadata,
            headline,
            location,
            address,
            phone,
            aboutMe,
            socialLinks,
            resumeUrl,
            experience,
            education,
            skills
          }
        });
      } catch (clerkErr) {
        console.warn('Clerk update failed, proceeding with DB update:', clerkErr);
      }

      // Save to MongoDB (primary database layer)
      const res = await fetch(`${API_BASE}/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          headline,
          location,
          address,
          phone,
          aboutMe,
          socialLinks,
          resumeUrl,
          experience,
          education,
          skills,
          imageUrl: user.imageUrl,
          dateOfBirth,
          ageVisibility,
          profileVisibility
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save to MongoDB');
      }

      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.message || 'Failed to save changes')
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleUploadResume = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      const response = await fetch(`${API_BASE}/api/upload/resume`, {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      
      if (data.success) {
        setResumeUrl(data.url)
        // Also save immediately to clerk so it's not lost if they forget to hit save
        await user.update({
          unsafeMetadata: {
             ...user.unsafeMetadata,
             resumeUrl: data.url
          }
        })
        toast.success('Resume uploaded successfully!')
      } else {
        toast.error('Failed to upload resume')
      }
    } catch (err) {
      console.error('Resume upload error:', err)
      toast.error('Upload failed')
    } finally {
      setIsUploading(false)
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

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Code },
    { id: 'resume', label: 'Resume/Docs', icon: FileText },
    { id: 'privacy', label: 'Privacy & Security', icon: Lock },
  ]

  const isBasicComplete = Boolean(
    firstName?.trim() && 
    lastName?.trim() && 
    headline?.trim() && 
    location?.trim() && 
    address?.trim() &&
    aboutMe?.trim() && 
    (user?.imageUrl && !user.imageUrl.includes('default'))
  );
  
  const isExperienceComplete = experience.length > 0;
  const isEducationComplete = education.length > 0;
  const isSkillsComplete = skills.length > 0;
  const isResumeComplete = Boolean(resumeUrl?.trim());

  const calculateProgress = () => {
    return calculateStudentProfileProgress({
      firstName, lastName, headline, location, address, phone, aboutMe, skills, education, experience, resumeUrl
    }, user);
  }

  const completionPercentage = calculateProgress()

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-6">
      
      {/* Header & Progress */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Profile Settings</h1>
        
        <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm sm:text-base text-foreground">Profile Completion</h3>
              <span className="text-primary font-bold text-sm sm:text-base">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 sm:h-3 overflow-hidden">
              <div 
                className="bg-primary h-2.5 sm:h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 sm:mt-3">
              Complete your profile to stand out to recruiters and mentor mentors.
            </p>
          </div>
          <button 
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-colors shadow-sm shrink-0 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
            Save All Changes
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row gap-4 sm:gap-6 items-start">
        
        {/* Left Sidebar (Tabs) */}
        <div className="w-full md:w-64 bg-card border border-border/50 rounded-2xl p-1.5 sm:p-3 shadow-sm shrink-0 flex flex-row md:flex-col gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none md:sticky md:top-24 min-w-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all text-left whitespace-nowrap shrink-0
                ${activeTab === tab.id 
                  ? 'bg-primary/10 text-primary font-semibold' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {/* Green checkmark if completed */}
              {tab.id === 'basic' && isBasicComplete && (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto hidden md:block" />
              )}
              {tab.id === 'experience' && isExperienceComplete && (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto hidden md:block" />
              )}
              {tab.id === 'education' && isEducationComplete && (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto hidden md:block" />
              )}
              {tab.id === 'skills' && isSkillsComplete && (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto hidden md:block" />
              )}
              {tab.id === 'resume' && isResumeComplete && (
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto hidden md:block" />
              )}
            </button>
          ))}
        </div>

        {/* Right Content Area (Forms) */}
        <div className="flex-1 w-full bg-card border border-border/50 rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm h-[calc(100vh-260px)] min-h-[350px] overflow-y-auto">
          
          {/* --- BASIC INFO --- */}
          {activeTab === 'basic' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg sm:text-xl font-bold text-foreground border-b border-border/40 pb-4">Basic Information</h2>
              
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6">
                <img 
                  src={user?.imageUrl || "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"} 
                  alt="Profile" 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border border-border/50"
                />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleProfilePicSelect} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-muted text-foreground hover:bg-muted/80 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-border/50"
                >
                  Change Photo
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">First Name</label>
                  <input 
                    type="text" 
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Last Name</label>
                  <input 
                    type="text" 
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" 
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <AtSign className="w-4 h-4 text-primary" /> Username
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={usernameValue} 
                      onChange={(e) => handleUsernameChange(e.target.value)} 
                      placeholder="barsha-mahajan-1234" 
                      className={`w-full bg-background border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 text-sm text-foreground transition-all ${
                        usernameError 
                          ? 'border-red-500/50 focus:ring-red-500/50' 
                          : 'border-border/50 focus:ring-primary/50'
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
                    <p className="text-xs text-red-500">{usernameError}</p>
                  ) : usernameValue ? (
                    <p className="text-xs text-muted-foreground">campusbridge.com/u/<span className="text-primary font-medium">{usernameValue}</span></p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Your unique profile URL. Auto-generated on signup, you can change it here.</p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Headline (Tagline)</label>
                  <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="MCA Student | Seeking SDE Internships" className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Location</label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Kolkata, India" className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Address</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St, Kolkata" className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Date of Birth</label>
                  <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Age Visibility</label>
                  <select value={ageVisibility} onChange={(e) => setAgeVisibility(e.target.value)} className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all">
                    <option value="public">Public</option>
                    <option value="private">Private (Hidden)</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Phone Number</label>
                  <div className="flex flex-row items-center gap-2 relative w-full">
                    <div className="relative w-[110px] sm:w-[140px] shrink-0">
                      <button 
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        onBlur={() => setTimeout(() => setShowCountryDropdown(false), 200)}
                        className="w-full h-[42px] flex items-center justify-between bg-background border border-border/50 rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <img src={`https://flagcdn.com/w20/${getIso2FromFlag(COUNTRIES.find(c => phone.startsWith(c.code))?.flag || '🇮🇳')}.png`} alt="flag" className="w-5 h-auto rounded-sm object-cover shadow-sm" />
                          <span className="truncate">{COUNTRIES.find(c => phone.startsWith(c.code))?.code || '+91'}</span>
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                      
                      {showCountryDropdown && (
                        <div className="absolute z-[100] w-[280px] sm:w-[300px] max-w-[calc(100vw-3rem)] mt-1 bg-background border border-border/50 rounded-lg shadow-xl max-h-60 overflow-y-auto left-0">
                          {COUNTRIES.map(c => (
                            <div 
                              key={c.name}
                              className="px-3 py-2.5 text-sm hover:bg-muted cursor-pointer flex items-center gap-3 transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                const currentNumber = phone.replace(/^\+\d+(-\d+)?\s*/, '');
                                setPhone(`${c.code} ${currentNumber}`);
                                setShowCountryDropdown(false);
                              }}
                            >
                              <img src={`https://flagcdn.com/w20/${getIso2FromFlag(c.flag)}.png`} alt="flag" className="w-5 h-auto rounded-sm object-cover shrink-0 shadow-sm" />
                              <span className="font-medium text-foreground">{c.name}</span>
                              <span className="text-muted-foreground ml-auto">{c.code}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <input 
                      type="tel" 
                      value={phone.replace(/^\+\d+(-\d+)?\s*/, '')} // Show only the number part in input
                      onChange={(e) => {
                        const code = COUNTRIES.find(c => phone.startsWith(c.code))?.code || '+91';
                        setPhone(`${code} ${e.target.value}`);
                      }} 
                      placeholder="9876543210" 
                      className="flex-1 w-full h-[42px] bg-background border border-border/50 rounded-xl px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" 
                    />
                  </div>
                </div>
                <div className="sm:col-span-2 mt-2 p-4 bg-muted/30 border border-border/50 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Chat Pop-up Notifications & Sounds</h4>
                    <p className="text-xs text-muted-foreground mt-1">Receive sound alerts and pop-up notifications for new messages.</p>
                  </div>
                  <button 
                    onClick={() => handleChatNotifsToggle(!chatNotifs)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${chatNotifs ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${chatNotifs ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="sm:col-span-2 mt-2 p-4 bg-muted/30 border border-border/50 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">General Notification Sound</h4>
                    <p className="text-xs text-muted-foreground mt-1">Play sound for system notifications.</p>
                  </div>
                  <button 
                    onClick={() => handleNotificationSoundToggle(!notificationSound)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${notificationSound ? 'bg-primary' : 'bg-muted-foreground/30'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationSound ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              <div className="space-y-4 sm:col-span-2 mt-4 pt-4 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Social Media Links</label>
                    <button 
                      onClick={() => setShowSocialForm(!showSocialForm)} 
                      className="text-primary text-sm font-medium hover:underline"
                    >
                      {showSocialForm ? 'Cancel' : '+ Add Link'}
                    </button>
                  </div>
                  
                  {showSocialForm && (
                    <div className="bg-muted/10 border border-border/50 rounded-xl p-4 space-y-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <select 
                          value={newSocial.platform}
                          onChange={(e) => setNewSocial({...newSocial, platform: e.target.value})}
                          className="w-full sm:w-1/3 bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="GitHub">GitHub</option>
                          <option value="Instagram">Instagram</option>
                          <option value="Facebook">Facebook</option>
                          <option value="Twitter">Twitter/X</option>
                          <option value="Portfolio">Portfolio/Website</option>
                        </select>
                        <input 
                          type="url" 
                          placeholder="Paste URL here..." 
                          value={newSocial.url}
                          onChange={(e) => setNewSocial({...newSocial, url: e.target.value})}
                          className="w-full sm:w-2/3 bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          if (newSocial.url) {
                            setSocialLinks([...socialLinks, newSocial])
                            setNewSocial({ platform: 'LinkedIn', url: '' })
                            setShowSocialForm(false)
                          }
                        }}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        Add Link
                      </button>
                    </div>
                  )}

                  {socialLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                      {socialLinks.map((link, i) => (
                        <div key={i} className="flex items-center gap-2 bg-muted/50 border border-border/50 rounded-lg px-3 py-1.5 group">
                          <span className="text-xs font-semibold text-foreground/80">{link.platform}:</span>
                          <span className="text-xs text-primary max-w-[150px] truncate">{link.url}</span>
                          <button 
                            onClick={() => setSocialLinks(socialLinks.filter((_, idx) => idx !== i))}
                            className="ml-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    !showSocialForm && <p className="text-sm text-muted-foreground italic">No social links added yet.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Contact Email</label>
                  <input type="email" disabled value={user?.primaryEmailAddress?.emailAddress || ''} className="w-full bg-muted/50 border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none text-sm text-foreground transition-all cursor-not-allowed" />
                  <p className="text-xs text-muted-foreground">Email address cannot be changed directly.</p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">About Me</label>
                  <textarea rows="4" value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} placeholder="Passionate software developer..." className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all"></textarea>
                </div>
              </div>
            </div>
          )}

          {/* --- EXPERIENCE --- */}
          {activeTab === 'experience' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <h2 className="text-xl font-bold text-foreground">Experience</h2>
                <button onClick={() => {
                  if (showExpForm) {
                    setShowExpForm(false);
                    setEditExpIndex(null);
                    setNewExp({ title: '', customTitle: '', type: 'Full-time', company: '', startMonth: 'Jan', startYear: currentYear.toString(), endMonth: 'Dec', endYear: currentYear.toString(), isCurrent: false, description: '', searchQuery: '' });
                  } else {
                    setShowExpForm(true);
                  }
                }} className="text-primary text-sm font-medium hover:underline">{showExpForm ? 'Cancel' : '+ Add Experience'}</button>
              </div>
              
              {showExpForm && (
                <div className="bg-muted/10 border border-border/50 rounded-xl p-4 space-y-4 my-4 relative">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Job Title</label>
                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Search job title..."
                        value={newExp.searchQuery}
                        onFocus={() => setShowJobDropdown(true)}
                        onBlur={() => setTimeout(() => setShowJobDropdown(false), 200)}
                        onChange={e => setNewExp({...newExp, searchQuery: e.target.value, title: ''})}
                        className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {showJobDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-background border border-border/50 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {JOB_TITLES.filter(j => j.toLowerCase().includes(newExp.searchQuery.toLowerCase())).map((job, idx) => (
                            <div 
                              key={idx}
                              className="px-3 py-2 text-sm hover:bg-muted cursor-pointer"
                              onMouseDown={(e) => {
                                e.preventDefault(); // Prevent input from losing focus if we want, or just let onBlur handle the close
                                setNewExp({...newExp, title: job, searchQuery: job});
                                setShowJobDropdown(false);
                              }}
                            >
                              {job}
                            </div>
                          ))}
                          {JOB_TITLES.filter(j => j.toLowerCase().includes(newExp.searchQuery.toLowerCase())).length === 0 && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">No matches found. Select "Other" to type custom.</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {newExp.title === 'Other' && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                      <label className="text-xs font-medium text-foreground">Custom Job Title</label>
                      <input type="text" placeholder="e.g. Chief Happiness Officer" value={newExp.customTitle} onChange={e => setNewExp({...newExp, customTitle: e.target.value})} className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Company</label>
                      <input type="text" placeholder="e.g. Tech Solutions Inc." value={newExp.company} onChange={e => setNewExp({...newExp, company: e.target.value})} className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Job Type</label>
                      <select value={newExp.type} onChange={e => setNewExp({...newExp, type: e.target.value})} className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                        {jobTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Duration</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <select value={newExp.startMonth} onChange={e => setNewExp({...newExp, startMonth: e.target.value})} className="bg-background border border-border/50 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <select value={newExp.startYear} onChange={e => setNewExp({...newExp, startYear: e.target.value})} className="bg-background border border-border/50 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      
                      {!newExp.isCurrent && (
                        <>
                          <select value={newExp.endMonth} onChange={e => setNewExp({...newExp, endMonth: e.target.value})} className="bg-background border border-border/50 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <select value={newExp.endYear} onChange={e => setNewExp({...newExp, endYear: e.target.value})} className="bg-background border border-border/50 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </>
                      )}
                      {newExp.isCurrent && (
                        <div className="col-span-2 flex items-center px-3 bg-muted/30 border border-border/50 rounded-lg text-sm text-muted-foreground">
                          Present
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <input type="checkbox" id="isCurrent" checked={newExp.isCurrent} onChange={e => setNewExp({...newExp, isCurrent: e.target.checked})} className="rounded text-primary focus:ring-primary/50" />
                      <label htmlFor="isCurrent" className="text-xs text-foreground cursor-pointer">I currently work here</label>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Description</label>
                    <textarea placeholder="What did you do?" rows="2" value={newExp.description} onChange={e => setNewExp({...newExp, description: e.target.value})} className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"></textarea>
                  </div>

                  <button onClick={() => {
                    const finalTitle = newExp.title === 'Other' ? newExp.customTitle : newExp.searchQuery || newExp.title;
                    if(finalTitle && newExp.company) {
                      const durationStr = `${newExp.startMonth} ${newExp.startYear} - ${newExp.isCurrent ? 'Present' : `${newExp.endMonth} ${newExp.endYear}`}`;
                      const expData = {
                        title: finalTitle,
                        company: newExp.company,
                        type: newExp.type,
                        duration: durationStr,
                        description: newExp.description
                      };
                      
                      if (editExpIndex !== null) {
                        const updated = [...experience];
                        updated[editExpIndex] = expData;
                        setExperience(updated);
                        setEditExpIndex(null);
                      } else {
                        setExperience([...experience, expData]);
                      }
                      
                      setNewExp({ title: '', customTitle: '', type: 'Full-time', company: '', startMonth: 'Jan', startYear: currentYear.toString(), endMonth: 'Dec', endYear: currentYear.toString(), isCurrent: false, description: '', searchQuery: '' });
                      setShowExpForm(false);
                    } else {
                      toast.error('Please fill required fields (Title, Company)');
                    }
                  }} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                    {editExpIndex !== null ? 'Update Experience' : 'Add to Profile'}
                  </button>
                </div>
              )}

              {experience.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {experience.map((exp, i) => (
                    <div key={i} className="border border-border/50 rounded-xl p-5 bg-muted/10 relative group">
                      <div className="absolute top-4 right-4 flex gap-3 opacity-100 transition-opacity">
                        <button onClick={() => {
                          const [start, end] = (exp.duration || '').split(' - ');
                          const [startMonth = 'Jan', startYear = currentYear.toString()] = (start || '').split(' ');
                          let endMonth = 'Dec', endYear = currentYear.toString(), isCurrent = false;
                          if (end === 'Present') {
                            isCurrent = true;
                          } else if (end) {
                            [endMonth, endYear] = end.split(' ');
                          }
                          setNewExp({
                            title: exp.title,
                            customTitle: '',
                            type: exp.type || 'Full-time',
                            company: exp.company,
                            startMonth,
                            startYear,
                            endMonth,
                            endYear,
                            isCurrent,
                            description: exp.description || '',
                            searchQuery: exp.title
                          });
                          setEditExpIndex(i);
                          setShowExpForm(true);
                        }} className="text-xs font-medium text-blue-500 hover:underline">Edit</button>
                        <button onClick={() => setExperience(experience.filter((_, idx) => idx !== i))} className="text-xs font-medium text-destructive hover:underline">Delete</button>
                      </div>
                      <h3 className="font-bold text-foreground">{exp.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{exp.company} • {exp.type ? `${exp.type} • ` : ''}{exp.duration}</p>
                      <p className="text-sm text-foreground/80 whitespace-pre-line">{exp.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                !showExpForm && <p className="text-sm text-muted-foreground italic text-center py-8">No experience added yet.</p>
              )}
            </div>
          )}

          {/* --- EDUCATION --- */}
          {activeTab === 'education' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <h2 className="text-xl font-bold text-foreground">Education</h2>
                <button onClick={() => {
                  if (showEduForm || eduSelectionMode) {
                    setShowEduForm(false);
                    setEduSelectionMode(false);
                    setEditEduIndex(null);
                    setNewEdu({ level: '', degree: '', institution: '', startMonth: 'Jan', startYear: currentYear.toString(), endMonth: 'Dec', endYear: currentYear.toString(), isCurrent: false, grade: '' });
                  } else {
                    setEduSelectionMode(true);
                  }
                }} className="text-primary text-sm font-medium hover:underline">{showEduForm || eduSelectionMode ? 'Cancel' : '+ Add Education'}</button>
              </div>
              
              {eduSelectionMode && (
                <div className="bg-muted/10 border border-border/50 rounded-xl p-4 my-4">
                  <h4 className="text-sm font-medium text-foreground mb-3">What type of education do you want to add?</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {EDUCATION_LEVELS.filter(level => level === "Other" || !education.some(edu => edu.level === level)).map(level => (
                      <button 
                        key={level}
                        onClick={() => {
                          let initialDegree = level;
                          if (['Other', 'Higher Studies'].includes(level)) initialDegree = '';
                          setNewEdu({ level, degree: initialDegree, degreeBase: '', stream: '', institution: '', startMonth: 'Jan', startYear: currentYear.toString(), endMonth: 'Dec', endYear: currentYear.toString(), isCurrent: false, grade: '' });
                          setEduSelectionMode(false);
                          setShowEduForm(true);
                        }}
                        className="bg-background border border-border/50 hover:border-primary hover:text-primary px-4 py-3 rounded-xl text-sm font-medium transition-colors text-center"
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showEduForm && (
                <div className="bg-muted/10 border border-border/50 rounded-xl p-4 space-y-4 my-4 relative">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-semibold">{newEdu.level || 'Education'}</span>
                  </div>
                  
                  {['Graduation', 'Post Graduation (PG)'].includes(newEdu.level) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Degree</label>
                        <select 
                          value={newEdu.degreeBase || ''}
                          onChange={e => setNewEdu({...newEdu, degreeBase: e.target.value})}
                          className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="" disabled>Select Degree</option>
                          {(newEdu.level === 'Graduation' ? UG_DEGREES : PG_DEGREES).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-foreground">Stream / Specialization</label>
                        <select 
                          value={newEdu.stream || ''}
                          onChange={e => setNewEdu({...newEdu, stream: e.target.value})}
                          className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="" disabled>Select Stream</option>
                          {STREAMS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      {(newEdu.degreeBase === 'Other' || newEdu.stream === 'Other') && (
                        <div className="space-y-1.5 sm:col-span-2 mt-2">
                          <label className="text-xs font-medium text-foreground">Specify Degree & Stream</label>
                          <input 
                            type="text" 
                            placeholder="e.g. B.Voc in Software Development" 
                            value={newEdu.degree} 
                            onChange={e => setNewEdu({...newEdu, degree: e.target.value})} 
                            className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Degree / Stream</label>
                      <input 
                        type="text" 
                        placeholder={['10th', '12th'].includes(newEdu.level) ? "Board / Stream (e.g. CBSE, Science)" : "Degree (e.g. Ph.D in AI)"} 
                        value={newEdu.degree} 
                        onChange={e => setNewEdu({...newEdu, degree: e.target.value})} 
                        className={`w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${!['Other', 'Higher Studies'].includes(newEdu.level) ? 'opacity-70 bg-muted/50 cursor-not-allowed' : ''}`}
                        readOnly={!['Other', 'Higher Studies'].includes(newEdu.level)}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Institution / School</label>
                    <input type="text" placeholder="e.g. National Institute of Technology" value={newEdu.institution} onChange={e => setNewEdu({...newEdu, institution: e.target.value})} className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Duration</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <select value={newEdu.startMonth} onChange={e => setNewEdu({...newEdu, startMonth: e.target.value})} className="bg-background border border-border/50 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <select value={newEdu.startYear} onChange={e => setNewEdu({...newEdu, startYear: e.target.value})} className="bg-background border border-border/50 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                        {futureYears.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      
                      {!newEdu.isCurrent && (
                        <>
                          <select value={newEdu.endMonth} onChange={e => setNewEdu({...newEdu, endMonth: e.target.value})} className="bg-background border border-border/50 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                            {months.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                          <select value={newEdu.endYear} onChange={e => setNewEdu({...newEdu, endYear: e.target.value})} className="bg-background border border-border/50 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                            {futureYears.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </>
                      )}
                      
                      {newEdu.isCurrent && (
                        <div className="col-span-2 flex items-center px-3 bg-muted/30 border border-border/50 rounded-lg text-sm text-foreground">
                          Present
                        </div>
                      )}
                    </div>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer w-fit">
                      <input type="checkbox" checked={newEdu.isCurrent} onChange={e => setNewEdu({...newEdu, isCurrent: e.target.checked})} className="rounded border-border text-primary focus:ring-primary" />
                      <span className="text-xs text-foreground">I currently study here</span>
                    </label>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Grade/CGPA</label>
                    <input type="text" placeholder="e.g. 8.5/10 or 90%" value={newEdu.grade} onChange={e => setNewEdu({...newEdu, grade: e.target.value})} className="w-full bg-background border border-border/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  
                  <button onClick={() => {
                    let finalDegree = newEdu.degree;
                    if (['Graduation', 'Post Graduation (PG)'].includes(newEdu.level)) {
                      if (newEdu.degreeBase && newEdu.stream && newEdu.degreeBase !== 'Other' && newEdu.stream !== 'Other') {
                        finalDegree = `${newEdu.degreeBase} in ${newEdu.stream}`;
                      }
                    }
                    
                    if(finalDegree && newEdu.institution) {
                      const durationStr = `${newEdu.startMonth} ${newEdu.startYear} - ${newEdu.isCurrent ? 'Present' : `${newEdu.endMonth} ${newEdu.endYear}`}`;
                      const eduData = {
                        level: newEdu.level,
                        degree: finalDegree,
                        degreeBase: newEdu.degreeBase,
                        stream: newEdu.stream,
                        institution: newEdu.institution,
                        duration: durationStr,
                        grade: newEdu.grade
                      };
                      if (editEduIndex !== null) {
                        const updated = [...education];
                        updated[editEduIndex] = eduData;
                        setEducation(updated);
                        setEditEduIndex(null);
                      } else {
                        setEducation([...education, eduData]);
                      }
                      setNewEdu({ level: '', degree: '', degreeBase: '', stream: '', institution: '', startMonth: 'Jan', startYear: currentYear.toString(), endMonth: 'Dec', endYear: currentYear.toString(), isCurrent: false, grade: '' });
                      setShowEduForm(false);
                    } else {
                      toast.error('Please fill required fields (Degree/Stream, Institution)');
                    }
                  }} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                    {editEduIndex !== null ? 'Update Education' : 'Add to Profile'}
                  </button>
                </div>
              )}

              {education.length > 0 ? (
                <div className="space-y-4 mt-4">
                  {education.map((edu, i) => (
                    <div key={i} className="border border-border/50 rounded-xl p-5 bg-muted/10 relative group">
                      <div className="absolute top-4 right-4 flex gap-3 opacity-100 transition-opacity">
                        <button onClick={() => {
                          const [start, end] = (edu.duration || '').split(' - ');
                          const [startMonth = 'Jan', startYear = currentYear.toString()] = (start || '').split(' ');
                          let endMonth = 'Dec', endYear = currentYear.toString(), isCurrent = false;
                          if (end === 'Present') {
                            isCurrent = true;
                          } else if (end) {
                            [endMonth, endYear] = end.split(' ');
                          }
                          
                          setNewEdu({
                            level: edu.level || 'Other',
                            degree: edu.degree,
                            degreeBase: edu.degreeBase || '',
                            stream: edu.stream || '',
                            institution: edu.institution,
                            startMonth,
                            startYear,
                            endMonth,
                            endYear,
                            isCurrent,
                            grade: edu.grade
                          });
                          setEditEduIndex(i);
                          setShowEduForm(true);
                          setEduSelectionMode(false);
                        }} className="text-xs font-medium text-blue-500 hover:underline">Edit</button>
                        <button onClick={() => setEducation(education.filter((_, idx) => idx !== i))} className="text-xs font-medium text-destructive hover:underline">Delete</button>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        {edu.level && edu.level !== 'Other' && <span className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">{edu.level}</span>}
                        <h3 className="font-bold text-foreground">{edu.degree}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{edu.institution} • {edu.duration}</p>
                      <p className="text-sm font-medium text-foreground">Grade: {edu.grade}</p>
                    </div>
                  ))}
                </div>
              ) : (
                !showEduForm && <p className="text-sm text-muted-foreground italic text-center py-8">No education added yet.</p>
              )}
            </div>
          )}

          {/* --- SKILLS --- */}
          {activeTab === 'skills' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-foreground border-b border-border/40 pb-4">Skills</h2>
              
              <div className="space-y-4">
                <div className="space-y-2 relative">
                  <label className="text-sm font-medium text-foreground">Add a new skill</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newSkill} 
                      onChange={e => {
                        setNewSkill(e.target.value);
                        setShowSkillDropdown(true);
                      }} 
                      onFocus={() => setShowSkillDropdown(true)}
                      onBlur={() => setTimeout(() => setShowSkillDropdown(false), 200)}
                      onKeyDown={e => { 
                        if(e.key === 'Enter' && newSkill) { 
                          if(!skills.includes(newSkill.trim())) setSkills([...skills, newSkill.trim()]); 
                          setNewSkill(''); 
                          setShowSkillDropdown(false);
                        } 
                      }} 
                      placeholder="e.g. React, Python, MongoDB" 
                      className="flex-1 bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" 
                    />
                    <button onClick={() => { 
                      if(newSkill && !skills.includes(newSkill.trim())) setSkills([...skills, newSkill.trim()]); 
                      setNewSkill(''); 
                      setShowSkillDropdown(false);
                    }} className="bg-primary/10 text-primary hover:bg-primary/20 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">Add</button>
                  </div>
                  
                  {showSkillDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-background border border-border/50 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {POPULAR_SKILLS.filter(s => s.toLowerCase().includes(newSkill.toLowerCase()) && !skills.includes(s)).map((skill, idx) => (
                        <div 
                          key={idx}
                          className="px-3 py-2 text-sm hover:bg-muted cursor-pointer flex items-center justify-between group"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            if(!skills.includes(skill)) setSkills([...skills, skill]);
                            setNewSkill('');
                            setShowSkillDropdown(false);
                          }}
                        >
                          <span>{skill}</span>
                          <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">Add</span>
                        </div>
                      ))}
                      {newSkill.trim() && POPULAR_SKILLS.filter(s => s.toLowerCase().includes(newSkill.toLowerCase()) && !skills.includes(s)).length === 0 && !skills.includes(newSkill.trim()) && (
                        <div 
                          className="px-3 py-2 text-sm text-primary hover:bg-muted cursor-pointer font-medium"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSkills([...skills, newSkill.trim()]);
                            setNewSkill('');
                            setShowSkillDropdown(false);
                          }}
                        >
                          + Add "{newSkill.trim()}" as a custom skill
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Your Top Skills</h4>
                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, i) => (
                        <span key={i} className="bg-muted border border-border/50 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 text-foreground group">
                          {skill}
                          <button 
                            onClick={() => {
                              setNewSkill(skill);
                              setSkills(skills.filter((_, idx) => idx !== i));
                              setShowSkillDropdown(false);
                            }} 
                            className="text-muted-foreground hover:text-blue-500 group-hover:opacity-100 opacity-50 transition-all ml-1"
                            title="Edit Skill"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive group-hover:opacity-100 opacity-50 transition-all">&times;</button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No skills added yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- RESUME/DOCS --- */}
          {activeTab === 'resume' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-foreground border-b border-border/40 pb-4">Resume & Documents</h2>
              
              {/* AI Resume Enhancer Section */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Sparkles className="w-24 h-24 text-primary" />
                </div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-sm">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground">AI Resume Generator</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 max-w-lg">
                    Use our advanced AI to automatically generate a professional, ATS-friendly resume based on your profile details, experience, and skills above. Or let the AI enhance your current resume's bullet points!
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Generate New Resume
                    </button>
                    <button className="bg-background text-foreground border border-border/50 hover:bg-muted px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" /> Enhance Existing
                    </button>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => resumeInputRef.current?.click()}
                className="border-2 border-dashed border-border/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer mt-6 relative"
              >
                <input 
                  type="file" 
                  ref={resumeInputRef} 
                  onChange={handleUploadResume} 
                  accept=".pdf,.doc,.docx" 
                  className="hidden" 
                />
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                    <h3 className="font-bold text-foreground mb-1">Uploading Resume...</h3>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-muted-foreground mb-4" />
                    <h3 className="font-bold text-foreground mb-1">Upload a Custom Resume</h3>
                    <p className="text-sm text-muted-foreground mb-4">Click to browse files (PDF, DOC).</p>
                    <button className="bg-primary/10 text-primary hover:bg-primary/20 px-6 py-2 rounded-xl text-sm font-medium transition-colors">
                      Browse Files
                    </button>
                  </>
                )}
              </div>

              <div className="mt-8 space-y-3">
                <h4 className="text-sm font-bold text-foreground">Your Documents</h4>
                {resumeUrl ? (
                  <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-muted/10 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-500/10 text-red-500 p-2.5 rounded-xl">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">Uploaded Resume</p>
                        <p className="text-xs text-muted-foreground">Click view to open in new tab</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a href={getPdfViewUrl(resumeUrl)} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary hover:underline px-2">View</a>
                      <button onClick={async () => {
                        setResumeUrl('')
                        await user.update({ unsafeMetadata: { ...user.unsafeMetadata, resumeUrl: '' }})
                        toast.success('Resume removed')
                      }} className="text-xs font-medium text-destructive hover:underline px-2">Remove</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No resume uploaded yet.</p>
                )}
              </div>
            </div>
          )}

          {/* --- PRIVACY & SECURITY --- */}
          {activeTab === 'privacy' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-foreground border-b border-border/40 pb-4">Privacy & Security</h2>
              
              <div className="space-y-6">
                <div className="flex gap-4 p-4 bg-muted/30 border border-border/40 rounded-xl">
                  <Shield className="w-5 h-5 text-primary shrink-0" />
                  <div className="w-full">
                    <h4 className="font-semibold text-sm text-foreground">Change Password</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">Update your account password securely using Clerk.</p>
                    <form onSubmit={handleUpdatePassword} className="space-y-3 max-w-sm">
                      <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required placeholder="Current Password" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="New Password" className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                      <button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-70 flex items-center justify-center">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="flex gap-4 p-4 bg-muted/30 border border-border/40 rounded-xl">
                  <Globe className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">Profile Visibility</h4>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">Control who can see your profile on the platform.</p>
                    <select 
                      value={profileVisibility}
                      onChange={(e) => {
                        setProfileVisibility(e.target.value);
                        // Auto-save this setting for better UX
                        fetch(`${API_BASE}/api/users/${user.id}/profile`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ profileVisibility: e.target.value })
                        }).then(() => toast.success('Visibility updated'));
                      }}
                      className="bg-background border border-border/50 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-xs"
                    >
                      <option value="public">Public (Everyone)</option>
                      <option value="restricted">Mentors Only</option>
                      <option value="hidden">Hidden</option>
                    </select>
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
                      className="px-4 py-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground text-sm font-semibold rounded-lg transition-colors"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
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
        message="Are you absolutely sure you want to delete your account? This action cannot be undone."
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

export default Settings
