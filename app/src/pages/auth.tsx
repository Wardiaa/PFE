import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Github, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });

  const steps = [
    { id: 1, label: 'Sign up your account', active: true },
    { id: 2, label: 'Set up your workspace', active: false },
    { id: 3, label: 'Set up your profile', active: false },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logic here
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col lg:flex-row font-sans">
      
      {/* LEFT SIDE: Branding & Stepper */}
      <div className="hidden lg:flex lg:w-[45%] p-6">
        <div className="w-full h-full rounded-[40px] bg-gradient-to-b from-[#7c3aed] via-[#2e1065] to-black p-16 flex flex-col items-center justify-center relative overflow-hidden border border-white/10">
          
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="text-xl font-bold tracking-tight">OnlyPipe</span>
          </div>

          <div className="text-center max-w-sm mb-12">
            <h1 className="text-4xl font-bold mb-4 tracking-tight">Get Started with Us</h1>
            <p className="text-gray-300 text-sm leading-relaxed">
              Complete these easy steps to register your account.
            </p>
          </div>

          {/* Stepper */}
          <div className="w-full max-w-xs space-y-4">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 ${
                  step.active 
                    ? 'bg-white text-black shadow-xl shadow-purple-500/20' 
                    : 'bg-[#1a1a1a] text-gray-400'
                }`}
              >
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${step.active ? 'bg-black text-white' : 'bg-gray-700 text-gray-300'}`}>
                  {step.id}
                </span>
                <span className="font-semibold text-sm">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-24">
        <div className="w-full max-w-md">
          
          <div className="mb-10">
            <h2 className="text-3xl font-bold mb-2">Sign Up Account</h2>
            <p className="text-gray-400 text-sm">Enter your personal data to create your account.</p>
          </div>

          {/* Social Auth */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button className="flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-800 bg-transparent hover:bg-gray-900 transition-all font-semibold text-sm">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
              Google
            </button>
            <button className="flex items-center justify-center gap-3 py-3 rounded-xl border border-gray-800 bg-transparent hover:bg-gray-900 transition-all font-semibold text-sm">
              <Github className="w-4 h-4" />
              Github
            </button>
          </div>

          <div className="relative mb-8 flex items-center">
            <div className="flex-grow border-t border-gray-800"></div>
            <span className="px-4 text-xs text-gray-500 uppercase tracking-widest">Or</span>
            <div className="flex-grow border-t border-gray-800"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">First Name</label>
                <input
                  type="text"
                  placeholder="eg. John"
                  className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-600"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">Last Name</label>
                <input
                  type="text"
                  placeholder="eg. Francisco"
                  className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">Email</label>
              <input
                type="email"
                placeholder="eg. johnfrans@gmail.com"
                className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-600"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full bg-[#111] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all placeholder:text-gray-600"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-[10px] text-gray-500 mt-1">Must be at least 8 characters.</p>
            </div>

            <button
              type="submit"
              className="w-full bg-white text-black font-bold rounded-xl py-4 mt-4 hover:bg-gray-200 transition-all active:scale-[0.99]"
            >
              Sign Up
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-400">
            Already have an account? 
            <button onClick={() => navigate('/login')} className="ml-2 text-white font-bold hover:underline">
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}