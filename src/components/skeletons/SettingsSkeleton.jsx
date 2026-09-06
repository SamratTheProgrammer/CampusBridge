import React from 'react'
import { Skeleton } from '../ui/Skeleton'

const SettingsSkeleton = () => {
  return (
    <div className="animate-pulse bg-card border border-border/50 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden">
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-10 pb-8 border-b border-border/40">
        <div className="relative">
          <Skeleton className="w-24 h-24 rounded-full" />
          <Skeleton className="absolute bottom-0 right-0 w-8 h-8 rounded-full" />
        </div>
        <div className="text-center sm:text-left space-y-2">
          <Skeleton className="h-6 w-48 rounded-md mx-auto sm:mx-0" />
          <Skeleton className="h-4 w-32 rounded-md mx-auto sm:mx-0" />
        </div>
      </div>

      <div className="space-y-6 max-w-3xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-16 rounded-md" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 rounded-md" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>

        <div className="pt-6 flex justify-end">
          <Skeleton className="h-11 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default SettingsSkeleton
