import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      setScrolled(currentScrollY > 20);
      
      requestAnimationFrame(() => {
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
          setHidden(true);
        } else {
          setHidden(false);
        }
      });
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-transform duration-400 ease-out pt-8 px-6 pointer-events-none ${
      hidden ? '-translate-y-full' : 'translate-y-0'
    }`}>
      <div 
        className={`max-w-7xl mx-auto flex justify-between items-center px-10 py-5 rounded-[2rem] transition-all duration-300 pointer-events-auto ${
          scrolled ? 'bg-slate-950/90 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 py-4' : 'bg-transparent'
        }`}
      >
        <Link to="/" className="flex items-center space-x-4 group cursor-pointer">
          {/* Logo icon – exact SVG with primary color */}
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300">
            <svg
              viewBox="16 6 70 89"
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid meet"
              className="fill-primary"
            >
              <path d="M52.0032727,91.1841818 L45.484,84.6649091 L85.3654545,84.6649091 L85.3654545,17.5625455 L80.836,17.5625455 L80.836,80.1354545 L45.484,80.1354545 L52.0032727,73.6161818 L48.8009091,70.4138182 L36.8161818,82.4001818 L48.8009091,94.3865455 L52.0032727,91.1841818 L52.0032727,91.1841818 Z M55.7456364,19.8272727 L48.8009091,26.7703636 L52.0032727,29.9727273 L63.9912727,17.988 L52.0032727,6 L48.8009091,9.20236364 L54.8963636,15.2994545 L16,15.2994545 L16,82.4001818 L20.5278182,82.4001818 L20.5278182,19.8272727 L55.7456364,19.8272727 L55.7456364,19.8272727 Z" />
            </svg>
          </div>
          <span className={`text-2xl font-display font-bold tracking-tight transition-colors duration-300 ${scrolled ? 'text-white' : 'text-slate-950'}`}>Syncra</span>
        </Link>
        
        <div className={`hidden lg:flex items-center space-x-12 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${scrolled ? 'text-slate-400' : 'text-slate-500'}`}>
          <a href="#features" className="hover:text-indigo-400 transition-colors">The Platform</a>
          <a href="#how-it-works" className="hover:text-indigo-400 transition-colors">Our Process</a>
          <Link to="/auth" className="hover:text-indigo-400 transition-colors">Sign in</Link>
        </div>

        <div className="flex items-center space-x-6">
          <Link to="/audience-participation">
            <button className={`hidden sm:flex items-center space-x-2 text-[11px] font-bold uppercase tracking-[0.2em] px-6 py-3 rounded-full border transition-all duration-200 ${
              scrolled ? 'text-white border-white/10 hover:bg-white/5' : 'text-slate-900 border-slate-200 hover:bg-slate-50'
            }`}>
              <span>Join</span>
            </button>
          </Link>
          <Link to="/create">
            <button className={`px-8 py-3.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-200 shadow-xl active:scale-95 ${
              scrolled ? 'bg-white text-slate-950 hover:bg-indigo-50' : 'bg-slate-950 text-white hover:bg-indigo-600 shadow-indigo-500/20'
            }`}>
              Create Session
            </button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;