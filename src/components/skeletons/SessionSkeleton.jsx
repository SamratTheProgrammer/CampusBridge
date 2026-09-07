import React from 'react'
import { Skeleton } from '../ui/Skeleton'

const SessionSkeleton = () => {
  return (
    <div className="bg-card border border-border/50 rounded-2xl shadow-sm hover:border-primary/30 transition-all flex flex-col justify-between">
      {/* Top Section: Mentor + Session Info */}
      <div className="p-5 pb-4">
        {/* Mentor Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full border border-border/50 shrink-0 overflow-hidden">
             <Skeleton className="w-full h-full" />
          </div>
          <div className="overflow-hidden flex-1 pt-1">
            <Skeleton className="h-4 w-32 mb-1.5 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
          {/* Source badge */}
          <Skeleton className="h-5 w-16 rounded-full shrink-0" />
        </div>

        {/* Session Title */}
        <Skeleton className="h-5 w-3/4 mb-3 rounded-md" />

        {/* Details */}
        <div className="space-y-2 text-xs bg-muted/40 p-3 rounded-xl border border-border/40">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Mode:</span>
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Date:</span>
            <Skeleton className="h-4 w-28 rounded-md" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium">Time:</span>
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-border/30">
            <span className="text-muted-foreground font-medium">Venue:</span>
            <Skeleton className="h-4 w-32 rounded-md" />
          </div>
        </div>
      </div>

      {/* Bottom Action Bar: Join Button on right */}
      <div className="px-5 py-3 border-t border-border/40 flex items-center justify-between">
        <Skeleton className="h-4 w-24 rounded-md" />

        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default SessionSkeleton
