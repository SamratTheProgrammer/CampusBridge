import React, { useState, useRef, useEffect } from 'react'
import { X, Plus, Search, Check, GraduationCap } from 'lucide-react'

export const POPULAR_COURSES = [
  'B.Tech',
  'BE',
  'BCA',
  'MCA',
  'M.Tech',
  'ME',
  'B.Sc',
  'M.Sc',
  'B.Sc (IT)',
  'B.Sc (CS)',
  'M.Sc (IT)',
  'M.Sc (CS)',
  'BBA',
  'MBA',
  'B.Com',
  'M.Com',
  'B.A',
  'M.A',
  'Diploma',
  'Polytechnic',
  'Ph.D',
  'B.Des',
  'M.Des',
  'B.Pharm',
  'M.Pharm',
  'Any Graduate',
  'Any Postgraduate',
  'All Degrees / Open to All'
]

export const QUICK_SUGGESTIONS = [
  'B.Tech',
  'MCA',
  'BCA',
  'M.Tech',
  'B.Sc',
  'MBA',
  'Diploma',
  'Any Graduate'
]

/**
 * CourseSelector
 * 
 * Allows users to add valid courses with search autocomplete, custom free-text input,
 * quick suggestion pills, tag removal, and keyboard navigation.
 * 
 * @param {Array|string} value - Current courses as array or comma-separated string
 * @param {Function} onChange - Callback function returning updated array of courses
 * @param {string} [name="eligibility_courses"] - Form input name for native submission
 * @param {string} [placeholder] - Placeholder text for input
 */
const CourseSelector = ({
  value,
  onChange,
  name = 'eligibility_courses',
  placeholder = 'Search course or type custom (e.g. B.Tech, MCA, Others)...',
  className = ''
}) => {
  // Parse incoming value to array of strings
  const parseCourses = (val) => {
    if (Array.isArray(val)) return val.map(c => String(c).trim()).filter(Boolean)
    if (typeof val === 'string' && val.trim()) {
      return val.split(',').map(c => c.trim()).filter(Boolean)
    }
    return []
  }

  const selectedCourses = parseCourses(value)
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addCourse = (courseToAdd) => {
    if (!courseToAdd) return
    const cleanList = courseToAdd
      .split(',')
      .map(c => c.trim())
      .filter(Boolean)

    if (cleanList.length === 0) return

    const newCourses = [...selectedCourses]
    cleanList.forEach(course => {
      const alreadyExists = newCourses.some(
        c => c.toLowerCase() === course.toLowerCase()
      )
      if (!alreadyExists) {
        newCourses.push(course)
      }
    })

    onChange?.(newCourses)
    setInputValue('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  const removeCourse = (courseToRemove) => {
    const updated = selectedCourses.filter(
      c => c.toLowerCase() !== courseToRemove.toLowerCase()
    )
    onChange?.(updated)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (inputValue.trim()) {
        addCourse(inputValue.trim())
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedCourses.length > 0) {
      // Remove last tag when backspace pressed on empty input
      removeCourse(selectedCourses[selectedCourses.length - 1])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  // Filter popular courses that match search and aren't already added
  const filteredSuggestions = POPULAR_COURSES.filter(course => {
    const matchesSearch = course.toLowerCase().includes(inputValue.toLowerCase())
    const alreadySelected = selectedCourses.some(
      s => s.toLowerCase() === course.toLowerCase()
    )
    return matchesSearch && !alreadySelected
  })

  // Check if typed input is a new custom course (doesn't exist in suggestions)
  const isCustomCourse = Boolean(
    inputValue.trim() &&
    !selectedCourses.some(s => s.toLowerCase() === inputValue.trim().toLowerCase()) &&
    !POPULAR_COURSES.some(c => c.toLowerCase() === inputValue.trim().toLowerCase())
  )

  // Quick suggestions not yet selected
  const availableQuickPills = QUICK_SUGGESTIONS.filter(
    q => !selectedCourses.some(s => s.toLowerCase() === q.toLowerCase())
  )

  return (
    <div ref={containerRef} className={`space-y-2.5 relative ${className}`}>
      {/* Hidden input for standard HTML form compatibility */}
      <input 
        type="hidden" 
        name={name} 
        value={selectedCourses.join(', ')} 
        readOnly 
      />

      {/* Selected Course Chips */}
      {selectedCourses.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-muted/30 border border-border/50 rounded-xl">
          {selectedCourses.map((course, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 shadow-xs animate-in zoom-in-95 duration-150"
            >
              <GraduationCap className="w-3 h-3 shrink-0" />
              <span>{course}</span>
              <button
                type="button"
                onClick={() => removeCourse(course)}
                className="hover:bg-primary/20 p-0.5 rounded-full transition-colors cursor-pointer text-primary/80 hover:text-primary"
                title={`Remove ${course}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {selectedCourses.length > 1 && (
            <button
              type="button"
              onClick={() => onChange?.([])}
              className="text-[11px] font-medium text-muted-foreground hover:text-destructive px-2 py-1 rounded transition-colors cursor-pointer ml-auto"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Search & Custom Input Bar */}
      <div className="relative flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 bg-background border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground/60 transition-all"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            if (inputValue.trim()) {
              addCourse(inputValue.trim())
            }
          }}
          disabled={!inputValue.trim()}
          className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 rounded-xl text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-xs active:scale-98"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (filteredSuggestions.length > 0 || isCustomCourse) && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-card border border-border/70 rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-border/30 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Custom Course Add option */}
          {isCustomCourse && (
            <div
              className="px-3.5 py-2.5 text-sm font-semibold text-primary bg-primary/5 hover:bg-primary/10 cursor-pointer flex items-center justify-between group transition-colors"
              onMouseDown={(e) => {
                e.preventDefault()
                addCourse(inputValue.trim())
              }}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                <span>Add "{inputValue.trim()}" as custom course</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-primary/20 text-primary">
                Custom
              </span>
            </div>
          )}

          {/* Standard Matching Courses */}
          {filteredSuggestions.map((course, idx) => (
            <div
              key={idx}
              className="px-3.5 py-2 text-sm hover:bg-muted/70 cursor-pointer flex items-center justify-between text-foreground group transition-colors"
              onMouseDown={(e) => {
                e.preventDefault()
                addCourse(course)
              }}
            >
              <span className="font-medium group-hover:text-primary transition-colors">
                {course}
              </span>
              <span className="text-xs text-primary opacity-0 group-hover:opacity-100 font-semibold flex items-center gap-1 transition-opacity">
                <Plus className="w-3.5 h-3.5" /> Add
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Quick Suggestion Pills */}
      {availableQuickPills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-medium text-muted-foreground mr-1">Suggestions:</span>
          {availableQuickPills.slice(0, 6).map((qCourse, i) => (
            <button
              key={i}
              type="button"
              onClick={() => addCourse(qCourse)}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted/60 hover:bg-primary/15 hover:text-primary border border-border/40 text-muted-foreground transition-all cursor-pointer"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>{qCourse}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default CourseSelector
