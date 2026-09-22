import React from 'react'
import { Skeleton } from '../ui/Skeleton'

const SessionSkeleton = () => {
  return (
    <div className="bg-card border border-border/30 rounded-2xl p-4 sm:p-5 shadow-md flex flex-col justify-between overflow-hidden min-h-[350px]">
      
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header: Session Type Badge Only */}
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>

        {/* Session Title (Gigantic) */}
        <div className="mb-4">
          <Skeleton className="h-7 w-4/5 mb-2 rounded-md" />
          <Skeleton className="h-7 w-1/2 rounded-md" />
        </div>

        {/* Middle Block (Ticket Style) */}
        <div className="relative bg-muted/50 rounded-2xl p-4 mb-4 border border-border/20 flex-1 flex flex-col justify-center">
          {/* Floating Avatar Overlapping Top Border */}
          <div className="absolute -top-5 right-4 w-10 h-10 rounded-full border-[3px] border-card bg-muted overflow-hidden shadow-sm">
            <Skeleton className="w-full h-full" />
          </div>

          <div className="flex flex-col gap-3 pt-1">
            {/* Date & Time */}
            <div>
              <Skeleton className="h-2 w-16 mb-2 rounded-sm" />
              <Skeleton className="h-4 w-32 rounded-sm" />
            </div>
            
            {/* Mode & Venue */}
            <div>
              <Skeleton className="h-2 w-20 mb-2 rounded-sm" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="w-4 h-4 rounded-md shrink-0" />
                <Skeleton className="h-4 w-28 rounded-sm" />
              </div>
            </div>

            {/* Host Name */}
            <div>
              <Skeleton className="h-2 w-14 mb-2 rounded-sm" />
              <Skeleton className="h-4 w-24 rounded-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between mt-auto pt-2">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2 shrink-0">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-muted border-2 border-card overflow-hidden">
                <Skeleton className="w-full h-full bg-muted/80" />
              </div>
            ))}
          </div>
          <Skeleton className="h-3 w-16 rounded-sm hidden sm:block ml-1" />
        </div>
        
        <Skeleton className="h-10 w-24 rounded-xl shrink-0" />
      </div>
    </div>
  )
}

export default SessionSkeleton
