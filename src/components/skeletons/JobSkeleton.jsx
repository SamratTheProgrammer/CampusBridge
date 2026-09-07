import React from 'react'
import { Skeleton } from '../ui/Skeleton'
import { MapPin, Briefcase, Calendar, ChevronRight } from 'lucide-react'

const JobSkeleton = () => {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 flex flex-col h-full relative overflow-hidden shadow-sm">
      <div className="flex items-start justify-between mb-4">
        {/* Company Logo */}
        <div className="w-12 h-12 rounded-xl border border-border/50 bg-white flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
        {/* Job Type Badge */}
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      
      <div className="flex-1">
        {/* Job Title */}
        <Skeleton className="h-6 w-3/4 rounded-md mb-2" />
        {/* Company Name */}
        <Skeleton className="h-4 w-1/2 rounded-md mb-4" />

        <div className="space-y-2 mb-6">
          {/* Location */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground/50" /> 
            <Skeleton className="h-3 w-32 rounded-md" />
          </div>
          {/* Salary */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Briefcase className="w-3.5 h-3.5 text-muted-foreground/50" /> 
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
          {/* Deadline */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground/50" /> 
            <Skeleton className="h-3 w-36 rounded-md" />
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-border/50 flex items-center justify-between mt-auto">
        <span className="text-xs font-semibold text-primary/50 flex items-center gap-1">
          <Skeleton className="h-3 w-16 rounded-md" /> <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30" />
        </span>
        <Skeleton className="h-3 w-16 rounded-md" />
      </div>
    </div>
  )
}

export default JobSkeleton
