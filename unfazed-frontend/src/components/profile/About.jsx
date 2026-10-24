import React from 'react';
import { Sparkles, CheckCircle2, BookOpen, Lock } from 'lucide-react';

const About = ({ therapist }) => {
  return (
    <div className="space-y-10">
      {/* Bio section */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <span>About My Practice & Philosophy</span>
        </h2>
        <div className="text-slate-700 leading-relaxed space-y-3 text-sm sm:text-base">
          <p>{therapist.bio}</p>
        </div>
      </div>

      {/* Specializations & Clinical Areas */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>Core Clinical Specializations</span>
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {therapist.specializations?.map((spec, idx) => (
            <span
              key={idx}
              className="px-3.5 py-1.5 rounded-xl bg-blue-50/80 text-blue-800 text-xs sm:text-sm font-medium border border-blue-200/70 flex items-center gap-1.5 shadow-2xs hover:bg-blue-100/70 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              {spec}
            </span>
          ))}
        </div>
      </div>

      {/* Education & Licensure */}
      {therapist.education && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 text-sm shadow-xs">
          <span className="font-semibold text-slate-800 block mb-1">Licensure & Credentials</span>
          <p className="text-slate-600">{therapist.education}</p>
        </div>
      )}

      {/* Privacy Guarantee */}
      <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/70 border border-blue-200/80 flex items-start gap-3 shadow-xs">
        <Lock className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm">
          <span className="font-bold text-blue-950 block">Strict Medical Confidentiality</span>
          <p className="text-blue-900 mt-1 leading-relaxed">
            All clinical notes, intake disclosures, and consultations are encrypted and strictly protected under the Indian Mental Healthcare Act, 2017. Clinical private reflections are never accessible by third parties.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
