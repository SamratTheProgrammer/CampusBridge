import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, MessageSquare, Users, BookOpen, Calendar, Plus, Check, ArrowRight, 
  Eye, MessageCircle, Clock, ShieldCheck, User, ExternalLink, Bookmark,
  ChevronRight, Sparkles, LogOut
} from 'lucide-react'
import toast from 'react-hot-toast'
import NewDiscussionModal from './NewDiscussionModal'
import ResourceViewModal from './ResourceViewModal'
import UserProfileModal from './UserProfileModal'

const CommunityDetailModal = ({ 
  isOpen, 
  onClose, 
  community, 
  isJoined, 
  onToggleJoin, 
  onAddDiscussion,
  registeredEvents,
  onToggleEventRegister
}) => {
  const [activeTab, setActiveTab] = useState('discussions')
  const [isNewDiscussionOpen, setIsNewDiscussionOpen] = useState(false)
  const [selectedResource, setSelectedResource] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  if (!isOpen || !community) return null

  const Icon = community.icon

  const handleJoinClick = () => {
    if (isJoined) {
      setShowLeaveConfirm(true)
    } else {
      onToggleJoin(community.id)
    }
  }

  const confirmLeave = () => {
    onToggleJoin(community.id)
    setShowLeaveConfirm(false)
  }

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-background/85 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.2 }}
            className="bg-card border border-border/60 rounded-3xl w-full max-w-4xl max-h-[92vh] shadow-2xl overflow-hidden flex flex-col my-auto"
          >
            {/* Modal Header */}
            <div className="p-6 sm:p-8 border-b border-border/40 relative bg-gradient-to-b from-card via-card to-background/50">
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pr-8">
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${community.color} border shadow-inner`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{community.name}</h2>
                      <span className="bg-primary/10 text-primary border border-primary/20 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {isJoined ? community.membersCount + 1 : community.membersCount} members
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-2xl">
                      {community.description}
                    </p>
                  </div>
                </div>

                {/* Join / Joined Button */}
                <div className="shrink-0 self-end sm:self-auto">
                  {isJoined ? (
                    <button
                      onClick={handleJoinClick}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-rose-500/10 text-emerald-500 hover:text-rose-500 border border-emerald-500/30 hover:border-rose-500/30 text-xs font-extrabold transition-all flex items-center gap-1.5 group cursor-pointer"
                    >
                      <span className="group-hover:hidden flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Joined
                      </span>
                      <span className="hidden group-hover:flex items-center gap-1.5">
                        <LogOut className="w-4 h-4" /> Leave Community
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={handleJoinClick}
                      className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-extrabold transition-all shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer"
                    >
                      Join Community <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex items-center gap-2 mt-8 border-b border-border/40 overflow-x-auto scrollbar-none pb-0.5">
                {[
                  { id: 'discussions', label: 'Discussions', icon: MessageSquare, count: community.discussions?.length },
                  { id: 'members', label: 'Members', icon: Users, count: community.members?.length },
                  { id: 'resources', label: 'Resources', icon: BookOpen, count: community.resources?.length },
                  { id: 'events', label: 'Events', icon: Calendar, count: community.events?.length },
                ].map((tab) => {
                  const TabIcon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-3 px-4 text-xs font-bold transition-all relative flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        isActive ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <TabIcon className="w-4 h-4" />
                      <span>{tab.label}</span>
                      {tab.count !== undefined && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          isActive ? 'bg-primary/10 border-primary/30 text-primary font-bold' : 'bg-muted border-border/40 text-muted-foreground'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Modal Body / Tab Content */}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-background/50 space-y-6">

              {/* DISCUSSIONS TAB */}
              {activeTab === 'discussions' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-foreground text-base">Community Discussions</h3>
                      <p className="text-xs text-muted-foreground">Ask questions, share code snippets, and exchange insights.</p>
                    </div>
                    <button
                      onClick={() => setIsNewDiscussionOpen(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Start a Discussion
                    </button>
                  </div>

                  <div className="space-y-4">
                    {community.discussions && community.discussions.length > 0 ? (
                      community.discussions.map((disc) => (
                        <div 
                          key={disc.id}
                          className="bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/40 transition-all shadow-sm space-y-3 group"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={disc.avatar}
                                alt={disc.author}
                                className="w-10 h-10 rounded-full object-cover border border-border/50"
                              />
                              <div>
                                <h4 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors leading-snug">
                                  {disc.title}
                                </h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <span className="font-medium text-foreground/80">{disc.author}</span>
                                  <span>•</span>
                                  <span className="text-[11px] bg-muted px-2 py-0.5 rounded-md border border-border/40">{disc.role}</span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-[11px]">
                                    <Clock className="w-3 h-3" /> {disc.time}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed pl-13 line-clamp-2">
                            {disc.content}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1 font-medium text-foreground/70">
                                <MessageCircle className="w-3.5 h-3.5 text-primary" /> {disc.replies} replies
                              </span>
                              <span className="flex items-center gap-1 font-medium">
                                <Eye className="w-3.5 h-3.5" /> {disc.views} views
                              </span>
                            </div>

                            <button
                              onClick={() => toast.success(`Viewing replies for "${disc.title.slice(0, 25)}..."`)}
                              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              Join Conversation <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-card border border-border/50 rounded-2xl">
                        <p className="text-sm text-muted-foreground">No discussions yet. Be the first to start a discussion!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MEMBERS TAB */}
              {activeTab === 'members' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-foreground text-base">Community Members & Mentors</h3>
                      <p className="text-xs text-muted-foreground">Connect with students, alumni, and verified domain mentors.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {community.members && community.members.map((member) => (
                      <div 
                        key={member.id}
                        className="bg-card border border-border/50 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-primary/40 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-12 h-12 rounded-full object-cover border border-border/50 shrink-0"
                          />
                          <div className="min-w-0">
                            <h4 className="font-bold text-foreground text-sm truncate flex items-center gap-1.5">
                              {member.name}
                              {member.role === 'Mentor' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate">{member.title}</p>
                            <span className={`inline-block mt-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                              member.role === 'Mentor' 
                                ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' 
                                : member.role === 'Alumni' 
                                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            }`}>
                              {member.role}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedMember(member)}
                          className="px-3 py-1.5 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground text-xs font-bold rounded-xl transition-all shrink-0 cursor-pointer"
                        >
                          View Profile
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RESOURCES TAB */}
              {activeTab === 'resources' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-foreground text-base">{community.name} Learning Resources</h3>
                      <p className="text-xs text-muted-foreground">Handpicked roadmaps, cheat sheets, interview guides, and project briefs.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {community.resources && community.resources.map((res) => (
                      <div 
                        key={res.id}
                        className="bg-card border border-border/50 rounded-2xl p-5 flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                              {res.type}
                            </span>
                          </div>
                          <h4 className="font-bold text-foreground text-base">{res.title}</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {res.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-border/30 flex items-center justify-between">
                          <span className="text-[11px] font-medium text-emerald-500 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Free Access
                          </span>
                          <button
                            onClick={() => setSelectedResource(res)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" /> View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EVENTS TAB */}
              {activeTab === 'events' && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-foreground text-base">Community Events & Masterclasses</h3>
                      <p className="text-xs text-muted-foreground">Live workshops, contest streams, and paper reading clubs.</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {community.events && community.events.map((evt) => {
                      const isRegistered = registeredEvents?.has(evt.id)
                      return (
                        <div 
                          key={evt.id}
                          className="bg-card border border-border/50 rounded-2xl p-5 hover:border-primary/40 transition-all shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                              <span className="bg-primary/10 text-primary border border-primary/20 font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> {evt.date}
                              </span>
                              <span className="bg-muted px-2.5 py-0.5 rounded-md font-medium border border-border/40 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {evt.time}
                              </span>
                              <span className="text-muted-foreground">• {evt.location}</span>
                            </div>

                            <h4 className="font-bold text-foreground text-base pt-1">{evt.title}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">{evt.description}</p>
                          </div>

                          <button
                            onClick={() => onToggleEventRegister(evt.id, evt.title)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                              isRegistered
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/10'
                            }`}
                          >
                            {isRegistered ? (
                              <>
                                <Check className="w-4 h-4" /> Registered
                              </>
                            ) : (
                              'Register'
                            )}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Child Modals */}
      <NewDiscussionModal
        isOpen={isNewDiscussionOpen}
        onClose={() => setIsNewDiscussionOpen(false)}
        onAddDiscussion={onAddDiscussion}
        communityName={community.name}
      />

      <ResourceViewModal
        isOpen={!!selectedResource}
        onClose={() => setSelectedResource(null)}
        resource={selectedResource}
        communityName={community.name}
      />

      <UserProfileModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        member={selectedMember}
        communityName={community.name}
      />

      {/* Confirm Leave Modal */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="bg-card border border-border/50 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-foreground">Leave Community?</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to leave <strong className="text-foreground">{community.name}</strong>? You will miss out on discussion updates and new learning resources.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLeave}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
              >
                Yes, Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CommunityDetailModal
