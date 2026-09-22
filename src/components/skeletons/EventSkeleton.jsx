import React from 'react'
import { Skeleton } from '../ui/Skeleton'

const EventSkeleton = () => {
  return (
    <div className="animate-pulse bg-card border border-border/50 rounded-3xl p-3 sm:p-3.5 flex flex-col justify-between shadow-sm overflow-hidden relative">
      {/* Banner Cover Skeleton */}
      <Skeleton className="w-full h-44 sm:h-48 rounded-2xl mb-4 shrink-0" />
      
      {/* Body Content Skeleton */}
      <div className="flex-1 flex flex-col justify-between px-1">
        {/* Title & Chevron Row */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <Skeleton className="h-6 w-3/4 rounded-md" />
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        </div>
        
        {/* Subtitle / Description */}
        <div className="space-y-1.5 mb-4">
          <Skeleton className="h-3.5 w-full rounded" />
          <Skeleton className="h-3.5 w-4/5 rounded" />
        </div>
        
        {/* 3-Column Info Matrix Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-4 p-3 bg-muted/20 border border-border/30 rounded-2xl">
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3 w-14 rounded" />
              <Skeleton className="h-2.5 w-10 rounded" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3 w-14 rounded" />
              <Skeleton className="h-2.5 w-10 rounded" />
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3 w-14 rounded" />
              <Skeleton className="h-2.5 w-10 rounded" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Action Row Skeleton */}
      <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <Skeleton className="w-7 h-7 rounded-full" />
            <Skeleton className="w-7 h-7 rounded-full" />
            <Skeleton className="w-7 h-7 rounded-full" />
          </div>
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <Skeleton className="h-9 w-24 rounded-full shrink-0" />
      </div>
    </div>
  )
}

export default EventSkeleton
