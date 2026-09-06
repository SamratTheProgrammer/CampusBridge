import React from 'react'
import { Skeleton } from '../ui/Skeleton'

const JobSkeleton = () => {
  return (
    <div className="animate-pulse bg-card border border-border/50 rounded-2xl p-6 flex flex-col h-full relative overflow-hidden shadow-sm">
      <div className="flex items-start justify-between mb-4">
        {/* Company Logo */}
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        {/* Job Type Badge */}
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      
      <div className="mb-4 space-y-2 flex-1">
        {/* Job Title */}
        <Skeleton className="h-5 w-3/4 rounded-md" />
        {/* Company Name */}
        <Skeleton className="h-4 w-1/2 rounded-md" />
      </div>
      
      <div className="space-y-3 mb-6">
        {/* Location */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full shrink-0" />
          <Skeleton className="h-3 w-32 rounded-md" />
        </div>
        {/* Duration */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full shrink-0" />
          <Skeleton className="h-3 w-24 rounded-md" />
        </div>
        {/* Stipend */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-4 h-4 rounded-full shrink-0" />
          <Skeleton className="h-3 w-28 rounded-md" />
        </div>
      </div>
      
      <div className="pt-4 border-t border-border/50 flex items-center justify-between">
        {/* Apply Button */}
        <Skeleton className="h-9 w-24 rounded-xl" />
        
        {/* Time Ago */}
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-2 w-12 rounded-md" />
        </div>
      </div>
    </div>
  )
}

export default JobSkeleton
