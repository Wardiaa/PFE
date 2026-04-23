import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

interface NavbarProps {
  variant?: 'landing' | 'audience';
}

const Navbar: React.FC<NavbarProps> = ({ variant = 'landing' }) => {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (variant === 'landing') {
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
    }
  }, [lastScrollY, variant]);

  // Close mobile menu when route changes / user scrolls
  useEffect(() => {
    if (menuOpen) setMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hidden]);

  const isAudience = variant === 'audience';
  const isDark = !isAudience && scrolled;
  const shouldHide = variant === 'landing' && hidden;

  return (
    <>
      <nav
        className={`${isAudience ? 'relative' : 'fixed'} top-0 left-0 right-0 z-[100] transition-transform duration-400 ease-out ${isAudience ? 'pt-4' : 'pt-8'} px-6 pointer-events-none ${
          shouldHide ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div
          className={`max-w-7xl mx-auto flex justify-between items-center px-6 sm:px-10 py-5 rounded-[2rem] transition-all duration-300 pointer-events-auto ${
            isAudience
              ? 'bg-background'
              : isDark
                ? 'bg-slate-950/90 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 py-4'
                : 'bg-transparent'
          }`}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-4 group cursor-pointer">
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
            <span
              className={`text-2xl font-display font-bold tracking-tight transition-colors duration-300 ${
                isAudience
                  ? 'text-foreground'
                  : isDark
                    ? 'text-white'
                    : 'text-slate-950'
              }`}
            >
              Syncra
            </span>
          </Link>

          {/* Landing page nav — desktop */}
          {variant === 'landing' && (
            <>
              <div
                className={`hidden lg:flex items-center space-x-12 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors duration-300 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                <a href="#features" className="hover:text-indigo-400 transition-colors">
                  The Platform
                </a>
                <a href="#how-it-works" className="hover:text-indigo-400 transition-colors">
                  Our Process
                </a>

                {user ? (
                  <Link to="/dashboard" className="hover:text-indigo-400 transition-colors">
                    Dashboard
                  </Link>
                ) : (
                  <Link to="/auth" className="hover:text-indigo-400 transition-colors">
                    Sign in
                  </Link>
                )}
              </div>

              <div className="hidden lg:flex items-center space-x-6">
                <Link to="/audience-participation">
                  <button
                    className={`hidden sm:flex items-center space-x-2 text-[11px] font-bold uppercase tracking-[0.2em] px-6 py-3 rounded-full border transition-all duration-200 ${
                      isDark
                        ? 'text-white border-white/10 hover:bg-white/5'
                        : 'text-slate-900 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>Join</span>
                  </button>
                </Link>

                <Link to="/create">
                  <button
                    className={`px-8 py-3.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-200 shadow-xl active:scale-95 ${
                      isDark
                        ? 'bg-white text-slate-950 hover:bg-indigo-50'
                        : 'bg-slate-950 text-white hover:bg-indigo-600 shadow-indigo-500/20'
                    }`}
                  >
                    Create Session
                  </button>
                </Link>
              </div>

              {/* Hamburger button — mobile only */}
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Toggle menu"
                className={`lg:hidden flex flex-col justify-center items-center w-10 h-10 rounded-xl transition-colors duration-200 ${
                  isDark ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span
                  className={`block w-5 h-0.5 rounded-full transition-all duration-300 ${
                    isDark ? 'bg-white' : 'bg-slate-900'
                  } ${menuOpen ? 'rotate-45 translate-y-[6px]' : ''}`}
                />
                <span
                  className={`block w-5 h-0.5 rounded-full my-1 transition-all duration-300 ${
                    isDark ? 'bg-white' : 'bg-slate-900'
                  } ${menuOpen ? 'opacity-0' : ''}`}
                />
                <span
                  className={`block w-5 h-0.5 rounded-full transition-all duration-300 ${
                    isDark ? 'bg-white' : 'bg-slate-900'
                  } ${menuOpen ? '-rotate-45 -translate-y-[6px]' : ''}`}
                />
              </button>
            </>
          )}

          {/* Audience page nav */}
          {variant === 'audience' && (
            <>
              {/* Desktop */}
              <div className="hidden sm:flex items-center space-x-6">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
                  >
                    Sign in
                  </Link>
                )}
                <Link to="/create">
                  <button className="px-8 py-3.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-200 shadow-md active:scale-95 bg-slate-900 text-white hover:bg-indigo-600">
                    Create Session
                  </button>
                </Link>
              </div>

              {/* Hamburger button — mobile only */}
              <button
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Toggle menu"
                className="sm:hidden flex flex-col justify-center items-center w-10 h-10 rounded-xl text-foreground hover:bg-muted transition-colors duration-200"
              >
                <span
                  className={`block w-5 h-0.5 rounded-full bg-current transition-all duration-300 ${
                    menuOpen ? 'rotate-45 translate-y-[6px]' : ''
                  }`}
                />
                <span
                  className={`block w-5 h-0.5 rounded-full bg-current my-1 transition-all duration-300 ${
                    menuOpen ? 'opacity-0' : ''
                  }`}
                />
                <span
                  className={`block w-5 h-0.5 rounded-full bg-current transition-all duration-300 ${
                    menuOpen ? '-rotate-45 -translate-y-[6px]' : ''
                  }`}
                />
              </button>
            </>
          )}
        </div>

        {/* Mobile dropdown menu */}
        <div
          className={`max-w-7xl mx-auto mt-2 pointer-events-auto overflow-hidden transition-all duration-300 ease-out rounded-[1.5rem] ${
            menuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          } ${
            isAudience
              ? 'bg-background border border-border'
              : isDark
                ? 'bg-slate-950/95 backdrop-blur-xl shadow-2xl shadow-indigo-500/10'
                : 'bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-200/80'
          }`}
        >
          <div className="flex flex-col px-6 py-5 space-y-1">
            {variant === 'landing' && (
              <>
                <a
                  href="#features"
                  onClick={() => setMenuOpen(false)}
                  className={`text-[11px] font-bold uppercase tracking-[0.2em] py-3 px-3 rounded-xl transition-colors ${
                    isDark
                      ? 'text-slate-400 hover:text-white hover:bg-white/5'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  The Platform
                </a>
                <a
                  href="#how-it-works"
                  onClick={() => setMenuOpen(false)}
                  className={`text-[11px] font-bold uppercase tracking-[0.2em] py-3 px-3 rounded-xl transition-colors ${
                    isDark
                      ? 'text-slate-400 hover:text-white hover:bg-white/5'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Our Process
                </a>

                {user ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className={`text-[11px] font-bold uppercase tracking-[0.2em] py-3 px-3 rounded-xl transition-colors ${
                      isDark
                        ? 'text-slate-400 hover:text-white hover:bg-white/5'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMenuOpen(false)}
                    className={`text-[11px] font-bold uppercase tracking-[0.2em] py-3 px-3 rounded-xl transition-colors ${
                      isDark
                        ? 'text-slate-400 hover:text-white hover:bg-white/5'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Sign in
                  </Link>
                )}

                <div className="pt-3 flex flex-col space-y-3">
                  <Link to="/audience-participation" onClick={() => setMenuOpen(false)}>
                    <button
                      className={`w-full text-[11px] font-bold uppercase tracking-[0.2em] px-6 py-3 rounded-full border transition-all duration-200 ${
                        isDark
                          ? 'text-white border-white/10 hover:bg-white/5'
                          : 'text-slate-900 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Join
                    </button>
                  </Link>
                  <Link to="/create" onClick={() => setMenuOpen(false)}>
                    <button
                      className={`w-full px-8 py-3.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-200 shadow-xl active:scale-95 ${
                        isDark
                          ? 'bg-white text-slate-950 hover:bg-indigo-50'
                          : 'bg-slate-950 text-white hover:bg-indigo-600 shadow-indigo-500/20'
                      }`}
                    >
                      Create Session
                    </button>
                  </Link>
                </div>
              </>
            )}

            {variant === 'audience' && (
              <>
                {user ? (
                  <Link
                    to="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="text-[11px] font-bold uppercase tracking-[0.2em] py-3 px-3 rounded-xl text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMenuOpen(false)}
                    className="text-[11px] font-bold uppercase tracking-[0.2em] py-3 px-3 rounded-xl text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                  >
                    Sign in
                  </Link>
                )}
                <div className="pt-3">
                  <Link to="/create" onClick={() => setMenuOpen(false)}>
                    <button className="w-full px-8 py-3.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-200 shadow-md active:scale-95 bg-slate-900 text-white hover:bg-indigo-600">
                      Create Session
                    </button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Backdrop overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[99] bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;