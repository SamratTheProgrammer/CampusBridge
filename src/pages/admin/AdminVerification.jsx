import React, { useState } from 'react'
import { Check, X, FileText, ExternalLink, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminVerification = () => {
  const [activeTab, setActiveTab] = useState('Pending')
  const [verifications, setVerifications] = useState([
    { 
      id: 1, 
      name: 'Rohit Kumar', 
      email: 'rohit@gmail.com', 
      company: 'Google', 
      role: 'Software Engineer', 
      gradYear: '2020', 
      experience: '4+ years', 
      status: 'Pending',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&w=150&q=80'
    },
    { 
      id: 2, 
      name: 'Neha Agarwal', 
      email: 'neha@gmail.com', 
      company: 'Microsoft', 
      role: 'Product Manager', 
      gradYear: '2019', 
      experience: '5+ years', 
      status: 'Pending',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&w=150&q=80'
    },
    { 
      id: 3, 
      name: 'Karan Sharma', 
      email: 'karan.s@gmail.com', 
      company: 'Amazon', 
      role: 'Cloud Architect', 
      gradYear: '2018', 
      experience: '6+ years', 
      status: 'Approved',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=150&q=80'
    },
    { 
      id: 4, 
      name: 'Shreya Roy', 
      email: 'shreya.r@gmail.com', 
      company: 'Adobe', 
      role: 'UX Designer', 
      gradYear: '2021', 
      experience: '3+ years', 
      status: 'Rejected',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&w=150&q=80'
    }
  ])

  const handleAction = (id, newStatus, name) => {
    setVerifications(verifications.map(v => {
      if (v.id === id) {
        return { ...v, status: newStatus }
      }
      return v
    }))
    if (newStatus === 'Approved') {
      toast.success(`${name} has been successfully verified!`)
    } else {
      toast.error(`${name}'s verification was rejected.`)
    }
  }

  const counts = {
    Pending: verifications.filter(v => v.status === 'Pending').length,
    Approved: verifications.filter(v => v.status === 'Approved').length,
    Rejected: verifications.filter(v => v.status === 'Rejected').length,
  }

  const currentList = verifications.filter(v => v.status === activeTab)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Alumni Verification</h1>
        <p className="text-muted-foreground text-sm mt-1">Verify credentials, work profiles, and graduation documentation submitted by alumni.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border/50 gap-2">
        {['Pending', 'Approved', 'Rejected'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold border-b-2 px-4 transition-all relative ${
              activeTab === tab 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab} <span className="text-[10px] ml-1 bg-muted px-2 py-0.5 rounded-full border border-border/40 font-semibold">{counts[tab]}</span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {currentList.length > 0 ? (
          currentList.map((alumni) => (
            <div key={alumni.id} className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
              <div className="flex gap-4">
                <img 
                  src={alumni.image} 
                  alt={alumni.name} 
                  className="w-14 h-14 rounded-full object-cover border border-border/40" 
                />
                <div className="space-y-1">
                  <h3 className="font-bold text-foreground flex items-center gap-1.5">
                    {alumni.name}
                    {alumni.status === 'Approved' && <ShieldCheck className="w-4.5 h-4.5 text-emerald-500 fill-emerald-500/10" />}
                  </h3>
                  <p className="text-xs text-muted-foreground">{alumni.email}</p>
                  <p className="text-xs font-semibold text-foreground bg-muted inline-block px-2.5 py-1 rounded-lg border border-border/50">
                    {alumni.role} at {alumni.company}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border/40 text-xs">
                <div>
                  <span className="text-muted-foreground block mb-0.5">Graduated</span>
                  <span className="font-bold text-foreground">{alumni.gradYear}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-0.5">Experience</span>
                  <span className="font-bold text-foreground">{alumni.experience}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button className="flex-1 px-4 py-2 border border-border/60 hover:bg-muted text-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> View Profile
                </button>

                {alumni.status === 'Pending' && (
                  <>
                    <button 
                      onClick={() => handleAction(alumni.id, 'Approved', alumni.name)}
                      className="px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/10"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button 
                      onClick={() => handleAction(alumni.id, 'Rejected', alumni.name)}
                      className="px-4 py-2 bg-rose-500 text-white hover:bg-rose-600 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-rose-500/10"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-16 text-center text-muted-foreground bg-card border border-border/50 rounded-2xl">
            No records inside {activeTab}.
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminVerification
