import React from 'react'
import { Skeleton } from '../ui/Skeleton'

const ProfileSkeleton = () => {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Profile Card (matches exact real profile dimensions) */}
      <div className="bg-card border-x-0 border-t-0 sm:border border-border/50 rounded-none sm:rounded-2xl overflow-hidden shadow-sm relative">
        {/* Cover Photo Area */}
        <div className="h-56 sm:h-72 md:h-80 w-full bg-muted/40 relative">
          <Skeleton className="w-full h-full rounded-none" />
        </div>

        <div className="px-4 sm:px-6 pb-6 relative">
          {/* Top Row: Avatar and Actions */}
          <div className="flex justify-between items-end w-full -mt-16 sm:-mt-20 relative z-10">
            {/* Avatar Circle */}
            <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-full border-4 border-card bg-card shadow-md shrink-0 overflow-hidden">
              <Skeleton className="w-full h-full rounded-full" />
            </div>

            {/* Action Buttons on Right */}
            <div className="flex gap-2 sm:gap-3 items-center justify-end mb-2 sm:mb-4">
              <Skeleton className="h-10 w-24 sm:w-28 rounded-xl" />
              <Skeleton className="h-10 w-28 sm:w-32 rounded-xl" />
            </div>
          </div>

          {/* User Info Stack */}
          <div className="mt-4 flex flex-col gap-2 text-left w-full">
            {/* Name + Badge */}
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-56 sm:w-72 rounded-lg" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>

            {/* Username @handle */}
            <Skeleton className="h-4 w-36 rounded-md" />

            {/* Headline / Title */}
            <Skeleton className="h-5 w-64 sm:w-96 rounded-md" />

            {/* Location & Metadata row */}
            <div className="flex flex-wrap items-center gap-4 mt-1">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-4 w-36 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>

            {/* Stats Row (Posts & Connections) */}
            <div className="flex items-center gap-6 mt-3 pt-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-8 rounded-md" />
                <Skeleton className="h-4 w-12 rounded-md" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-8 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
            </div>

            {/* Social Links Row */}
            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-border/40">
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
              <Skeleton className="h-9 w-28 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Grid (1/3 Sidebar + 2/3 Feed) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column - Details */}
        <div className="md:col-span-1 space-y-6">
          {/* About Me Card */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-3">
            <Skeleton className="h-5 w-28 rounded-md mb-4" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-4/5 rounded-md" />
          </div>

          {/* Skills Card */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
            <Skeleton className="h-5 w-20 rounded-md mb-2" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-7 w-20 rounded-lg" />
              <Skeleton className="h-7 w-24 rounded-lg" />
              <Skeleton className="h-7 w-16 rounded-lg" />
              <Skeleton className="h-7 w-28 rounded-lg" />
              <Skeleton className="h-7 w-20 rounded-lg" />
            </div>
          </div>

          {/* Experience Card */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
            <Skeleton className="h-5 w-32 rounded-md mb-2" />
            <div className="space-y-4 pl-3 border-l-2 border-border/50">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3.5 w-1/2 rounded-md" />
                <Skeleton className="h-3 w-1/3 rounded-md" />
              </div>
              <div className="space-y-1.5 pt-2">
                <Skeleton className="h-4 w-2/3 rounded-md" />
                <Skeleton className="h-3.5 w-1/2 rounded-md" />
                <Skeleton className="h-3 w-1/3 rounded-md" />
              </div>
            </div>
          </div>

          {/* Education Card */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
            <Skeleton className="h-5 w-28 rounded-md mb-2" />
            <div className="space-y-4 pl-3 border-l-2 border-border/50">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-2/3 rounded-md" />
                <Skeleton className="h-3.5 w-1/2 rounded-md" />
                <Skeleton className="h-3 w-1/4 rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Activity & Posts */}
        <div className="md:col-span-2 space-y-6">
          {/* Tabs Bar Skeleton */}
          <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex gap-4">
              <Skeleton className="h-6 w-24 rounded-md" />
              <Skeleton className="h-6 w-28 rounded-md" />
            </div>
            <Skeleton className="h-8 w-20 rounded-xl" />
          </div>

          {/* Post Card Skeleton 1 (with image preview) */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-11 h-11 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </div>
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
            <div className="space-y-2 pt-1">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-3/5 rounded-md" />
            </div>
            <Skeleton className="h-64 sm:h-80 w-full rounded-xl" />
            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              <div className="flex gap-4">
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>

          {/* Post Card Skeleton 2 (text only) */}
          <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-11 h-11 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
            <div className="space-y-2 pt-1">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-4/5 rounded-md" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              <div className="flex gap-4">
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSkeleton
