import React from 'react'
import { Skeleton } from '../ui/Skeleton'

const PostSkeleton = () => {
  return (
    <div className="bg-card border border-border/50 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header (Avatar + Name) */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>

      {/* Image Skeleton (optional, making it look like a post image could be loading) */}
      <Skeleton className="h-48 sm:h-64 w-full rounded-lg" />

      {/* Actions (Like, Comment, Share) */}
      <div className="flex items-center justify-between pt-4 border-t border-border/40">
        <Skeleton className="h-8 w-1/4 rounded-md" />
        <Skeleton className="h-8 w-1/4 rounded-md" />
        <Skeleton className="h-8 w-1/4 rounded-md" />
      </div>
    </div>
  )
}

export default PostSkeleton
