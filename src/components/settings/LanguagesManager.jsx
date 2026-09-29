import React, { useState } from 'react';
import { Languages, Plus, X, Edit2, Check, Sparkles } from 'lucide-react';

const COMMON_LANGUAGES = [
  'English', 'Hindi', 'Bengali', 'Marathi', 'Telugu', 'Tamil',
  'Gujarati', 'Urdu', 'Kannada', 'Malayalam', 'Punjabi', 'Odia',
  'Spanish', 'French', 'German', 'Japanese', 'Arabic', 'Russian', 'Mandarin'
];

const PROFICIENCY_LEVELS = [
  { value: 'Basic', label: 'Basic (Beginner / Elementary)', badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' },
  { value: 'Intermediate', label: 'Intermediate (Conversational)', badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30' },
  { value: 'Advanced', label: 'Advanced (Fluent / Professional)', badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  { value: 'Native', label: 'Native (Mother Tongue / Bilingual)', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' }
];

export const getProficiencyBadgeClass = (level) => {
  const found = PROFICIENCY_LEVELS.find(p => p.value.toLowerCase() === (level || '').toLowerCase());
  return found ? found.badgeClass : 'bg-primary/10 text-primary border-primary/20';
};

const LanguagesManager = ({ languages = [], onChange }) => {
  const [langName, setLangName] = useState('');
  const [proficiency, setProficiency] = useState('Intermediate');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const handleAddOrUpdate = (e) => {
    if (e) e.preventDefault();
    const trimmed = langName.trim();
    if (!trimmed) return;

    let updated = [...languages];
    if (editIndex !== null) {
      updated[editIndex] = { language: trimmed, proficiency };
      setEditIndex(null);
    } else {
      // Check if already exists, update proficiency
      const existingIdx = updated.findIndex(
        (l) => l.language.toLowerCase() === trimmed.toLowerCase()
      );
      if (existingIdx >= 0) {
        updated[existingIdx] = { language: trimmed, proficiency };
      } else {
        updated.push({ language: trimmed, proficiency });
      }
    }

    onChange(updated);
    setLangName('');
    setProficiency('Intermediate');
    setShowSuggestions(false);
  };

  const handleRemove = (index) => {
    const updated = languages.filter((_, i) => i !== index);
    if (editIndex === index) {
      setEditIndex(null);
      setLangName('');
    }
    onChange(updated);
  };

  const handleStartEdit = (index) => {
    setEditIndex(index);
    setLangName(languages[index].language);
    setProficiency(languages[index].proficiency || 'Intermediate');
  };

  const filteredSuggestions = COMMON_LANGUAGES.filter(
    (l) =>
      l.toLowerCase().includes(langName.toLowerCase()) &&
      !languages.some((existing) => existing.language.toLowerCase() === l.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <Languages className="w-4 h-4 text-primary" /> Languages Known & Spoken
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Showcase the languages you know and your proficiency level (Basic, Intermediate, Advanced, Native).
        </p>
      </div>

      {/* Input Row */}
      <div className="bg-muted/30 border border-border/50 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          {/* Language Name with autocomplete */}
          <div className="sm:col-span-6 relative">
            <label className="text-xs font-semibold text-foreground mb-1 block">Language</label>
            <input
              type="text"
              value={langName}
              onChange={(e) => {
                setLangName(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddOrUpdate(e);
              }}
              placeholder="e.g. English, Bengali, Hindi, German"
              className="w-full bg-background border border-border/50 rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />

            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-card border border-border/60 rounded-xl shadow-xl max-h-44 overflow-y-auto p-1 text-xs">
                {filteredSuggestions.slice(0, 8).map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setLangName(sug);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-muted text-foreground flex items-center justify-between cursor-pointer"
                  >
                    <span>{sug}</span>
                    <span className="text-[10px] text-primary font-semibold">+ Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Proficiency Level Dropdown */}
          <div className="sm:col-span-4">
            <label className="text-xs font-semibold text-foreground mb-1 block">Proficiency Level</label>
            <select
              value={proficiency}
              onChange={(e) => setProficiency(e.target.value)}
              className="w-full bg-background border border-border/50 rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium cursor-pointer"
            >
              {PROFICIENCY_LEVELS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.value} ({p.label.split('(')[1]?.replace(')', '') || p.value})
                </option>
              ))}
            </select>
          </div>

          {/* Add / Update Button */}
          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddOrUpdate}
              disabled={!langName.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {editIndex !== null ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Save
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Add
                </>
              )}
            </button>
            {editIndex !== null && (
              <button
                type="button"
                onClick={() => {
                  setEditIndex(null);
                  setLangName('');
                  setProficiency('Intermediate');
                }}
                className="py-2.5 px-3 rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 text-xs font-semibold cursor-pointer"
                title="Cancel Edit"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Languages List */}
      <div className="pt-1">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
          Your Known Languages ({languages.length})
        </label>

        {languages.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {languages.map((item, idx) => {
              const badgeClass = getProficiencyBadgeClass(item.proficiency);
              return (
                <div
                  key={idx}
                  className="bg-card border border-border/60 hover:border-border rounded-xl px-3.5 py-2 flex items-center gap-2.5 shadow-2xs group transition-all"
                >
                  <span className="font-bold text-xs text-foreground">{item.language}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${badgeClass}`}
                  >
                    {item.proficiency || 'Intermediate'}
                  </span>

                  <div className="flex items-center gap-1 ml-1 text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(idx)}
                      className="p-1 rounded-md hover:bg-muted hover:text-blue-500 transition-colors cursor-pointer"
                      title="Edit Language"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="p-1 rounded-md hover:bg-muted hover:text-destructive transition-colors cursor-pointer"
                      title="Remove Language"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-muted-foreground italic bg-muted/20 border border-border/30 rounded-xl p-3 text-center">
            No languages added yet. Add languages you can speak or write to enhance your profile completeness!
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguagesManager;
