import React from 'react'
import { Skeleton } from '../ui/Skeleton'

const UserSkeleton = ({ variant = 'list' }) => {
  if (variant === 'grid') {
    return (
      <div className="animate-pulse bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 sm:p-5 flex-1 text-center relative">
          <Skeleton className="absolute top-4 right-4 h-5 w-16 rounded-full" />
          <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-4" />
          
          <Skeleton className="h-5 w-3/4 mx-auto rounded-md mb-2" />
          <Skeleton className="h-4 w-1/2 mx-auto rounded-md mb-2" />
          <Skeleton className="h-3 w-1/3 mx-auto rounded-md" />
        </div>
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 mt-2">
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  // list variant
  return (
    <div className="animate-pulse bg-card border border-border/50 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 shadow-sm">
      <div className="flex flex-row items-center gap-4 sm:gap-5 w-full">
        <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-48 rounded-md" />
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-3 w-24 rounded-md mt-1" />
          
          <div className="flex flex-wrap gap-2 mt-3">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-14 rounded-md" />
          </div>
        </div>
      </div>
      
      <div className="flex sm:flex-col gap-2 shrink-0">
        <Skeleton className="h-10 w-28 sm:w-32 rounded-xl" />
      </div>
    </div>
  )
}

export default UserSkeleton
