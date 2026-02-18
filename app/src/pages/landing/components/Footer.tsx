
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-50 pt-24 pb-12 px-6 border-t border-slate-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-20">
          <div className="col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-slate-900">EngageLive</span>
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
          <p>© 2024 EngageLive Inc. All rights reserved.</p>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <span className="flex items-center space-x-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <span>Systems Operational</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
