import React from 'react'
import { Skeleton } from '../ui/Skeleton'

const EventSkeleton = () => {
  return (
    <div className="animate-pulse bg-card border border-border/50 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm overflow-hidden relative">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 w-full">
        {/* Image Placeholder */}
        <Skeleton className="w-full sm:w-32 h-40 sm:h-28 rounded-xl shrink-0" />
        
        {/* Content Placeholder */}
        <div className="flex-1 space-y-3">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          
          {/* Title */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-3/4 sm:w-64 rounded-md" />
            <Skeleton className="h-5 w-5 rounded-md" />
          </div>
          
          {/* Date & Time */}
          <Skeleton className="h-4 w-48 rounded-md" />
          
          {/* Location */}
          <Skeleton className="h-3.5 w-32 rounded-md" />
          
          {/* Stats Badges */}
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-6 w-24 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
          </div>
        </div>
      </div>
      
      {/* Action Button */}
      <Skeleton className="h-10 w-full sm:w-28 rounded-xl shrink-0 mt-2 sm:mt-0" />
    </div>
  )
}

export default EventSkeleton
