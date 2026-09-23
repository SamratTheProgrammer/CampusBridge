import React, { useState } from 'react'
import { Download, Smartphone, Apple, ShieldCheck, Bell, Video, MessageSquare, QrCode, CheckCircle, ExternalLink, X, ArrowDownToLine } from 'lucide-react'

const AppDownloadSection = () => {
  const [showIosModal, setShowIosModal] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const downloadUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/downloads/CampusBridge.apk` 
    : '/downloads/CampusBridge.apk'

  const handleCopyLink = () => {
    navigator.clipboard.writeText(downloadUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <section id="download-app" className="py-20 sm:py-28 relative overflow-hidden bg-background">
      {/* Decorative Glows */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-purple-600/10 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-gradient-to-br from-card/90 via-card/70 to-card/90 border border-border/80 rounded-3xl p-6 sm:p-10 md:p-14 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">
                <Smartphone className="w-3.5 h-3.5" />
                <span>CampusBridge on Mobile</span>
              </div>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
                Your Campus Network, Mentors & Career —{' '}
                <span className="bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">
                  Right in Your Pocket
                </span>
              </h2>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                Experience CampusBridge natively on your phone. Stay connected with students, alumni, and industry mentors with high-definition audio & video calls, instant push notifications, and real-time chat.
              </p>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                  <div className="p-2 rounded-lg bg-purple-500/15 text-purple-500 shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground">Instant Push Alerts</h4>
                    <p className="text-[11px] text-muted-foreground">Never miss messages, mentorship requests, or call invites.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                  <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-500 shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground">WebRTC Video & Audio</h4>
                    <p className="text-[11px] text-muted-foreground">Crystal-clear 1-on-1 mentorship calling with zero latency.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                  <div className="p-2 rounded-lg bg-pink-500/15 text-pink-500 shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground">Voice Notes & Sharing</h4>
                    <p className="text-[11px] text-muted-foreground">Send voice notes, share student profiles, and react live.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                  <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-500 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-foreground">100% Native & Secure</h4>
                    <p className="text-[11px] text-muted-foreground">Powered by Capacitor with gesture navigation & safe-areas.</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* Android APK Download Button */}
                <a
                  href="/downloads/CampusBridge.apk"
                  download="CampusBridge.apk"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-3.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold shadow-lg shadow-purple-500/25 hover:shadow-xl transition-all active:scale-95 group text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                    <ArrowDownToLine className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-purple-100 uppercase tracking-wider">Download for</span>
                    <span className="text-base font-extrabold leading-none mt-0.5">Android APK</span>
                  </div>
                </a>

                {/* iOS Download Button */}
                <button
                  type="button"
                  onClick={() => setShowIosModal(true)}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-3.5 px-6 py-3.5 rounded-2xl bg-card border-2 border-border/80 hover:border-purple-500/50 hover:bg-muted/60 text-foreground font-bold shadow-md transition-all active:scale-95 group text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-foreground/10 flex items-center justify-center text-foreground shrink-0 group-hover:scale-110 transition-transform">
                    <Apple className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Download for</span>
                    <span className="text-base font-extrabold leading-none mt-0.5">iOS / iPhone</span>
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Version 1.0.0
                </span>
                <span>&bull;</span>
                <span>Android 8.0+ & iOS 14.0+</span>
                <span>&bull;</span>
                <button 
                  onClick={handleCopyLink} 
                  className="hover:text-primary transition-colors underline cursor-pointer"
                >
                  {copiedLink ? '✓ Copied APK link!' : 'Copy download link'}
                </button>
              </div>
            </div>

            {/* Right Phone Mockup Column */}
            <div className="lg:col-span-5 flex justify-center relative">
              {/* Floating Native Feature Badges */}
              <div className="absolute -top-3 -left-4 sm:left-4 z-20 bg-card/95 border border-purple-500/40 rounded-2xl p-2.5 shadow-xl backdrop-blur-md flex items-center gap-2.5 animate-bounce [animation-duration:4s]">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-500 flex items-center justify-center font-bold text-xs">
                  ⚡
                </div>
                <div className="text-left pr-2">
                  <p className="text-[11px] font-bold text-foreground leading-tight">100% Native Feel</p>
                  <p className="text-[9px] text-muted-foreground leading-tight">Capacitor Powered</p>
                </div>
              </div>

              <div className="absolute -bottom-3 -right-4 sm:right-4 z-20 bg-card/95 border border-indigo-500/40 rounded-2xl p-2.5 shadow-xl backdrop-blur-md flex items-center gap-2.5 animate-bounce [animation-duration:5s]">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xs">
                  🎥
                </div>
                <div className="text-left pr-2">
                  <p className="text-[11px] font-bold text-foreground leading-tight">WebRTC Calling</p>
                  <p className="text-[9px] text-muted-foreground leading-tight">Video & Voice Mentorship</p>
                </div>
              </div>

              {/* Smartphone Frame Mockup */}
              <div className="w-[280px] sm:w-[310px] rounded-[42px] p-3 bg-slate-100 dark:bg-zinc-900 border-4 border-slate-300/80 dark:border-zinc-700/60 shadow-2xl shadow-purple-500/10 dark:shadow-2xl relative overflow-hidden transition-colors duration-300">
                {/* Speaker & Camera Notch */}
                <div className="w-24 h-4 bg-slate-200 dark:bg-zinc-800 rounded-full mx-auto mb-2 flex items-center justify-center gap-2 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-slate-400 dark:bg-zinc-700" />
                  <div className="w-8 h-1 bg-slate-300 dark:bg-zinc-700 rounded-full" />
                </div>

                {/* Mobile Screen Simulator */}
                <div className="bg-white dark:bg-zinc-950 rounded-[30px] overflow-hidden border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white p-3.5 space-y-3 relative font-sans text-xs shadow-inner transition-colors duration-300">
                  {/* Status Bar */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-zinc-400 px-1 pt-0.5">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">9:41</span>
                    <div className="flex items-center gap-1">
                      <span>5G</span>
                      <span>100%</span>
                    </div>
                  </div>

                  {/* App Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-zinc-800 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                        CB
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-zinc-100 text-xs leading-none">CampusBridge</p>
                        <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium leading-tight mt-0.5">• Online</p>
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-300">
                      <Bell className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Active Chat Item */}
                  <div className="space-y-2">
                    <div className="bg-purple-50/90 dark:bg-purple-950/60 border border-purple-200/90 dark:border-purple-500/30 rounded-xl p-2.5 shadow-xs">
                      <div className="flex items-center gap-2">
                        <img 
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" 
                          alt="Mentor" 
                          className="w-7 h-7 rounded-full object-cover ring-1 ring-purple-400"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-900 dark:text-zinc-100 truncate">Dr. Sarah Johnson</p>
                          <p className="text-[9px] text-purple-600 dark:text-purple-300 font-medium">Senior AI Mentor</p>
                        </div>
                        <span className="text-[8px] bg-purple-200/80 dark:bg-purple-500/30 text-purple-800 dark:text-purple-300 px-1.5 py-0.5 rounded font-bold uppercase">ALUMNI</span>
                      </div>
                      <p className="text-[10px] text-slate-700 dark:text-zinc-300 mt-2 bg-white/95 dark:bg-purple-900/40 p-1.5 rounded-lg border border-purple-200/80 dark:border-purple-500/20 shadow-xs">
                        "Your resume looks great! Let's do a quick video call at 4 PM to review."
                      </p>
                    </div>

                    {/* Voice Note Simulation */}
                    <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-[9px]">
                        ▶
                      </div>
                      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="w-2/3 h-full bg-gradient-to-r from-purple-500 to-indigo-500" />
                      </div>
                      <span className="text-[9px] font-mono text-slate-500 dark:text-zinc-400">0:14</span>
                    </div>

                    {/* Call Incoming Simulation */}
                    <div className="bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Video className="w-3 h-3" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-900 dark:text-zinc-100 leading-none">Mentorship Session</p>
                          <p className="text-[8px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">Incoming WebRTC Video...</p>
                        </div>
                      </div>
                      <span className="text-[9px] bg-emerald-500 hover:bg-emerald-600 text-white dark:text-black font-bold px-2 py-0.5 rounded-md shadow-xs transition-colors">
                        Accept
                      </span>
                    </div>
                  </div>

                  {/* Bottom Navigation Mockup */}
                  <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex justify-around text-slate-400 dark:text-zinc-500 text-[10px]">
                    <span className="text-purple-600 dark:text-purple-400 font-bold">Home</span>
                    <span>Chat</span>
                    <span>Mentors</span>
                    <span>Jobs</span>
                    <span>Profile</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* iOS Modal Guide */}
      {showIosModal && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-border/70 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
              <Apple className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-bold text-foreground mb-2">CampusBridge for iOS</h3>
            <p className="text-sm text-muted-foreground mb-4">
              CampusBridge for iPhone & iPad is currently distributed via Apple TestFlight beta and Progressive Web App.
            </p>

            <div className="space-y-3 bg-muted/30 p-4 rounded-2xl border border-border/50 text-xs mb-5">
              <p className="font-semibold text-foreground">Option 1: Add to Home Screen (Instant App Experience)</p>
              <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
                <li>Open this site on your iPhone Safari browser.</li>
                <li>Tap the <strong>Share</strong> button at the bottom of Safari.</li>
                <li>Select <strong>Add to Home Screen</strong>.</li>
              </ol>

              <div className="border-t border-border/40 my-2 pt-2">
                <p className="font-semibold text-foreground">Option 2: TestFlight Native Beta</p>
                <p className="text-muted-foreground mt-0.5">Contact campus administrator or click below to join the TestFlight preview build.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowIosModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
              <a
                href="/downloads/CampusBridge.apk"
                download="CampusBridge.apk"
                className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md"
              >
                <Download className="w-3.5 h-3.5" /> Get Android APK
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AppDownloadSection
