import React, { useState } from 'react';
import { ArrowUpDown, User, Calendar, Tag, ChevronRight, FileText, MessageSquare } from 'lucide-react';
import Button from '../common/Button';

const STATUS_BADGES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  lead: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  archived: 'bg-slate-100 text-slate-600 border-slate-200',
};

const ClientTable = ({ clients, onSelectClient, onStartNote, onChatClient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = clients
    .filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm));
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      let valA = a[sortField] || '';
      let valB = b[sortField] || '';
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Table Filters & Search Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Search clients by name, email, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3.5 py-1.5 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-700"
          >
            <option value="all">All Clients</option>
            <option value="active">Active</option>
            <option value="lead">New Leads</option>
            <option value="completed">Completed Arc</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Table Header & Rows */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100 uppercase text-[11px] tracking-wider">
            <tr>
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-900"
                onClick={() => toggleSort('name')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Client Details</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-900"
                onClick={() => toggleSort('status')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4">Tags</th>
              <th
                className="py-3 px-4 cursor-pointer hover:text-slate-900"
                onClick={() => toggleSort('lastSessionDate')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Last Session</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Sessions</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length > 0 ? (
              filtered.map((client) => {
                const badgeClass = STATUS_BADGES[client.status] || STATUS_BADGES.active;
                return (
                  <tr
                    key={client._id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectClient(client)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight group-hover:text-teal-700 transition-colors">
                            {client.name}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{client.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize ${badgeClass}`}
                      >
                        {client.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {client.tags?.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {client.lastSessionDate ? (
                        <span>
                          {new Date(client.lastSessionDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      ) : (
                        <span className="text-slate-400">None yet</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {client.totalSessionsCount || 0}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onStartNote(client)}
                          title="Write clinical note"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onChatClient(client)}
                          title="Open real-time chat"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectClient(client)}
                          title="View complete record"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                  No clients match the specified search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientTable;
