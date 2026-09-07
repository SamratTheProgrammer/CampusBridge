import React from 'react'
import { Skeleton } from '../ui/Skeleton'
import EventSkeleton from './EventSkeleton'
import JobSkeleton from './JobSkeleton'
import MessageSkeleton from './MessageSkeleton'
import PostSkeleton from './PostSkeleton'
import ProfileSkeleton from './ProfileSkeleton'
import SessionSkeleton from './SessionSkeleton'
import SettingsSkeleton from './SettingsSkeleton'
import UserSkeleton from './UserSkeleton'

const DashboardSkeleton = ({ className }) => {
  const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true'
  const pathname = window.location.pathname
  const renderContent = () => {
    // 1. Messages
    if (pathname.includes('/messages')) {
      return (
        <div className="flex-1 w-full h-[calc(100vh-64px)] overflow-hidden">
          <MessageSkeleton />
        </div>
      )
    }

    // 2. Settings
    if (pathname.includes('/settings')) {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          <SettingsSkeleton />
        </div>
      )
    }

    // 3. Profile
    if (pathname.includes('/profile')) {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          <ProfileSkeleton />
        </div>
      )
    }

    // 4. Jobs
    if (pathname.includes('/jobs')) {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Jobs & Internships</h1>
            <p className="text-muted-foreground">Find the best opportunities tailored for you.</p>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Skeleton className="w-full h-[42px] rounded-xl" />
              </div>
              <div className="flex flex-wrap md:flex-nowrap gap-4">
                <Skeleton className="w-[120px] h-[42px] rounded-xl" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <JobSkeleton key={i} />)}
          </div>
        </div>
      )
    }

    // 5. Events
    if (pathname.includes('/events')) {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Events</h1>
            <p className="text-muted-foreground">Discover and register for upcoming events.</p>
          </div>
          <div className="flex items-center gap-6 border-b border-border/40">
            <button className={`pb-4 text-sm font-semibold border-b-2 transition-colors border-primary text-primary`}>
              Upcoming Events
            </button>
            <button className={`pb-4 text-sm font-semibold border-b-2 transition-colors border-transparent text-muted-foreground`}>
              Past Events
            </button>
          </div>
          <div className="space-y-4 pt-2">
            {[...Array(3)].map((_, i) => <EventSkeleton key={i} />)}
          </div>
        </div>
      )
    }

    // 6. Sessions
    if (pathname.includes('/sessions')) {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 pb-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Sessions</h1>
              <p className="text-muted-foreground text-sm">Browse available mentor sessions or manage your booked meetings.</p>
            </div>
            <div className="flex bg-muted p-1 rounded-xl w-fit shrink-0">
              <Skeleton className="w-16 h-8 rounded-lg" />
              <Skeleton className="w-20 h-8 rounded-lg ml-1" />
              <Skeleton className="w-20 h-8 rounded-lg ml-1" />
            </div>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl shadow-sm overflow-hidden mb-6 sm:mb-8">
            <div className="flex overflow-x-auto scrollbar-none border-b border-border/40 p-1">
              <Skeleton className="w-32 h-10 rounded-lg m-1" />
              <Skeleton className="w-40 h-10 rounded-lg m-1" />
              <Skeleton className="w-32 h-10 rounded-lg m-1" />
              <Skeleton className="w-32 h-10 rounded-lg m-1" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <SessionSkeleton key={i} />)}
          </div>
        </div>
      )
    }

    // 7. Users / Network / Mentees / Mentors
    if ((pathname.includes('/mentor') && !pathname.includes('/mentor-dashboard') && !pathname.includes('requests')) || pathname.includes('/mentees') || pathname.includes('/network')) {
      const isMentorDir = pathname.includes('/mentor');
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
                {isMentorDir ? 'Mentor Directory' : 'My Network'}
              </h1>
              <p className="text-muted-foreground text-sm max-w-2xl">
                {isMentorDir ? 'Find and connect with industry experts.' : 'Connect with peers, alumni, and mentors.'}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card border border-border/50 p-4 rounded-2xl shadow-sm mb-6">
            <div className="flex overflow-x-auto w-full sm:w-auto scrollbar-none gap-2">
              <Skeleton className="w-32 h-9 rounded-xl" />
              <Skeleton className="w-32 h-9 rounded-xl" />
            </div>
            <div className="relative w-full sm:w-72">
               <Skeleton className="w-full h-[38px] rounded-xl" />
            </div>
          </div>
          {isMentorDir ? (
            <div className="space-y-4 max-w-5xl">
              {[...Array(5)].map((_, i) => <UserSkeleton key={i} variant="list" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(8)].map((_, i) => <UserSkeleton key={i} variant="grid" />)}
            </div>
          )}
        </div>
      )
    }

    // 8. Lists of Cards / Posts / Applications / Saved / Mentorship Requests
    if (pathname.includes('/posts') || pathname.includes('/mentorship') || pathname.includes('/requests') || pathname.includes('/applications') || pathname.includes('/saved')) {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-48 rounded-md" />
          </div>
          {[...Array(4)].map((_, i) => <PostSkeleton key={i} />)}
        </div>
      )
    }

    // 9. Analytics (Mentor Dashboard)
    if (pathname.includes('/analytics')) {
       return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <Skeleton className="h-8 w-48 rounded-md mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
       )
    }

    // 10. Default Home Layout (Dashboard / Mentor Dashboard Home)
    return (
      <div className="p-4 sm:p-6 lg:p-6 flex-1 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column (Profile Info) */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden shadow-sm">
              <Skeleton className="h-24 w-full rounded-none" />
              <div className="px-4 pb-5">
                <div className="flex justify-center -mt-10 mb-3">
                  <Skeleton className="w-20 h-20 rounded-full border-4 border-card" />
                </div>
                <div className="flex flex-col items-center gap-2.5 mb-5">
                  <Skeleton className="h-5 w-36 rounded-md" />
                  <Skeleton className="h-3.5 w-16 rounded-md" />
                </div>
                <div className="space-y-4 mt-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                    <Skeleton className="h-3.5 w-6 rounded-md" />
                  </div>
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-3.5 w-24 rounded-md" />
                    <Skeleton className="h-3.5 w-6 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-9 w-full rounded-lg mt-5" />
              </div>
            </div>
            
            <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-1 shadow-sm">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="w-5 h-5 rounded-md" />
                  <Skeleton className="h-4 w-32 rounded-md" />
                </div>
              ))}
            </div>
          </div>
          
          {/* Middle Column (Feed) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-border/50 bg-card/50 p-4 shadow-sm">
              <div className="flex gap-4">
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                <Skeleton className="h-12 w-full rounded-full" />
              </div>
              <div className="flex items-center mt-5 justify-between px-1">
                <div className="flex gap-6">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-md" />
                    <Skeleton className="h-4 w-12 rounded-md" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-md" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-md" />
                    <Skeleton className="h-4 w-10 rounded-md" />
                  </div>
                </div>
                <Skeleton className="h-9 w-16 rounded-lg" />
              </div>
            </div>
            
            <div className="rounded-xl border border-border/50 bg-card/50 p-4 shadow-sm">
              <div className="flex gap-3 items-center mb-4">
                <Skeleton className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="space-y-2.5 flex-1">
                  <Skeleton className="h-4 w-36 rounded-md" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-72 w-full rounded-xl mb-4" />
              <div className="flex gap-4 px-2 pt-2">
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            </div>
          </div>
          
          {/* Right Column (Widgets) */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="rounded-xl border border-border/50 bg-card/50 p-5 shadow-sm">
              <Skeleton className="h-5 w-40 rounded-md mb-6" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50 p-5 shadow-sm">
              <Skeleton className="h-5 w-36 rounded-md mb-6" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
            <div className="rounded-xl border border-border/50 bg-card/50 p-5 shadow-sm">
              <Skeleton className="h-5 w-44 rounded-md mb-5" />
              <div className="space-y-4">
                <div className="space-y-2">
                   <Skeleton className="h-4 w-full rounded-md" />
                   <Skeleton className="h-3 w-2/3 rounded-md" />
                </div>
                <div className="space-y-2 pt-2">
                   <Skeleton className="h-4 w-full rounded-md" />
                   <Skeleton className="h-3 w-2/3 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-background flex w-full overflow-hidden ${className || ''}`}>
      {/* Sidebar Skeleton (hidden on mobile, block on lg) */}
      <div className={`hidden lg:flex flex-col ${isCollapsed ? 'w-20' : 'w-64'} border-r border-border/40 bg-background p-4 h-screen fixed left-0 top-0 z-10 transition-all duration-300`}>
        {/* Logo area */}
        <div className={`flex items-center gap-3 mb-8 px-2 mt-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          {!isCollapsed && <Skeleton className="h-7 w-32 rounded-md" />}
        </div>
        
        {/* Menu Items */}
        <div className="space-y-1 mt-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className={`flex items-center gap-3 py-3 rounded-lg ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}>
              <Skeleton className="w-5 h-5 rounded-md shrink-0" />
              {!isCollapsed && <Skeleton className="h-4 w-28 rounded-md" />}
            </div>
          ))}
        </div>
        
        {/* Bottom Items */}
        <div className="mt-auto space-y-4 mb-4">
          <div className="px-3">
             <Skeleton className={`h-4 ${isCollapsed ? 'w-10 mx-auto' : 'w-32'} rounded-md`} />
             {!isCollapsed && <Skeleton className="h-2 w-full rounded-md mt-2" />}
          </div>
          <div className={`flex items-center gap-3 py-3 ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}>
            <Skeleton className="w-5 h-5 rounded-md shrink-0" />
            {!isCollapsed && <Skeleton className="h-4 w-16 rounded-md" />}
          </div>
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className={`flex-1 flex flex-col ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} w-full min-h-screen transition-all duration-300`}>
        {/* Header Skeleton */}
        <header className="h-16 border-b border-border/40 px-4 md:px-6 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10">
          <div className="flex-1 max-w-md hidden sm:block">
            <Skeleton className="h-10 w-full rounded-full" />
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="w-8 h-8 rounded-full" />
            <div className="flex items-center gap-3 pl-2 border-l border-border/40">
              <Skeleton className="w-9 h-9 rounded-full" />
              <div className="hidden md:flex flex-col gap-1.5">
                <Skeleton className="w-24 h-3.5 rounded-md" />
                <Skeleton className="w-16 h-2.5 rounded-md" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content Block */}
        {renderContent()}
      </div>
    </div>
  )
}

export default DashboardSkeleton
