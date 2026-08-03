import React, { useState } from 'react'
import { User, Briefcase, GraduationCap, Code, FileText, CheckCircle2, Save, Upload, Sparkles, Loader2 } from 'lucide-react'

const Settings = () => {
  const [activeTab, setActiveTab] = useState('basic')

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Code },
    { id: 'resume', label: 'Resume/Docs', icon: FileText },
  ]

  // Mock progress
  const completionPercentage = 75

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-6">
      
      {/* Header & Progress */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">Profile Settings</h1>
        
        <div className="bg-card border border-border/50 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-foreground">Profile Completion</h3>
              <span className="text-primary font-bold">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div 
                className="bg-primary h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Complete your profile to stand out to recruiters and alumni mentors.
            </p>
          </div>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm shrink-0 flex items-center gap-2">
            <Save className="w-4 h-4" /> Save All Changes
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        
        {/* Left Sidebar (Tabs) */}
        <div className="w-full md:w-64 bg-card border border-border/50 rounded-2xl p-4 shadow-sm shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all text-left whitespace-nowrap shrink-0
                ${activeTab === tab.id 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
            >
              <tab.icon className="w-5 h-5 shrink-0" />
              <span>{tab.label}</span>
              {/* Green checkmark if completed (mock logic) */}
              {['basic', 'education', 'skills'].includes(tab.id) && (
                <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto hidden md:block" />
              )}
            </button>
          ))}
        </div>

        {/* Right Content Area (Forms) */}
        <div className="flex-1 w-full bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-sm min-h-[500px]">
          
          {/* --- BASIC INFO --- */}
          {activeTab === 'basic' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-foreground border-b border-border/40 pb-4">Basic Information</h2>
              
              <div className="flex items-center gap-6 mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80" 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover border border-border/50"
                />
                <button className="bg-muted text-foreground hover:bg-muted/80 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-border/50">
                  Change Photo
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">First Name</label>
                  <input type="text" defaultValue="Samrat" className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Last Name</label>
                  <input type="text" defaultValue="Saha" className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">Headline (Tagline)</label>
                  <input type="text" defaultValue="MCA Student | Seeking SDE Internships" className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Location</label>
                  <input type="text" defaultValue="Kolkata, India" className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Contact Email</label>
                  <input type="email" defaultValue="samrat.saha@example.com" className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-foreground">About Me</label>
                  <textarea rows="4" className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" defaultValue="Passionate software developer focusing on building scalable web applications. Open to learning new technologies and currently exploring React and Node.js."></textarea>
                </div>
              </div>
            </div>
          )}

          {/* --- EXPERIENCE --- */}
          {activeTab === 'experience' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <h2 className="text-xl font-bold text-foreground">Experience</h2>
                <button className="text-primary text-sm font-medium hover:underline">+ Add Experience</button>
              </div>
              
              <div className="border border-border/50 rounded-xl p-5 bg-muted/10 relative group">
                <button className="absolute top-4 right-4 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">Edit</button>
                <h3 className="font-bold text-foreground">Web Developer Intern</h3>
                <p className="text-sm text-muted-foreground mb-3">Tech Solutions Inc. • Jun 2023 - Aug 2023</p>
                <ul className="list-disc pl-5 text-sm text-foreground/80 space-y-1">
                  <li>Developed responsive UI components using React and Tailwind CSS.</li>
                  <li>Improved page load speed by 20% through image optimization.</li>
                  <li>Collaborated with the backend team to integrate REST APIs.</li>
                </ul>
              </div>
            </div>
          )}

          {/* --- EDUCATION --- */}
          {activeTab === 'education' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <h2 className="text-xl font-bold text-foreground">Education</h2>
                <button className="text-primary text-sm font-medium hover:underline">+ Add Education</button>
              </div>
              
              <div className="border border-border/50 rounded-xl p-5 bg-muted/10 relative group">
                <button className="absolute top-4 right-4 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">Edit</button>
                <h3 className="font-bold text-foreground">Master of Computer Applications (MCA)</h3>
                <p className="text-sm text-muted-foreground mb-1">National Institute of Technology • 2022 - 2024</p>
                <p className="text-sm font-medium text-foreground">CGPA: 8.5/10</p>
              </div>

              <div className="border border-border/50 rounded-xl p-5 bg-muted/10 relative group">
                <button className="absolute top-4 right-4 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">Edit</button>
                <h3 className="font-bold text-foreground">Bachelor of Computer Applications (BCA)</h3>
                <p className="text-sm text-muted-foreground mb-1">State University • 2019 - 2022</p>
                <p className="text-sm font-medium text-foreground">CGPA: 8.2/10</p>
              </div>
            </div>
          )}

          {/* --- SKILLS --- */}
          {activeTab === 'skills' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-foreground border-b border-border/40 pb-4">Skills</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Add a new skill</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="e.g. React, Python, Data Analysis" className="flex-1 bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm text-foreground transition-all" />
                    <button className="bg-primary/10 text-primary hover:bg-primary/20 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">Add</button>
                  </div>
                </div>

                <div className="pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Your Top Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {['JavaScript', 'React.js', 'Node.js', 'Tailwind CSS', 'MongoDB', 'Git', 'Java', 'C++'].map(skill => (
                      <span key={skill} className="bg-muted border border-border/50 px-4 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 text-foreground group">
                        {skill}
                        <button className="text-muted-foreground hover:text-destructive group-hover:opacity-100 opacity-50 transition-all">&times;</button>
                      </span>
                    ))}
                  </div>
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

              <div className="border-2 border-dashed border-border/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer mt-6">
                <Upload className="w-10 h-10 text-muted-foreground mb-4" />
                <h3 className="font-bold text-foreground mb-1">Upload a Custom Resume</h3>
                <p className="text-sm text-muted-foreground mb-4">Drag and drop your PDF here, or click to browse files.</p>
                <button className="bg-primary/10 text-primary hover:bg-primary/20 px-6 py-2 rounded-xl text-sm font-medium transition-colors">
                  Browse Files
                </button>
              </div>

              <div className="mt-8 space-y-3">
                <h4 className="text-sm font-bold text-foreground">Your Documents</h4>
                <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-muted/10 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-500/10 text-red-500 p-2.5 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">Samrat_Saha_Resume.pdf</p>
                      <p className="text-xs text-muted-foreground">Uploaded on 2 May 2024 • 1.2 MB</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs font-medium text-primary hover:underline px-2">Download</button>
                    <button className="text-xs font-medium text-destructive hover:underline px-2">Delete</button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-primary/30 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/20 text-primary p-2.5 rounded-xl">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-foreground">AI_Generated_Resume.pdf</p>
                        <span className="bg-primary text-primary-foreground text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md">New</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Generated today • 0.8 MB</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs font-medium text-primary hover:underline px-2">View</button>
                    <button className="text-xs font-medium text-destructive hover:underline px-2">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Settings
