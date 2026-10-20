import React from 'react';
import Button from '../common/Button';
import { Calendar, ShieldCheck, MapPin, Globe, Award, Sparkles, MessageSquare } from 'lucide-react';

const Hero = ({ therapist, onBookClick, onInquireClick }) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-teal-50/70 via-white to-slate-50 border-b border-slate-200">
      {/* Background soft blur decoration */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-72 h-72 bg-indigo-100/30 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 relative">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
          {/* Avatar / Profile photo with verified badge */}
          <div className="relative shrink-0">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden ring-4 ring-white shadow-xl border border-slate-100 bg-slate-100">
              <img
                src={
                  therapist.profileImage ||
                  'https://images.unsplash.com/photo-1594824813511-13c54c340795?auto=format&fit=crop&w=600&q=80'
                }
                alt={therapist.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-1.5 rounded-xl shadow-md border-2 border-white flex items-center gap-1 text-[11px] font-semibold px-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Practice</span>
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-100/70 text-teal-800">
              <Award className="w-3.5 h-3.5" />
              <span>{therapist.experienceYears}+ Years Clinical Experience</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {therapist.name}
            </h1>

            <p className="text-base sm:text-lg text-teal-700 font-medium">
              {therapist.title}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-4 text-xs text-slate-600 pt-1">
              {therapist.address?.city && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{therapist.address.city}, {therapist.address.state}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>Languages: {therapist.languages?.join(', ')}</span>
              </div>
            </div>

            {/* Fee summary badge */}
            <div className="pt-2 flex flex-wrap items-baseline justify-center md:justify-start gap-2">
              <span className="text-2xl font-bold text-slate-900">
                ₹{therapist.sessionFee || 1500}
              </span>
              <span className="text-xs text-slate-500">
                per {therapist.sessionDuration || 50}-minute individual consultation
              </span>
            </div>

            {/* Call to Action Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3">
              <Button
                variant="primary"
                size="lg"
                icon={Calendar}
                onClick={onBookClick}
                className="w-full sm:w-auto shadow-md"
              >
                Book a Session
              </Button>
              <Button
                variant="secondary"
                size="lg"
                icon={MessageSquare}
                onClick={onInquireClick}
                className="w-full sm:w-auto"
              >
                Send an Inquiry
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
