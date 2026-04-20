import React from 'react';

const TrustedBy: React.FC = () => {
  return (
    <div className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 text-center mb-10">
        <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Ideal for</p>
      </div>
      <div className="flex space-x-16 animate-marquee whitespace-nowrap opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex space-x-16 items-center">
            {['Classrooms', 'Workshops', 'Conferences', 'Team Meetings', 'Webinars', 'Training Sessions'].map((item) => (
              <span key={item} className="text-3xl font-display font-bold text-slate-900">{item}</span>
            ))}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default TrustedBy;
