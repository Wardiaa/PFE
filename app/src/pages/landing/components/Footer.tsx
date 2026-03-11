
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-50 pt-24 pb-12 px-6 border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-20">
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-6">
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
          <span className={`text-2xl font-display font-bold tracking-tight transition-colors duration-300  'text-white' : 'text-slate-950'}`}>Syncra</span>
            </div>
            <p className="text-slate-500 text-base max-w-xs leading-relaxed mb-8">
              The real-time interaction platform for modern presenters, educators, and organizers.
            </p>
            <div className="flex space-x-4">
               {/* Social placeholders */}
               <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 cursor-pointer transition-all">
                 <span className="font-bold">𝕏</span>
               </div>
               <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-600 cursor-pointer transition-all">
                 <span className="font-bold">in</span>
               </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold text-slate-900 mb-6">Product</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Quizzes</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Polls</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Live Q&A</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Analytics</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Use Cases</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Education</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Corporate</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Events</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Webinars</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Company</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-6">Legal</h4>
            <ul className="space-y-4 text-slate-500 text-sm">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Terms</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between text-slate-400 text-sm">
          <p>© 2026 EngageLive Inc. All rights reserved.</p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
