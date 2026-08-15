import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from './ThemeProvider';

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = () => {
    if (theme === 'dark') return <Moon className="w-5 h-5" />;
    if (theme === 'light') return <Sun className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />; // system
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors flex items-center justify-center"
        title="Toggle theme"
      >
        {getIcon()}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2">
          <button
            onClick={() => { setTheme('light'); setIsOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${theme === 'light' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'}`}
          >
            <Sun className="w-4 h-4" /> Light
          </button>
          <button
            onClick={() => { setTheme('dark'); setIsOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${theme === 'dark' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'}`}
          >
            <Moon className="w-4 h-4" /> Dark
          </button>
          <button
            onClick={() => { setTheme('system'); setIsOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${theme === 'system' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'}`}
          >
            <Monitor className="w-4 h-4" /> System
          </button>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
