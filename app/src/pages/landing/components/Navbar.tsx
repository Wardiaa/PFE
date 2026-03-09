import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Update scrolled state for background
      setScrolled(currentScrollY > 20);
      
      // Hide navbar when scrolling down past 200px, show when scrolling up
      // Using requestAnimationFrame for smoother performance
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
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${scrolled ? 'bg-indigo-600' : 'bg-slate-950'}`}>
            <span className="text-white font-black text-2xl">E</span>
          </div>
          <span className={`text-2xl font-display font-bold tracking-tight transition-colors duration-300 ${scrolled ? 'text-white' : 'text-slate-950'}`}>EngageLive</span>
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