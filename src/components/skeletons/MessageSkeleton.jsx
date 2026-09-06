import React from 'react'
import { Skeleton } from '../ui/Skeleton'

const MessageSkeleton = ({ variant = 'contact' }) => {
  if (variant === 'chat') {
    return (
      <div className="animate-pulse space-y-4 px-2">
        {/* Friend's Message */}
        <div className="animate-pulse flex items-end gap-2 max-w-[80%]">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="bg-muted border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3 min-w-[120px] max-w-sm space-y-2">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
            <Skeleton className="h-2 w-10 mt-2 ml-auto rounded-full" />
          </div>
        </div>

        {/* My Message */}
        <div className="animate-pulse flex items-end gap-2 max-w-[80%] ml-auto justify-end">
          <div className="bg-primary/20 border border-primary/20 rounded-2xl rounded-br-sm px-4 py-3 min-w-[160px] max-w-sm space-y-2">
            <Skeleton className="h-4 w-full bg-primary/20 rounded-md" />
            <Skeleton className="h-2 w-16 mt-2 ml-auto bg-primary/30 rounded-full" />
          </div>
        </div>

        {/* Friend's Message Short */}
        <div className="animate-pulse flex items-end gap-2 max-w-[80%]">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="bg-muted border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3 min-w-[200px] max-w-sm space-y-2">
            <Skeleton className="h-4 w-1/2 rounded-md" />
            <Skeleton className="h-2 w-10 mt-2 ml-auto rounded-full" />
          </div>
        </div>
      </div>
    )
  }

  // contact variant
  return (
    <div className="animate-pulse flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors w-full border-b border-border/30">
      <Skeleton className="w-12 h-12 rounded-full shrink-0" />
      <div className="animate-pulse flex-1 min-w-0">
        <div className="animate-pulse flex justify-between items-center mb-1">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-3 w-10 rounded-md" />
        </div>
        <Skeleton className="h-3 w-4/5 rounded-md" />
      </div>
    </div>
  )
}

export default MessageSkeleton
