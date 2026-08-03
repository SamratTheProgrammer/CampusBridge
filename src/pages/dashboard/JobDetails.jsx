import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bookmark, Share2 } from 'lucide-react'

const JobDetails = () => {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Top Nav */}
      <div className="flex items-center justify-between">
        <Link to="/dashboard/jobs" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Jobs
        </Link>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-card border border-border/50 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
            <Bookmark className="w-4 h-4" /> Save
          </button>
          <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-card border border-border/50 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>

      <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-xl border border-border/50 bg-background flex items-center justify-center p-3 shrink-0">
              <img src="https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" alt="Microsoft" className="max-w-full max-h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Frontend Developer</h1>
              <p className="text-sm font-medium text-muted-foreground">Microsoft</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                <span>Full-time</span> <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span> <span>Remote</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8 pb-8 border-b border-border/40">
          <p className="text-xs text-muted-foreground">Posted on 2 May 2024</p>
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-2.5 rounded-xl font-medium transition-colors shadow-sm">
            Apply Now
          </button>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Job Description</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We are looking for a passionate Frontend Developer to build amazing user experiences for our web applications. 
              You will work closely with designers and backend engineers to turn wireframes into responsive, highly optimized, 
              and accessible web components.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Requirements</h2>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
              <li className="pl-1">3+ years of experience in React.js</li>
              <li className="pl-1">Strong knowledge of JavaScript, HTML, CSS</li>
              <li className="pl-1">Experience with state management (Redux, Context API)</li>
              <li className="pl-1">Good problem solving skills</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-4 py-1.5 rounded-lg text-sm font-medium">React</span>
              <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-4 py-1.5 rounded-lg text-sm font-medium">JavaScript</span>
              <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-4 py-1.5 rounded-lg text-sm font-medium">HTML</span>
              <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-4 py-1.5 rounded-lg text-sm font-medium">CSS</span>
              <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 px-4 py-1.5 rounded-lg text-sm font-medium">Redux</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default JobDetails
