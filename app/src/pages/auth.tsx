import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mail, Lock, User, Github, Chrome } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      
      // You can navigate to another page after successful auth
       navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col md:flex-row font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Left side: Branding/Visual */}
      <div className="hidden lg:flex w-1/2 bg-white border-r border-slate-100 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.03),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(244,63,94,0.03),transparent_50%)]"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white font-black text-xl">E</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">EngageLive</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-bold text-slate-900 leading-[1.1] mb-6 tracking-tight">
            The standard for <span className="text-indigo-600">audience interaction.</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            Join 50,000+ creators building meaningful connections through real-time participation.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-8 border-t border-slate-100 pt-8">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden">
                <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <p className="text-sm font-semibold text-slate-600">
            Trusted by teams at <span className="text-slate-900">Stripe, Airbnb, & Zoom</span>
          </p>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 lg:hidden flex justify-center">
             <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-100">
              <span className="text-white font-black text-2xl">E</span>
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-slate-500 font-medium">
              {isLogin ? "Log in to manage your interactive sessions" : "Start hosting engaging sessions in minutes"}
            </p>
          </div>

          <div className="space-y-4 mb-8">
            <button className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold text-slate-700 active:scale-[0.98]">
              <Chrome className="w-5 h-5 text-[#4285F4]" />
              Continue with Google
            </button>
            <button className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all font-semibold text-slate-700 active:scale-[0.98]">
              <Github className="w-5 h-5" />
              Continue with GitHub
            </button>
          </div>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">
              <span className="bg-[#fafafa] px-4">Or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-1.5"
                >
                  <label className="text-xs font-bold text-slate-700 ml-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 focus:!outline-none focus:!border-indigo-500 focus:!ring-0 transition-all font-medium placeholder:text-slate-300"
                    placeholder="Jane Cooper"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 ml-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 focus:!outline-none focus:!border-indigo-500 focus:!ring-0 transition-all font-medium placeholder:text-slate-300"
                placeholder="name@company.com"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-700">Password</label>
                {isLogin && <button type="button" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">Forgot password?</button>}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 focus:!outline-none focus:!border-indigo-500 focus:!ring-0 transition-all font-medium placeholder:text-slate-300"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 text-white font-bold rounded-xl py-4 mt-2 hover:bg-indigo-600 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign in to account" : "Create free account"}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-slate-500">
            {isLogin ? "New to EngageLive?" : "Already have an account?"}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-indigo-600 font-bold hover:text-indigo-700"
            >
              {isLogin ? "Create an account" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}