import React from 'react';
import Button from '../common/Button';
import { Calendar, Package, Clock, ShieldCheck, Tag } from 'lucide-react';

const ServiceCard = ({ item, type = 'session', onSelect }) => {
  const isPackage = type === 'package';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {isPackage ? <Package className="w-3.5 h-3.5 text-teal-600" /> : <Clock className="w-3.5 h-3.5 text-teal-600" />}
            {isPackage ? `${item.sessionCount} Sessions Bundle` : `${item.duration || 50} Minutes Consultation`}
          </span>

          {isPackage && item.savingsPercentage && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Tag className="w-3 h-3" /> Save {item.savingsPercentage}%
            </span>
          )}
        </div>

        <h4 className="text-lg font-bold text-slate-900 mb-1">{item.name}</h4>
        <p className="text-xs text-slate-500 mb-4 line-clamp-2">{item.description}</p>

        {isPackage && (
          <div className="text-xs text-slate-500 mb-3 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <div className="flex justify-between">
              <span>Per session rate:</span>
              <span className="font-semibold text-slate-800">₹{item.perSessionRate}</span>
            </div>
            <div className="flex justify-between">
              <span>Validity:</span>
              <span className="font-semibold text-slate-800">{item.validityDays} Days</span>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-2">
        <div>
          <span className="text-xl font-extrabold text-slate-900">₹{item.price}</span>
          <span className="text-[11px] text-slate-400 block">+ 18% GST Inc.</span>
        </div>
        <Button variant={isPackage ? 'accent' : 'primary'} size="sm" onClick={() => onSelect(item, type)}>
          {isPackage ? 'Buy Package' : 'Select Slot'}
        </Button>
      </div>
    </div>
  );
};

export default ServiceCard;
