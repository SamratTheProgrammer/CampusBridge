import React from 'react'
import { Edit3, MapPin, Briefcase, GraduationCap, Link as LinkIcon, Calendar, Code } from 'lucide-react'

const MentorProfilePage = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Profile Card */}
      <div className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        <div className="h-48 bg-muted relative">
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
            alt="Cover" 
            className="w-full h-full object-cover"
          />
          <button className="absolute top-4 right-4 bg-background/50 backdrop-blur border border-border/50 text-foreground p-2 rounded-xl hover:bg-background/80 transition-colors">
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-start -mt-16 sm:-mt-20 mb-4">
            <img 
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" 
              alt="Profile" 
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl object-cover border-4 border-card relative z-10 bg-card shadow-md"
            />
            <div className="flex-1 w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-1 sm:mt-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Rohit Sharma</h1>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">Senior Software Engineer at Amazon</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                  <MapPin className="w-3.5 h-3.5" /> Bangalore, India &bull; 123 Main St, Bangalore &bull; <Calendar className="w-3.5 h-3.5" /> Joined Oct 2024
                </div>
              </div>
              <button className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/90 transition-all shadow-sm w-full sm:w-auto justify-center">
                <Edit3 className="w-4 h-4" /> Edit Profile
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border/40">
            <a href="#" className="flex items-center gap-2 bg-muted/50 hover:bg-muted text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-border/50">
              <Briefcase className="w-4 h-4 text-[#0A66C2]" /> LinkedIn
            </a>
            <a href="#" className="flex items-center gap-2 bg-muted/50 hover:bg-muted text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-border/50">
              <Code className="w-4 h-4" /> GitHub
            </a>
            <a href="#" className="flex items-center gap-2 bg-muted/50 hover:bg-muted text-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-border/50">
              <LinkIcon className="w-4 h-4 text-muted-foreground" /> Portfolio
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column - Details */}
        <div className="md:col-span-2 space-y-6">
          
          {/* About */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">About Me</h3>
            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
              Passionate software engineer with 6+ years of experience building scalable backend systems. I specialize in distributed architectures, microservices, and high-performance APIs. 
              
              Currently leading a team at Amazon focusing on supply chain optimization. I enjoy mentoring students and helping them crack interviews at top tech companies. Let's connect if you need guidance on system design, resume reviews, or career progression!
            </p>
          </div>

          {/* Experience */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-6">Experience</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 border border-border/50">
                  <Briefcase className="w-6 h-6 text-foreground/70" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm sm:text-base">Senior Software Engineer</h4>
                  <p className="text-sm text-foreground/80 mt-0.5">Amazon</p>
                  <p className="text-xs text-muted-foreground mt-1">Jan 2022 - Present • Bangalore, India</p>
                  <p className="text-sm text-foreground/70 mt-3 leading-relaxed">
                    Leading the backend architecture for supply chain optimization. Designed scalable microservices using AWS, Java, and DynamoDB.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 border border-border/50">
                  <Briefcase className="w-6 h-6 text-foreground/70" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm sm:text-base">Software Engineer II</h4>
                  <p className="text-sm text-foreground/80 mt-0.5">Microsoft</p>
                  <p className="text-xs text-muted-foreground mt-1">Jul 2019 - Dec 2021 • Hyderabad, India</p>
                  <p className="text-sm text-foreground/70 mt-3 leading-relaxed">
                    Worked on the Azure core infrastructure team. Implemented real-time monitoring solutions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Education */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-6">Education</h3>
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 border border-border/50">
                <GraduationCap className="w-6 h-6 text-foreground/70" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-sm sm:text-base">B.Tech in Computer Science</h4>
                <p className="text-sm text-foreground/80 mt-0.5">Indian Institute of Technology (IIT), Kharagpur</p>
                <p className="text-xs text-muted-foreground mt-1">2015 - 2019</p>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          
          {/* Skills */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-4">Skills & Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {['System Design', 'Java', 'AWS', 'Microservices', 'Distributed Systems', 'Python', 'Go', 'Mentorship'].map(skill => (
                <span key={skill} className="bg-muted text-muted-foreground text-xs font-medium px-3 py-1.5 rounded-lg border border-border/50">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Mentorship Info */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-foreground mb-4">Mentorship Details</h3>
            <ul className="space-y-4">
              <li>
                <span className="block text-xs text-muted-foreground font-medium mb-1">Mentoring Style</span>
                <span className="text-sm text-foreground">Direct, practical, project-oriented.</span>
              </li>
              <li>
                <span className="block text-xs text-muted-foreground font-medium mb-1">Availability</span>
                <span className="text-sm text-foreground">Weekends, 4 PM - 7 PM</span>
              </li>
              <li>
                <span className="block text-xs text-muted-foreground font-medium mb-1">Target Audience</span>
                <span className="text-sm text-foreground">Pre-final / Final year students aiming for FAANG.</span>
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  )
}

export default MentorProfilePage

