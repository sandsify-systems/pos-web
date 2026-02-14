'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { tutorialService, Tutorial } from '@/services/tutorial.service';
import { Lightbulb, ChevronRight, Info, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HowItWorksPage() {
  const { business } = useAuth();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTutorials = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tutorialService.getTutorials(business?.type || 'RETAIL');
      if (response.success) {
        setTutorials(response.data);
      } else {
        setError('Failed to load guides');
      }
    } catch (err) {
      console.error('Failed to fetch tutorials:', err);
      setError('An error occurred while loading guides');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorials();
  }, [business?.type]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">Loading your business guide...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-bold uppercase tracking-wider border border-teal-100">
            <Lightbulb size={14} />
            Tutorial Guide
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">How It Works</h1>
          <p className="text-slate-500 font-medium">
            Tailored operational guides for <span className="text-teal-600 font-bold">{business?.type?.replace('_', ' ') || 'General Business'}</span> setup.
          </p>
        </div>

        <button 
          onClick={fetchTutorials}
          className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all font-semibold"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {error ? (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-2xl flex items-center gap-4 text-rose-700">
          <AlertCircle size={24} />
          <p className="font-semibold">{error}</p>
        </div>
      ) : tutorials.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 rounded-3xl text-center space-y-4 shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
            <Info size={40} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">No specific guide found</h3>
            <p className="text-slate-500 max-w-xs mx-auto">
              We haven't added specific guides for this business type yet. Check back soon!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {tutorials.map((item, index) => (
            <div 
              key={item.id} 
              className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-md transition-all hover:border-teal-500/20 group relative overflow-hidden"
            >
              {/* Decorative Number */}
              <div className="absolute -right-4 -top-8 text-9xl font-black text-slate-50/50 pointer-events-none group-hover:text-teal-50/50 transition-colors">
                {index + 1}
              </div>

              <div className="relative z-10 flex flex-col md:flex-row gap-8">
                <div className="md:w-1/3 space-y-4">
                  <div className="inline-flex items-center gap-2 text-teal-600 font-black text-xs uppercase tracking-tighter">
                    <span className="w-6 h-px bg-teal-600" />
                    {item.topic}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-teal-600 transition-colors">
                    {item.title}
                  </h3>
                </div>

                <div className="md:w-2/3">
                  <div className="prose prose-slate prose-lg max-w-none">
                    <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Support */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
        <div className="relative z-10 space-y-1">
          <h4 className="text-xl font-bold">Still need help?</h4>
          <p className="text-slate-400 font-medium">Our technical support team is available 24/7 to assist with your operational setup.</p>
        </div>
        <button className="relative z-10 px-8 py-3 bg-teal-500 hover:bg-teal-400 text-white font-black rounded-xl transition-all shadow-xl shadow-teal-500/20 active:scale-[0.98]">
          Contact Support
        </button>
        {/* Abstract pattern */}
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-teal-500/10 rounded-full translate-x-24 translate-y-24" />
      </div>
    </div>
  );
}
