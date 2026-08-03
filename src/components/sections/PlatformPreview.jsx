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
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   transition={{ duration: 0.2 }}
                   className="w-full h-full flex flex-col bg-background text-foreground"
                 >
                   <div className="relative w-full h-full overflow-hidden flex flex-col">
                     {/* Top Header */}
                     <div className="h-12 border-b border-border bg-card/80 backdrop-blur flex items-center justify-between px-4">
                       <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                            {React.createElement(tabs.find(t => t.id === activeTab)?.icon || LayoutDashboard, { className: "w-3.5 h-3.5 text-primary" })}
                         </div>
                         <div className="font-semibold text-sm hidden sm:block">CampusBridge {tabs.find(t => t.id === activeTab)?.label}</div>
                       </div>
                       <div className="flex items-center gap-3">
                         <div className="h-2.5 w-16 bg-muted-foreground/20 rounded-full hidden sm:block" />
                         <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                         </div>
                         <div className="w-7 h-7 rounded-full bg-primary/20" />
                       </div>
                     </div>

                     {/* Main Body */}
                     <div className="flex flex-1 overflow-hidden">
                       {/* Sidebar */}
                       <div className="w-14 sm:w-40 border-r border-border bg-card/40 flex flex-col gap-2 p-2.5">
                         {tabs.map((tab) => {
                           const TabIcon = tab.icon;
                           const isActive = tab.id === activeTab;
                           return (
                             <div key={tab.id} className={`h-8 rounded-lg flex items-center justify-center sm:justify-start px-2 gap-3 transition-colors duration-300 ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'}`}>
                               <TabIcon className="w-4 h-4 shrink-0" />
                               <div className={`hidden sm:block h-2 w-16 rounded-full ${isActive ? 'bg-primary/40' : 'bg-muted-foreground/30'}`} />
                             </div>
                           )
                         })}
                       </div>

                       {/* Content Area */}
                       <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden bg-background/50">
                         {/* Stats Row */}
                         <div className="grid grid-cols-3 gap-3">
                           {[1, 2, 3].map(i => (
                             <div key={i} className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col gap-2">
                               <div className="h-2 w-10 sm:w-16 bg-muted-foreground/30 rounded-full" />
                               <div className="h-4 sm:h-6 w-12 sm:w-20 bg-foreground/80 rounded" />
                             </div>
                           ))}
                         </div>

                         {/* Charts Row */}
                         <div className="flex-1 flex gap-3">
                           <div className="flex-[2] bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col relative overflow-hidden">
                             <div className="h-3 w-20 sm:w-32 bg-muted-foreground/30 rounded-full mb-4" />
                             <div className="flex-1 border-b border-l border-border flex items-end gap-1.5 sm:gap-2 pb-1 pl-1">
                               {[40, 70, 45, 90, 65, 80, 55, 30, 85, 60].map((h, i) => (
                                 <div key={i} className="flex-1 bg-gradient-to-t from-primary/80 to-primary/30 rounded-t-sm" style={{ height: `${h}%` }} />
                               ))}
                             </div>
                           </div>
                           
                           <div className="flex-1 bg-card border border-border rounded-xl p-3 sm:p-4 shadow-sm flex flex-col gap-4 hidden md:flex">
                             <div className="h-3 w-20 bg-muted-foreground/30 rounded-full" />
                             <div className="flex flex-col gap-3">
                               {[1, 2, 3, 4].map(i => (
                                 <div key={i} className="flex gap-2 items-center">
                                   <div className="w-8 h-8 rounded-full bg-muted-foreground/20 shrink-0" />
                                   <div className="flex flex-col gap-1.5 flex-1">
                                     <div className="h-2 w-full bg-foreground/40 rounded-full" />
                                     <div className="h-1.5 w-2/3 bg-muted-foreground/30 rounded-full" />
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
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
