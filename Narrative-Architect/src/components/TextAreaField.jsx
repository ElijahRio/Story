import React from 'react';

/**
 * Reusable Text Area Component for Dynamic Fields
 *
 * @param {Object} props
 * @param {string} props.label - The label for the field
 * @param {string} props.value - The current value of the textarea
 * @param {function} props.onChange - Callback function when value changes
 * @param {string} props.colorClass - Tailwind CSS class for label coloring
 * @param {string} props.placeholder - Placeholder text for the textarea
 */
const TextAreaField = ({ label, value, onChange, colorClass, placeholder }) => (
  <div className="space-y-1.5 mb-4">
    <label className={`text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-20 bg-slate-950/50 border border-slate-800 rounded p-3 text-sm text-slate-300 focus:outline-none focus:border-slate-500 resize-none font-mono"
      placeholder={placeholder}
    />
  </div>
);

export default TextAreaField;
