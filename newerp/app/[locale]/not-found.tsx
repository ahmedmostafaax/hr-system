'use client';

import Link from 'next/link';
import { Home, MoveLeft, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-center px-6 relative overflow-hidden">
      

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-[0.03] flex items-center justify-center">
        <h1 className="text-[30rem] font-black select-none">404</h1>
      </div>


      <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-3xl animate-bounce">
        <AlertCircle size={48} strokeWidth={2.5} />
      </div>

    
      <h1 className="text-8xl md:text-9xl font-black text-gray-900 tracking-tighter mb-2">
        404
      </h1>


      <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-4">
        Oops! Page Not Found
      </h2>
      
      <p className="text-gray-400 font-bold max-w-md mb-10 leading-relaxed uppercase text-[10px] tracking-[0.2em]">
        The page you are looking for might have been removed, had its name changed or is temporarily unavailable.
      </p>

    
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          href="/"
          className="group flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200"
        >
          <Home size={18} className="transition-transform group-hover:scale-110" />
          Back to Home
        </Link>

        <button 
          onClick={() => window.history.back()}
          className="group flex items-center gap-3 px-8 py-4 bg-white text-gray-900 border border-gray-100 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-50 transition-all"
        >
          <MoveLeft size={18} className="transition-transform group-hover:-translate-x-1" />
          Go Back
        </button>
      </div>

    
      <div className="absolute bottom-10">
        <p className="text-[10px] text-gray-300 font-black uppercase tracking-[0.3em]">
          System Status: <span className="text-emerald-500">Online</span>
        </p>
      </div>

    </div>
  );
}