import React from 'react'
import { Skeleton } from '../ui/Skeleton'

const SessionSkeleton = () => {
  return (
    <div className="animate-pulse bg-card border border-border/50 rounded-2xl p-6 flex flex-col justify-between shadow-sm min-h-[350px]">
      <div>
        {/* Mentor Header */}
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border/40">
          <Skeleton className="w-12 h-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
        </div>
        
        {/* Session Title */}
        <Skeleton className="h-5 w-3/4 rounded-md mb-4" />
        
        {/* Details Box */}
        <div className="space-y-3 bg-muted/20 p-4 rounded-xl border border-border/40 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
          ))}
          <div className="pt-2 border-t border-border/30 flex items-center justify-between mt-2">
            <Skeleton className="h-3 w-20 rounded-md" />
            <Skeleton className="h-3 w-28 rounded-md" />
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="pt-2 flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded-md" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </div>
    </div>
  )
}

export default SessionSkeleton
