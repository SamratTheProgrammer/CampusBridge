import React from 'react'

const AdminSpinner = ({ 
  message = 'Loading...', 
  size = 'md', 
  className = '', 
  minHeight = 'min-h-[280px]' 
}) => {
  const sizeConfig = {
    sm: {
      outer: 'w-8 h-8 border-2',
      inner: 'w-4 h-4 border-2',
      dot: 'w-1 h-1',
      text: 'text-xs'
    },
    md: {
      outer: 'w-12 h-12 border-[3px]',
      inner: 'w-6 h-6 border-2',
      dot: 'w-1.5 h-1.5',
      text: 'text-sm'
    },
    lg: {
      outer: 'w-16 h-16 border-4',
      inner: 'w-8 h-8 border-[3px]',
      dot: 'w-2 h-2',
      text: 'text-base'
    }
  }

  const s = sizeConfig[size] || sizeConfig.md

  return (
    <div className={`flex flex-col items-center justify-center w-full py-16 px-4 ${minHeight} ${className} animate-in fade-in duration-300 select-none`}>
      <div className="relative flex items-center justify-center mb-4">
        {/* Outer Glow Ring */}
        <div className={`${s.outer} rounded-full border-primary/20 border-t-primary animate-spin`} />
        
        {/* Inner Counter-Rotating Ring */}
        <div className={`absolute ${s.inner} rounded-full border-primary/30 border-b-primary animate-[spin_1.2s_linear_infinite_reverse]`} />
        
        {/* Core Pulsing Dot */}
        <div className={`absolute ${s.dot} rounded-full bg-primary animate-pulse`} />
      </div>

      {message && (
        <p className={`font-medium text-muted-foreground ${s.text} tracking-tight animate-pulse text-center max-w-sm`}>
          {message}
        </p>
      )}
    </div>
  )
}

export default AdminSpinner
