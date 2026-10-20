import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const RevenueChart = ({ data }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-900 text-sm sm:text-base">Practice Revenue Trend</h4>
          <p className="text-xs text-slate-500">Aggregated via MongoDB pipeline</p>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis
              tickLine={false}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(v) => `₹${v}`}
            />
            <Tooltip
              formatter={(value) => [`₹${value}`, 'Revenue']}
              contentStyle={{
                backgroundColor: '#1e293b',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '12px',
                border: 'none',
              }}
              itemStyle={{ color: '#5eead4' }}
            />
            <Bar dataKey="revenue" fill="#0d9488" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;
