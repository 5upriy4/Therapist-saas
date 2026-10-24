import React from 'react';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue' }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80 shadow-2xs',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200/80 shadow-2xs',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80 shadow-2xs',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-2xs',
    sky: 'bg-sky-50 text-sky-700 border-sky-200/80 shadow-2xs',
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        {subtitle && <p className="text-[11px] text-slate-400 font-medium">{subtitle}</p>}
      </div>

      {Icon && (
        <div className={`p-3 sm:p-3.5 rounded-2xl border shrink-0 ${colorMap[color] || colorMap.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
