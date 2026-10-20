import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { Calendar, Clock, Save, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

const Schedule = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [availability, setAvailability] = useState({
    bufferTime: 15,
    slotDurations: [30, 45, 50, 60],
    defaultDuration: 50,
    weeklySchedule: [],
    blockedDates: [],
  });

  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const [availRes, sessRes] = await Promise.all([
          api.get('/scheduling/availability'),
          api.get('/scheduling/sessions'),
        ]);

        if (availRes.data?.success) {
          setAvailability(availRes.data.availability);
        }
        if (sessRes.data?.success) {
          setSessions(sessRes.data.sessions || []);
        }
      } catch (err) {
        console.error('Failed to load scheduling data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const handleDayToggle = (dayIndex) => {
    const updated = availability.weeklySchedule.map((d) => {
      if (d.dayOfWeek === dayIndex) {
        return {
          ...d,
          enabled: !d.enabled,
          slots: !d.enabled && d.slots.length === 0 ? [{ startTime: '09:00', endTime: '18:00' }] : d.slots,
        };
      }
      return d;
    });
    setAvailability({ ...availability, weeklySchedule: updated });
  };

  const handleSlotChange = (dayIndex, slotIndex, field, value) => {
    const updated = availability.weeklySchedule.map((d) => {
      if (d.dayOfWeek === dayIndex) {
        const newSlots = [...d.slots];
        newSlots[slotIndex] = { ...newSlots[slotIndex], [field]: value };
        return { ...d, slots: newSlots };
      }
      return d;
    });
    setAvailability({ ...availability, weeklySchedule: updated });
  };

  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.put('/scheduling/availability', availability);
      if (res.data?.success) {
        setSuccessMsg('Weekly availability and buffer rules updated successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Failed to save availability settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loader text="Loading availability schedule..." />;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-teal-600" />
            <span>Practice Availability & Buffer Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure weekly working hours, session durations, and inter-session buffer intervals.
          </p>
        </div>

        <Button variant="primary" icon={Save} onClick={handleSave} loading={saving}>
          Save Schedule Changes
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs sm:text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs sm:text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Buffer & Duration Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <Clock className="w-5 h-5 text-teal-600" />
          <span>Slot Timing & Buffer Controls</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Buffer Time */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Inter-Session Buffer (Minutes)
            </label>
            <p className="text-[11px] text-slate-500">
              Buffer period required between consecutive sessions for notes & mental decompression.
            </p>
            <div className="flex gap-2 pt-1">
              {[0, 10, 15, 20, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setAvailability({ ...availability, bufferTime: mins })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    availability.bufferTime === mins
                      ? 'border-teal-600 bg-teal-600 text-white shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {mins === 0 ? 'No Buffer' : `${mins} min`}
                </button>
              ))}
            </div>
          </div>

          {/* Session Durations */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Offered Session Durations
            </label>
            <p className="text-[11px] text-slate-500">
              Available durations that clients can book on your profile.
            </p>
            <div className="flex gap-2 pt-1">
              {[30, 45, 50, 60, 90].map((dur) => {
                const isSelected = availability.slotDurations?.includes(dur);
                return (
                  <button
                    key={dur}
                    type="button"
                    onClick={() => {
                      const cur = availability.slotDurations || [];
                      const updated = isSelected ? cur.filter((x) => x !== dur) : [...cur, dur];
                      setAvailability({ ...availability, slotDurations: updated });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50 text-teal-800'
                        : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    {dur}m
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Schedule Days */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Recurring Weekly Hours</h3>

        <div className="divide-y divide-slate-100">
          {availability.weeklySchedule?.map((day) => (
            <div
              key={day.dayOfWeek}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 w-40">
                <input
                  type="checkbox"
                  id={`day_${day.dayOfWeek}`}
                  checked={day.enabled}
                  onChange={() => handleDayToggle(day.dayOfWeek)}
                  className="w-4 h-4 text-teal-600 rounded-sm focus:ring-teal-500 border-slate-300 cursor-pointer"
                />
                <label
                  htmlFor={`day_${day.dayOfWeek}`}
                  className={`text-sm font-bold cursor-pointer ${
                    day.enabled ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  {day.dayName}
                </label>
              </div>

              {day.enabled ? (
                <div className="flex-1 flex flex-wrap items-center gap-3">
                  {day.slots?.map((slot, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-2 text-xs">
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          handleSlotChange(day.dayOfWeek, sIdx, 'startTime', e.target.value)
                        }
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          handleSlotChange(day.dayOfWeek, sIdx, 'endTime', e.target.value)
                        }
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 text-xs text-slate-400 italic">Unavailable / Clinic Closed</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Booked Sessions View */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Booked Sessions & Appointments</h3>
        <div className="divide-y divide-slate-100">
          {sessions.length > 0 ? (
            sessions.map((sess) => (
              <div key={sess._id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{sess.clientName}</p>
                  <p className="text-slate-500">
                    {new Date(sess.startTime).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}{' '}
                    • {sess.duration} mins
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-semibold uppercase text-[10px] ${
                      sess.status === 'confirmed'
                        ? 'bg-blue-50 text-blue-700'
                        : sess.status === 'completed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {sess.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-6 text-center">No booked appointments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
