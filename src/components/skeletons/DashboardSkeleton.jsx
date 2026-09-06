import React from 'react'
import { Skeleton } from '../ui/Skeleton'

const DashboardSkeleton = ({ className }) => {
  return (
    <div className={`min-h-screen bg-background flex w-full overflow-hidden ${className || ''}`}>
      {/* Sidebar Skeleton (hidden on mobile, block on lg) */}
      <div className="hidden lg:flex flex-col w-64 border-r border-border/40 bg-background p-4 h-screen fixed left-0 top-0 z-10">
        {/* Logo area */}
        <div className="flex items-center gap-3 mb-8 px-2 mt-2">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-7 w-32 rounded-md" />
        </div>
        
        {/* Menu Items */}
        <div className="space-y-1 mt-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-lg">
              <Skeleton className="w-5 h-5 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
          ))}
        </div>
        
        {/* Bottom Items */}
        <div className="mt-auto space-y-4 mb-4">
          <div className="px-3">
             <Skeleton className="h-4 w-32 rounded-md" />
             <Skeleton className="h-2 w-full rounded-md mt-2" />
          </div>
          <div className="flex items-center gap-3 px-3 py-3">
            <Skeleton className="w-5 h-5 rounded-md" />
            <Skeleton className="h-4 w-16 rounded-md" />
          </div>
        </div>
      </div>

      {/* Main Content Area Skeleton */}
      <div className="flex-1 flex flex-col lg:ml-64 w-full min-h-screen">
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

        {/* Content Grid Skeleton */}
        <div className="p-4 sm:p-6 lg:p-6 flex-1 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Column (Profile Info) */}
            <div className="hidden lg:block lg:col-span-1 space-y-6">
              {/* Profile Card */}
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
              
              {/* Additional Menu Card */}
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
              {/* Post Input Box */}
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
              
              {/* Feed Item 1 */}
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
              {/* Widget 1 */}
              <div className="rounded-xl border border-border/50 bg-card/50 p-5 shadow-sm">
                <Skeleton className="h-5 w-40 rounded-md mb-6" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
              {/* Widget 2 */}
              <div className="rounded-xl border border-border/50 bg-card/50 p-5 shadow-sm">
                <Skeleton className="h-5 w-36 rounded-md mb-6" />
                <Skeleton className="h-20 w-full rounded-lg" />
              </div>
              {/* Widget 3 */}
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
      </div>
    </div>
  )
}

export default DashboardSkeleton
