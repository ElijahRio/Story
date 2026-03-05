import React from 'react';
import { CornerDownRight } from 'lucide-react';

const TextAreaField = ({ label, value, onChange, colorClass, placeholder, detectedLinks, onNavigate }) => (
  <div className="space-y-1.5 flex-1 flex flex-col">
    <label className={`text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>{label}</label>
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-28 bg-slate-950/50 border border-slate-800 rounded p-3 text-sm text-slate-300 focus:outline-none focus:border-slate-500 resize-none font-mono leading-relaxed shadow-inner"
      placeholder={placeholder}
    />

    {/* Dynamic Link Rendering */}
    {detectedLinks && detectedLinks.length > 0 && (
      <div className="flex flex-wrap gap-1.5 pt-1">
        {detectedLinks.map(link => (
          <button
            key={link.id}
            onClick={() => onNavigate(link.id)}
            className="text-[9px] uppercase tracking-widest px-2 py-1 bg-teal-950/20 hover:bg-teal-900/40 text-teal-500 hover:text-teal-400 border border-teal-900/50 hover:border-teal-700 rounded flex items-center gap-1 font-mono transition-colors shadow-sm"
            title={`Maps to ${link.name}`}
          >
            <CornerDownRight size={10} /> {link.name}
          </button>
        ))}
      </div>
    )}
  </div>
);

export default TextAreaField;