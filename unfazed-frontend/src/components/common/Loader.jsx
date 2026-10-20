import React from 'react';

const Loader = ({ text = 'Loading practice data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <div className="w-10 h-10 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      <p className="text-sm font-medium text-slate-500 animate-pulse">{text}</p>
    </div>
  );
};

export default Loader;
