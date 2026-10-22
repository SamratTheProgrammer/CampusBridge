import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Country, State, City } from 'country-state-city'
import { MapPin, ChevronDown, Check, Search, X, Globe, Building2, Navigation } from 'lucide-react'

// Internal Searchable Dropdown for Country, State, and City
const SearchableSelect = ({
  label,
  sublabel,
  value,
  placeholder,
  disabledPlaceholder,
  disabled = false,
  options = [], // [{ label, value, flag, subtitle }]
  onChange,
  allowCustom = false,
  customOptionLabel = 'Use custom',
  icon: Icon
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef(null)
  const searchInputRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Focus search input when opening
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('')
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return options
    return options.filter(opt => 
      opt.label.toLowerCase().includes(q) || 
      (opt.subtitle && opt.subtitle.toLowerCase().includes(q))
    )
  }, [options, searchTerm])

  const selectedOption = useMemo(() => {
    return options.find(opt => opt.value.toLowerCase() === (value || '').toLowerCase()) || 
      (value ? { label: value, value, flag: null } : null)
  }, [options, value])

  const handleSelect = (optValue) => {
    onChange(optValue)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setSearchTerm('')
  }

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      <label className="text-xs font-medium text-foreground flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
          {label}
        </span>
        {sublabel && <span className="text-[11px] text-muted-foreground font-normal">{sublabel}</span>}
      </label>

      {/* Selector Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm text-left transition-all ${
          disabled 
            ? 'bg-muted/40 border-border/30 text-muted-foreground/60 cursor-not-allowed' 
            : isOpen 
              ? 'bg-background border-primary ring-2 ring-primary/20 text-foreground shadow-sm' 
              : 'bg-background border-border/60 hover:border-border text-foreground'
        }`}
      >
        <span className="flex items-center gap-2 truncate pr-2">
          {selectedOption?.flag && <span className="text-base shrink-0 leading-none">{selectedOption.flag}</span>}
          {selectedOption ? (
            <span className="font-medium truncate">{selectedOption.label}</span>
          ) : (
            <span className="text-muted-foreground truncate">{disabled ? disabledPlaceholder : placeholder}</span>
          )}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Floating Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border/80 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Bar */}
          <div className="p-2 border-b border-border/40 bg-muted/30">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full bg-background border border-border/50 rounded-lg pl-8 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/70"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto overscroll-contain py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = (value || '').toLowerCase() === opt.value.toLowerCase()
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-foreground hover:bg-muted/70'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {opt.flag && <span className="text-sm shrink-0 leading-none">{opt.flag}</span>}
                      <span className="truncate">{opt.label}</span>
                      {opt.subtitle && <span className="text-[10px] text-muted-foreground shrink-0">({opt.subtitle})</span>}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
                  </button>
                )
              })
            ) : (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                <p>No matching {label.toLowerCase()} found.</p>
                {allowCustom && searchTerm.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSelect(searchTerm.trim())}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    <span>{customOptionLabel} &quot;{searchTerm.trim()}&quot;</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function WorldwideLocationSelector({
  country = '',
  state = '',
  city = '',
  address = '',
  onChange,
  className = ''
}) {
  // All worldwide countries (250 countries)
  const allCountries = useMemo(() => {
    return Country.getAllCountries().map(c => ({
      label: c.name,
      value: c.name,
      flag: c.flag,
      isoCode: c.isoCode
    }))
  }, [])

  // Find currently selected country object
  const selectedCountryObj = useMemo(() => {
    if (!country) return null
    return allCountries.find(c => c.value.toLowerCase() === country.toLowerCase()) || null
  }, [allCountries, country])

  // States of currently selected country
  const countryStates = useMemo(() => {
    if (!selectedCountryObj?.isoCode) return []
    const rawStates = State.getStatesOfCountry(selectedCountryObj.isoCode)
    return rawStates.map(s => ({
      label: s.name,
      value: s.name,
      isoCode: s.isoCode
    }))
  }, [selectedCountryObj])

  // Find currently selected state object
  const selectedStateObj = useMemo(() => {
    if (!state || !countryStates.length) return null
    return countryStates.find(s => s.value.toLowerCase() === state.toLowerCase()) || null
  }, [countryStates, state])

  // Cities of currently selected state
  const stateCities = useMemo(() => {
    if (!selectedCountryObj?.isoCode || !selectedStateObj?.isoCode) return []
    const rawCities = City.getCitiesOfState(selectedCountryObj.isoCode, selectedStateObj.isoCode)
    return rawCities.map(c => ({
      label: c.name,
      value: c.name
    }))
  }, [selectedCountryObj, selectedStateObj])

  // Handlers for cascading selections
  const handleCountryChange = (newCountry) => {
    const updatedLocation = [city, state, newCountry].filter(Boolean).join(', ')
    onChange({
      country: newCountry,
      state: '', // reset state when country changes
      city: '',  // reset city when country changes
      address,
      location: newCountry ? updatedLocation : ''
    })
  }

  const handleStateChange = (newState) => {
    const updatedLocation = [city, newState, country].filter(Boolean).join(', ')
    onChange({
      country,
      state: newState,
      city: '', // reset city when state changes
      address,
      location: updatedLocation
    })
  }

  const handleCityChange = (newCity) => {
    const updatedLocation = [newCity, state, country].filter(Boolean).join(', ')
    onChange({
      country,
      state,
      city: newCity,
      address,
      location: updatedLocation
    })
  }

  const handleAddressChange = (e) => {
    const newAddress = e.target.value
    const updatedLocation = [city, state, country].filter(Boolean).join(', ')
    onChange({
      country,
      state,
      city,
      address: newAddress,
      location: updatedLocation
    })
  }

  return (
    <div className={`space-y-4 bg-muted/20 border border-border/50 rounded-2xl p-4 sm:p-5 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <MapPin className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Location & Address
          </h3>
          <p className="text-xs text-muted-foreground">
            Specify your location and street address details
          </p>
        </div>
      </div>

      {/* Cascading Dropdowns & Address Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* 1. Country Selection */}
        <SearchableSelect
          label="Country"
          value={country}
          placeholder="Select Country..."
          options={allCountries}
          onChange={handleCountryChange}
          icon={Globe}
        />

        {/* 2. State / Province Selection (Populated according to Country) */}
        <SearchableSelect
          label="State / Province"
          value={state}
          placeholder={country ? "Select State / Province..." : "Select Country first"}
          disabledPlaceholder="Select Country first"
          disabled={!country}
          options={countryStates}
          onChange={handleStateChange}
          allowCustom={true}
          customOptionLabel="Use custom state"
          icon={Navigation}
        />

        {/* 3. City / District Selection (Populated according to Country & State) */}
        <SearchableSelect
          label="City / Town"
          value={city}
          placeholder={state ? "Select City / Town..." : "Select State first"}
          disabledPlaceholder="Select State first"
          disabled={!state}
          options={stateCities}
          onChange={handleCityChange}
          allowCustom={true}
          customOptionLabel="Use custom city"
          icon={Building2}
        />

        {/* 4. Street Address Input (Free-form text input) */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
            Street Address / Campus
          </label>
          <input
            type="text"
            value={address}
            onChange={handleAddressChange}
            placeholder="e.g. 123 Main St, Sector V, Salt Lake"
            className="w-full bg-background border border-border/60 hover:border-border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 text-xs sm:text-sm text-foreground transition-all placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      {/* Helper Preview Chip */}
      {(city || state || country) && (
        <div className="pt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground/80">Selected Location:</span>
          <span className="inline-flex items-center gap-1 bg-background px-2.5 py-1 rounded-md border border-border/40 font-mono text-xs text-foreground">
            {selectedCountryObj?.flag && <span>{selectedCountryObj.flag}</span>}
            {[city, state, country].filter(Boolean).join(', ')}
          </span>
        </div>
      )}
    </div>
  )
}
