import React from 'react';
import Button from '../common/Button';
import { Package, Clock, Tag } from 'lucide-react';

const ServiceCard = ({ item, type = 'session', onSelect }) => {
  const isPackage = type === 'package';

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs hover:shadow-lg hover:border-blue-200 transition-all duration-200 flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            {isPackage ? <Package className="w-3.5 h-3.5 text-blue-600" /> : <Clock className="w-3.5 h-3.5 text-blue-600" />}
            {isPackage ? `${item.sessionCount} Sessions Bundle` : `${item.duration || 50} Minutes Consultation`}
          </span>

          {isPackage && item.savingsPercentage && (
            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Tag className="w-3 h-3 text-blue-600" /> Save {item.savingsPercentage}%
            </span>
          )}
        </div>

        <h4 className="text-lg font-bold text-slate-900 mb-1.5 group-hover:text-blue-600 transition-colors">{item.name}</h4>
        <p className="text-xs text-slate-500 mb-4 line-clamp-2 leading-relaxed">{item.description}</p>

        {isPackage && (
          <div className="text-xs text-slate-600 mb-4 space-y-1.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
            <div className="flex justify-between">
              <span className="text-slate-500">Per session rate:</span>
              <span className="font-bold text-slate-800">₹{item.perSessionRate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Validity:</span>
              <span className="font-bold text-slate-800">{item.validityDays} Days</span>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-2">
        <div>
          <span className="text-2xl font-extrabold text-slate-900">₹{item.price}</span>
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
