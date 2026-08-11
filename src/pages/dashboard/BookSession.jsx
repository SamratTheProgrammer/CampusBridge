import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import {
  ChevronLeft, Calendar as CalendarIcon, Clock, Video, FileText, Briefcase,
  GraduationCap, MessageSquare, Star, ChevronRight, Check, CheckCircle2, Globe, MapPin
} from 'lucide-react'
import API_BASE from '../../utils/api'

// Dynamic mentor data will be fetched

const SESSION_TYPES = [
  { id: 'career', title: 'Career Guidance', icon: Briefcase, desc: 'Get advice on your career path and industry trends.' },
  { id: 'resume', title: 'Resume Review', icon: FileText, desc: 'Detailed feedback to make your resume stand out.' },
  { id: 'mock', title: 'Mock Interview', icon: Video, desc: 'Practice technical or behavioral interviews.' },
  { id: 'tech', title: 'Technical Guidance', icon: MessageSquare, desc: 'Help with system design or coding problems.' },
  { id: 'study', title: 'Higher Studies', icon: GraduationCap, desc: 'Guidance for Masters or PhD applications.' },
]

const TIME_SLOTS = {
  Morning: ['09:00 AM', '10:00 AM', '11:30 AM'],
  Afternoon: ['01:00 PM', '02:30 PM', '04:00 PM'],
  Evening: ['06:00 PM', '07:30 PM', '09:00 PM']
}

const DURATIONS = [
  { id: 30, label: '30 Minutes' },
  { id: 45, label: '45 Minutes' },
  { id: 60, label: '60 Minutes' },
]

// Simple Mock Calendar Helper
const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate()
const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay()

const BookSession = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useUser()

  const [step, setStep] = useState(1)
  const [mentor, setMentor] = useState(null)
  const [isLoadingMentor, setIsLoadingMentor] = useState(true)

  useEffect(() => {
    const fetchMentor = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/${id}`)
        if (res.ok) {
          setMentor(await res.json())
        }
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoadingMentor(false)
      }
    }
    if (id) fetchMentor()
  }, [id])

  // Form State
  const [sessionType, setSessionType] = useState(null)
  const [mode, setMode] = useState('Online') // 'Online' | 'Offline'
  const [location, setLocation] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)
  const [duration, setDuration] = useState(30)
  const [message, setMessage] = useState('')
  const [isBooking, setIsBooking] = useState(false)

  // Calendar State
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())

  const handleNext = () => setStep(prev => Math.min(prev + 1, 7))
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1))

  const handleConfirm = async () => {
    if (!user) return;
    setIsBooking(true)
    try {
      const selectedSession = SESSION_TYPES.find(t => t.id === sessionType)
      
      const res = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentClerkId: user.id,
          mentorClerkId: id,
          type: selectedSession?.title || 'General Mentorship',
          mode,
          date: selectedDate,
          time: selectedTime,
          duration,
          location: mode === 'Offline' ? (location || 'Campus Library / Study Center') : '',
          meetingLink: mode === 'Online' ? 'https://meet.google.com/room' : '',
          message
        })
      })

      if (res.ok) {
        navigate(`/dashboard/mentor/${id || 1}/book/success`)
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Failed to book session')
      }
    } catch (err) {
      console.error(err)
      alert('Could not book session')
    } finally {
      setIsBooking(false)
    }
  }

  // Animation variants
  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0
    })
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-in-out"
          style={{ width: `${((step - 1) / 6) * 100}%` }}
        />
      </div>
      {[1, 2, 3, 4, 5, 6, 7].map((s) => (
        <div
          key={s}
          className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
            ${s < step ? 'bg-primary text-primary-foreground' :
              s === step ? 'bg-primary ring-4 ring-primary/20 text-primary-foreground' :
                'bg-muted text-muted-foreground border-2 border-background'}`}
        >
          {s < step ? <Check className="w-4 h-4" /> : s}
        </div>
      ))}
    </div>
  )

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Mentor Information</h2>
            <p className="text-muted-foreground text-sm">Review the mentor's details before proceeding.</p>

            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
              <img src={mentor?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor?.firstName}`} alt={mentor?.firstName} className="w-24 h-24 rounded-full object-cover ring-4 ring-muted" />
              <div className="flex-1">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h3 className="text-xl font-bold text-foreground">{mentor?.firstName} {mentor?.lastName}</h3>
                  {mentor?.company && <span className="px-2 py-0.5 bg-muted text-xs font-semibold rounded-full">{mentor.company}</span>}
                </div>
                <p className="text-sm font-medium text-foreground mb-3">{mentor?.headline || 'Mentor'}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm">
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-semibold">4.9</span>
                    <span className="text-muted-foreground">(128 reviews)</span>
                  </div>
                  <div className="flex items-center gap-1 text-primary">
                    <Video className="w-4 h-4" />
                    <span>Virtual Meeting</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNext}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-primary/25"
              >
                Continue
              </button>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Select Session Type</h2>
            <p className="text-muted-foreground text-sm">What do you want to focus on during this session?</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SESSION_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => { setSessionType(type.id); handleNext(); }}
                  className={`p-4 rounded-xl border transition-all text-left group
                    ${sessionType === type.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border/50 bg-card hover:border-primary/50 hover:bg-muted/50'}`}
                >
                  <type.icon className={`w-8 h-8 mb-3 ${sessionType === type.id ? 'text-primary' : 'text-muted-foreground group-hover:text-primary transition-colors'}`} />
                  <h4 className="font-semibold text-foreground mb-1">{type.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )

      case 3:
        const daysInMonth = getDaysInMonth(currentMonth, currentYear)
        const firstDay = getFirstDayOfMonth(currentMonth, currentYear)
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Select Date</h2>
            <p className="text-muted-foreground text-sm">Choose an available date for your session.</p>

            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm max-w-sm mx-auto">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => currentMonth === 0 ? (setCurrentMonth(11), setCurrentYear(y => y - 1)) : setCurrentMonth(m => m - 1)}
                  className="p-2 rounded-full hover:bg-muted text-muted-foreground"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="font-semibold text-foreground">{monthNames[currentMonth]} {currentYear}</h3>
                <button
                  onClick={() => currentMonth === 11 ? (setCurrentMonth(0), setCurrentYear(y => y + 1)) : setCurrentMonth(m => m + 1)}
                  className="p-2 rounded-full hover:bg-muted text-muted-foreground"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-xs font-medium text-muted-foreground py-2">{d}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dateNum = i + 1
                  const isToday = today.getDate() === dateNum && today.getMonth() === currentMonth && today.getFullYear() === currentYear
                  const isPast = (currentYear < today.getFullYear()) || (currentYear === today.getFullYear() && currentMonth < today.getMonth()) || (currentYear === today.getFullYear() && currentMonth === today.getMonth() && dateNum < today.getDate())
                  const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${dateNum.toString().padStart(2, '0')}`
                  const isSelected = selectedDate === dateStr

                  return (
                    <button
                      key={dateNum}
                      disabled={isPast}
                      onClick={() => {
                        setSelectedDate(dateStr)
                        setTimeout(handleNext, 300)
                      }}
                      className={`
                        w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm transition-all
                        ${isSelected ? 'bg-primary text-primary-foreground font-bold shadow-md shadow-primary/30' : ''}
                        ${!isSelected && !isPast ? 'hover:bg-muted text-foreground' : ''}
                        ${isPast ? 'text-muted-foreground/30 cursor-not-allowed' : ''}
                        ${isToday && !isSelected ? 'text-primary font-bold bg-primary/10' : ''}
                      `}
                    >
                      {dateNum}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Available Time Slots</h2>
            <p className="text-muted-foreground text-sm">Select a time that works best for you.</p>

            <div className="space-y-6">
              {Object.entries(TIME_SLOTS).map(([period, slots]) => (
                <div key={period}>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> {period}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {slots.map(time => (
                      <button
                        key={time}
                        onClick={() => { setSelectedTime(time); handleNext(); }}
                        className={`py-2.5 px-4 rounded-xl border text-sm font-medium transition-all text-center
                          ${selectedTime === time
                            ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                            : 'border-border/50 bg-card hover:border-primary/50 hover:bg-muted text-foreground'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Session Duration</h2>
            <p className="text-muted-foreground text-sm">How long do you want the session to be?</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {DURATIONS.map(dur => (
                <button
                  key={dur.id}
                  onClick={() => { setDuration(dur.id); handleNext(); }}
                  className={`py-4 px-4 rounded-xl border text-center transition-all
                    ${duration === dur.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border/50 bg-card hover:border-primary/50 hover:bg-muted'}`}
                >
                  <Clock className={`w-6 h-6 mx-auto mb-2 ${duration === dur.id ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className={`font-bold ${duration === dur.id ? 'text-primary' : 'text-foreground'}`}>
                    {dur.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )

      case 6:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Session Mode & Details</h2>
            <p className="text-muted-foreground text-sm">Select how you would like to connect with your mentor.</p>

            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* Mode Selection */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">Session Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setMode('Online')}
                    className={`p-4 rounded-xl border flex items-center gap-3 transition-all text-left ${
                      mode === 'Online' 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary text-primary' 
                        : 'border-border/50 bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    <Globe className="w-6 h-6 text-primary shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Online Video Call</h4>
                      <p className="text-xs text-muted-foreground">Virtual 1-on-1 meeting room</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('Offline')}
                    className={`p-4 rounded-xl border flex items-center gap-3 transition-all text-left ${
                      mode === 'Offline' 
                        ? 'border-primary bg-primary/5 ring-1 ring-primary text-primary' 
                        : 'border-border/50 bg-background text-foreground hover:bg-muted'
                    }`}
                  >
                    <MapPin className="w-6 h-6 text-amber-500 shrink-0" />
                    <div>
                      <h4 className="font-bold text-sm text-foreground">Offline Campus Meeting</h4>
                      <p className="text-xs text-muted-foreground">In-person meeting on campus</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Location notes if Offline */}
              {mode === 'Offline' && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-sm font-medium text-foreground mb-2">Preferred Campus Location / Room</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Central Library 2nd Floor / Block A Cafe"
                    className="w-full bg-background border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Message to Mentor (Optional)</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="E.g., I'd like to discuss my recent project and get your feedback on the architecture..."
                  className="w-full bg-background border border-border/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none placeholder:text-muted-foreground"
                ></textarea>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleNext}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-xl font-bold transition-colors shadow-lg shadow-primary/25"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )

      case 7:
        const selectedSession = SESSION_TYPES.find(t => t.id === sessionType)
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Booking Summary</h2>
            <p className="text-muted-foreground text-sm">Review your session details before confirming.</p>

            <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-6">

              <div className="flex items-center gap-4 pb-6 border-b border-border/40">
                <img src={mentor?.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${mentor?.firstName}`} alt={mentor?.firstName} className="w-16 h-16 rounded-full object-cover ring-2 ring-border" />
                <div>
                  <h3 className="font-bold text-foreground">{mentor?.firstName} {mentor?.lastName}</h3>
                  <p className="text-sm text-muted-foreground">{mentor?.headline || 'Mentor'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="text-sm text-muted-foreground">Topic</div>
                  <div className="text-sm font-medium text-foreground text-right">{selectedSession?.title || 'General Mentorship'}</div>
                </div>
                <div className="flex justify-between items-start">
                  <div className="text-sm text-muted-foreground">Session Mode</div>
                  <div className="text-sm font-bold text-foreground text-right flex items-center gap-1.5 justify-end">
                    {mode === 'Offline' ? (
                      <span className="text-amber-500 flex items-center gap-1"><MapPin className="w-4 h-4" /> Offline (In-Person)</span>
                    ) : (
                      <span className="text-primary flex items-center gap-1"><Globe className="w-4 h-4" /> Online (Virtual Video)</span>
                    )}
                  </div>
                </div>
                {mode === 'Offline' && (
                  <div className="flex justify-between items-start">
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div className="text-sm font-medium text-foreground text-right">{location || 'Campus Library / Study Center'}</div>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div className="text-sm font-medium text-foreground text-right">
                    {selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : 'Not selected'}
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div className="text-sm text-muted-foreground">Time</div>
                  <div className="text-sm font-medium text-foreground text-right">{selectedTime || 'Not selected'}</div>
                </div>
                <div className="flex justify-between items-start">
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="text-sm font-medium text-foreground text-right">{duration} Minutes</div>
                </div>
                {message && (
                  <div className="flex justify-between items-start">
                    <div className="text-sm text-muted-foreground">Message</div>
                    <div className="text-sm text-foreground text-right max-w-xs truncate">{message}</div>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-border/40">
                <button
                  onClick={handleConfirm}
                  disabled={!selectedDate || !selectedTime || isBooking}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="w-5 h-5" /> {isBooking ? 'Booking Session...' : 'Confirm Booking'}
                </button>
              </div>

            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 pt-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => step > 1 ? handleBack() : navigate(-1)}
          className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors border border-border/50 bg-card shadow-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Book a Session</h1>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            Step {step} of 7
          </div>
        </div>
      </div>

      {renderStepIndicator()}

      {isLoadingMentor ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={step}
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      )}

    </div>
  )
}

export default BookSession
