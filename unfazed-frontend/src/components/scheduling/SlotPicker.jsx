import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import Button from '../common/Button';
import { Calendar as CalendarIcon, Clock, Globe, AlertCircle, Check, UserPlus } from 'lucide-react';

const COMMON_TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST - Asia/Kolkata)' },
  { value: 'America/New_York', label: 'Eastern Time (ET - New York)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT - Los Angeles)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT / BST - London)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST - Dubai)' },
  { value: 'Asia/Singapore', label: 'Singapore Time (SGT - Singapore)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern (AEST - Sydney)' },
];

const SlotPicker = ({ therapistSlug, therapistId, onSlotSelect, onJoinWaitlist }) => {
  // Client's detected local timezone
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
  const [selectedTimezone, setSelectedTimezone] = useState(userTimezone);

  // Default to today or tomorrow
  const getTodayStr = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [selectedDuration, setSelectedDuration] = useState(50);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [therapistTz, setTherapistTz] = useState('Asia/Kolkata');

  // Next 14 days dates for quick selection
  const candidateDates = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  });

  useEffect(() => {
    const fetchSlots = async () => {
      setLoading(true);
      setSelectedSlot(null);
      try {
        const res = await api.get('/scheduling/public-slots', {
          params: {
            therapistSlug,
            therapistId,
            date: selectedDate,
            duration: selectedDuration,
          },
        });
        if (res.data?.success) {
          setSlots(res.data.slots || []);
          if (res.data.therapistTimezone) {
            setTherapistTz(res.data.therapistTimezone);
          }
        }
      } catch (err) {
        console.error('Failed to load slots', err);
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    if (selectedDate && (therapistSlug || therapistId)) {
      fetchSlots();
    }
  }, [selectedDate, selectedDuration, therapistSlug, therapistId]);

  // Format slot start time into client's selected timezone
  const formatSlotTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: selectedTimezone,
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    if (onSlotSelect) {
      onSlotSelect({
        ...slot,
        date: selectedDate,
        duration: selectedDuration,
        timezone: selectedTimezone,
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
      {/* Header and Timezone selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-teal-600" />
            <span>Select Date & Time</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Times automatically adjusted to your local timezone.
          </p>
        </div>

        {/* Timezone picker */}
        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700">
          <Globe className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedTimezone}
            onChange={(e) => setSelectedTimezone(e.target.value)}
            className="bg-transparent focus:outline-none cursor-pointer text-xs font-medium text-slate-800"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Carousel / Horizontal Selector */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">Upcoming Dates</label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {candidateDates.map((item) => {
            const isSelected = selectedDate === item.dateStr;
            return (
              <button
                key={item.dateStr}
                onClick={() => setSelectedDate(item.dateStr)}
                className={`flex flex-col items-center min-w-[70px] p-2.5 rounded-xl border transition-all shrink-0 ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50 text-teal-800 font-semibold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                }`}
              >
                <span className="text-[11px] uppercase tracking-wider">{item.dayName}</span>
                <span className="text-base font-bold my-0.5">{item.dayNumber}</span>
                <span className="text-[10px] text-slate-400">{item.month}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Duration selector */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-500 font-medium flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration:
        </span>
        {[30, 45, 50, 60].map((dur) => (
          <button
            key={dur}
            onClick={() => setSelectedDuration(dur)}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              selectedDuration === dur
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {dur}m
          </button>
        ))}
      </div>

      {/* Slot Grid */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-2">Available Slots</label>

        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
            Checking therapist calendar and slot buffer times...
          </div>
        ) : slots.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
            {slots.map((slot, idx) => {
              const isSelected = selectedSlot?.startTime === slot.startTime;
              const formatted = formatSlotTime(slot.startTime);

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectSlot(slot)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'border-teal-600 bg-teal-600 text-white shadow-sm ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-slate-700 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  <span>{formatted}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-3">
            <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
            <div className="text-xs text-slate-600 max-w-xs mx-auto">
              No open slots available on {new Date(selectedDate).toDateString()}. All appointment slots are booked or therapist is out of clinic.
            </div>
            {onJoinWaitlist && (
              <Button
                variant="outline"
                size="sm"
                icon={UserPlus}
                onClick={() => onJoinWaitlist(selectedDate)}
              >
                Join Waitlist for This Date
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlotPicker;
