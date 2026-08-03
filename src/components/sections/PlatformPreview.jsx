import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Users, Briefcase, MessageSquare, GraduationCap, Calendar } from 'lucide-react'

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'directory', label: 'Directory', icon: Users },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'mentorship', label: 'Mentorship', icon: GraduationCap },
  { id: 'events', label: 'Events', icon: Calendar },
]

const PlatformPreview = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].id)

  return (
    <section className="py-24 overflow-hidden bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">See It In Action</h2>
          <p className="text-lg text-muted-foreground">
            A beautifully designed platform that makes connecting and growing intuitive and effortless.
          </p>
        </div>

        {/* Custom Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md scale-105' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Carousel Preview */}
        <div className="relative max-w-5xl mx-auto">
          {/* Decorative background glow */}
          <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full -z-10" />
          
          <div className="border bg-card/50 backdrop-blur-sm rounded-2xl md:rounded-[2rem] p-2 md:p-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-4 left-6 flex gap-2 z-10 hidden md:flex">
               <div className="w-3 h-3 rounded-full bg-red-500/80" />
               <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
               <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <div className="aspect-[16/10] bg-background border rounded-xl overflow-hidden relative mt-8 md:mt-0">
               <AnimatePresence mode="wait">
                 <motion.div
                   key={activeTab}
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 1.02 }}
                   transition={{ duration: 0.3 }}
                   className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-muted/30"
                 >
                   <LayoutDashboard className="w-16 h-16 mb-4 opacity-20" />
                   <h3 className="text-xl font-bold uppercase tracking-wider opacity-50">{activeTab} UI Preview</h3>
                   <p className="mt-2 text-sm opacity-50">Imagine a beautiful {activeTab} interface here</p>
                 </motion.div>
               </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PlatformPreview
