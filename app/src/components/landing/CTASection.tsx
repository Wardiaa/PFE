
import React from 'react';

const CTASection: React.FC = () => {
  return (
    <section className="py-32 px-6">
      <div className="max-w-5xl mx-auto bg-indigo-600 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden">
        {/* Background blobs for depth */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-400 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-rose-400 rounded-full blur-3xl opacity-20 translate-x-1/3 translate-y-1/3"></div>

        <div className="relative z-10">
          <h2 className="text-4xl md:text-6xl font-display text-white mb-8 leading-tight">
            Ready to make your sessions <br className="hidden md:block" /> truly interactive?
          </h2>
          <p className="text-xl text-indigo-100 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of presenters who use EngageLive to bridge the gap between speaker and audience.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button className="w-full sm:w-auto px-10 py-5 bg-white text-indigo-600 rounded-full font-bold text-lg hover:bg-slate-50 transition-all shadow-xl shadow-indigo-900/40">
              Host for Free
            </button>
            <button className="w-full sm:w-auto px-10 py-5 bg-indigo-500 text-white rounded-full font-bold text-lg hover:bg-indigo-400 border border-indigo-400 transition-all">
              Schedule Demo
            </button>
          </div>
          <p className="mt-8 text-indigo-200/60 text-sm font-medium">
            No credit card required. Up to 10 participants free forever.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
