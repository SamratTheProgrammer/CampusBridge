import React from 'react'
import { Skeleton } from '../ui/Skeleton'
import { MapPin } from 'lucide-react'

const UserSkeleton = ({ variant = 'list' }) => {
  if (variant === 'grid') {
    return (
      <div className="bg-card border border-border/50 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden h-full">
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-full border border-border/50 shrink-0 overflow-hidden">
              <Skeleton className="w-full h-full" />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <Skeleton className="h-5 w-3/4 mb-2 rounded-md" />
              <Skeleton className="h-3 w-1/2 mb-1.5 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border/40">
            <Skeleton className="h-3 w-32 rounded-md mb-2" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
        </div>
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-9 flex-1 rounded-xl" />
            <Skeleton className="h-9 flex-1 rounded-xl" />
            <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
          </div>
        </div>
      </div>
    )
  }

  // list variant
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 shadow-sm overflow-hidden">
      <div className="flex flex-row items-center gap-4 sm:gap-5 min-w-0 w-full">
        <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-full shrink-0" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-5 sm:h-6 w-48 mb-2 rounded-md" />
          <Skeleton className="h-3 sm:h-4 w-32 mb-2 rounded-md" />
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-14 rounded-md" />
          </div>
        </div>
      </div>
      <div className="flex flex-row sm:flex-nowrap gap-1.5 sm:gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/40 w-full sm:w-auto mt-2 sm:mt-0">
        <Skeleton className="h-9 sm:h-10 w-full sm:w-28 rounded-xl flex-1 sm:flex-none" />
        <Skeleton className="h-9 sm:h-10 w-full sm:w-28 rounded-xl flex-1 sm:flex-none" />
        <Skeleton className="h-9 sm:h-10 w-full sm:w-28 rounded-xl flex-1 sm:flex-none" />
      </div>
    </div>
  )
}

export default UserSkeleton
