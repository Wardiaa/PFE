import React from 'react';
import { Link } from 'react-router-dom';

const CTASection: React.FC = () => {
  return (
    <section className="h-screen flex flex-col items-center justify-center bottom-12 bg-white text-black rounded-t-[60px] relative z-100 px-6 -mt-2 border-t-4 border-white">
      {/* Temporary red border to see where the section starts */}
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-5xl md:text-8xl font-bold tracking-tighter mb-6 leading-tight">
          Ready to make your sessions <br className="hidden md:block" /> truly interactive?
        </h2>
        <p className="text-xl text-zinc-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Join thousands of presenters who use Syncra to bridge the gap between speaker and audience.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/create">
          <button className="px-12 py-5 bg-black text-white rounded-full font-bold text-lg hover:scale-105 transition-transform active:scale-95 shadow-xl">
            Host for Free
          </button>
          </Link>
          <Link to="/audience-participation">
          <button className="px-12 py-5 bg-transparent text-black rounded-full font-bold text-lg border-2 border-black hover:bg-black hover:text-white transition-colors">
            join
          </button>
          </Link>
        </div>
        <p className="mt-8 text-zinc-500 text-sm font-medium">
          No credit card required. Up to 10 participants free forever.
        </p>
      </div>
    </section>
  );
};

export default CTASection;