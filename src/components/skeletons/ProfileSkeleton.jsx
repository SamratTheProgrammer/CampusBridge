import React from 'react'
import { Skeleton } from '../ui/Skeleton'

const ProfileSkeleton = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Cover Image */}
      <Skeleton className="w-full h-48 md:h-64 rounded-xl" />

      <div className="px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-10 space-y-6">
        {/* Profile Info */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between">
          <div className="flex gap-4 items-end">
            <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-background" />
            <div className="space-y-2 mb-2 pb-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Skeleton className="h-10 w-full sm:w-28 rounded-md" />
            <Skeleton className="h-10 w-full sm:w-28 rounded-md" />
          </div>
        </div>

        {/* About Section */}
        <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm space-y-4">
          <Skeleton className="h-5 w-1/4" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm space-y-4">
            <Skeleton className="h-5 w-1/3 mb-4" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
          <div className="bg-card border border-border/50 rounded-xl p-6 shadow-sm space-y-4">
            <Skeleton className="h-5 w-1/3 mb-4" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSkeleton
