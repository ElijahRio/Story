import React from 'react';

const InputField = ({ label, colorClass, ...inputProps }) => {
  const id = React.useId();
  return (
    <div className="space-y-1.5 flex-1">
      <label htmlFor={id} className={`text-[10px] font-bold uppercase tracking-widest ${colorClass}`}>{label}</label>
      <input
        id={id}
        type="text"
        className="w-full bg-slate-950/50 border border-slate-800 rounded px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-slate-500 font-mono shadow-inner"
        {...inputProps}
      />
    </div>
  );
};

export default InputField;
