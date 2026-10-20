import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'teal', trend }) => {
  const colorMap = {
    teal: 'bg-teal-50 text-teal-700 border-teal-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
      </div>

      {Icon && (
        <div className={`p-3 rounded-2xl border shrink-0 ${colorMap[color] || colorMap.teal}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
