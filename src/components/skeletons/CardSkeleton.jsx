import React from 'react'
import { Skeleton } from '../ui/Skeleton'

const CardSkeleton = () => {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-5 shadow-sm space-y-4">
      {/* Top Section */}
      <div className="flex items-start justify-between">
        <div className="space-y-3 w-3/4">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>

      {/* Details Section */}
      <div className="space-y-2 py-2">
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-2/5" />
      </div>

      {/* Actions Footer */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/40">
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    </div>
  )
}

export default CardSkeleton
