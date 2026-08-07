import React from 'react'
import { MapPin, Mail, CheckCircle2, MessageSquare, UserPlus, Briefcase, GraduationCap } from 'lucide-react'

const MentorProfile = () => {
  return (
    <div className="max-w-5xl mx-auto pb-8">
      {/* Cover & Header Section */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden mb-6 shadow-sm">
        <div className="h-48 sm:h-64 w-full bg-muted relative">
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16 sm:-mt-20 mb-6">
            <div className="flex items-end gap-5">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&w=250&q=80" 
                  alt="Arjun Mehta" 
                  className="w-32 h-32 sm:w-40 sm:h-40 rounded-full object-cover border-4 border-card relative z-10 bg-card"
                />
              </div>
              <div className="mb-2 sm:mb-4 relative z-10 pt-16 sm:pt-0">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Arjun Mehta</h1>
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">Software Engineer at Google</p>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Bangalore, India <span className="w-1 h-1 rounded-full bg-muted-foreground"></span> 2018 Batch (CSE)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" className="h-8 hidden sm:block opacity-50 grayscale" />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
              <UserPlus className="w-4 h-4" /> Connect
            </button>
            <button className="bg-background border border-border/50 text-foreground hover:bg-muted px-6 py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-2 shadow-sm">
              <MessageSquare className="w-4 h-4" /> Message
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex overflow-x-auto hide-scrollbar gap-6 border-b border-border/40 mb-6 px-2">
            <button className="pb-3 text-sm font-semibold text-primary border-b-2 border-primary whitespace-nowrap">About</button>
            <button className="pb-3 text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap">Experience</button>
            <button className="pb-3 text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap">Education</button>
            <button className="pb-3 text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap">Skills</button>
            <button className="pb-3 text-sm font-medium text-muted-foreground hover:text-foreground whitespace-nowrap">Posts</button>
          </div>

          {/* About Section */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">About</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Passionate software engineer with 5+ years of experience in building scalable web applications. 
              Love mentoring students and helping them grow. Currently working on Google Cloud Platform infrastructure.
              Always open to discussing system design, open-source, and career transitions.
            </p>
          </div>

          {/* Contact Details */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <Mail className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Email</p>
                  <a href="#" className="text-sm text-primary hover:underline">arjun.mehta@gmail.com</a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Location</p>
                  <p className="text-sm text-foreground">Bangalore, India</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <svg className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">LinkedIn</p>
                  <a href="#" className="text-sm text-primary hover:underline">linkedin.com/in/arjunmehta</a>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <svg className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">GitHub</p>
                  <a href="#" className="text-sm text-primary hover:underline">github.com/arjunmehta</a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-6">
          {/* Skills */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-medium">JavaScript</span>
              <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-medium">React</span>
              <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-medium">Node.js</span>
              <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-medium">System Design</span>
              <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-medium">MongoDB</span>
              <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-medium">AWS</span>
              <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-medium">Docker</span>
              <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-3 py-1.5 rounded-lg text-xs font-medium">Git</span>
            </div>
          </div>

          {/* Interests */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">Interests</h2>
            <div className="flex flex-wrap gap-2">
              <span className="bg-muted text-muted-foreground border border-border/50 px-3 py-1.5 rounded-lg text-xs font-medium">Mentoring</span>
              <span className="bg-muted text-muted-foreground border border-border/50 px-3 py-1.5 rounded-lg text-xs font-medium">Open Source</span>
              <span className="bg-muted text-muted-foreground border border-border/50 px-3 py-1.5 rounded-lg text-xs font-medium">Photography</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default MentorProfile
