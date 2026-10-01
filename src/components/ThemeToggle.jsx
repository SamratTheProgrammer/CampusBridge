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
    if (theme === 'dark') return <Moon className="w-[18px] h-[18px]" />;
    if (theme === 'light') return <Sun className="w-[18px] h-[18px]" />;
    return <Monitor className="w-[18px] h-[18px]" />; // system
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-9 h-9 rounded-xl hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center cursor-pointer"
        title="Toggle theme"
        aria-label="Toggle theme"
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
