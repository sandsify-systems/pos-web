'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Clock, Loader2, Sparkles } from 'lucide-react';
import { SubscriptionService, type TrialChecklist as ITrialChecklist } from '../../services/subscription.service';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';

export default function TrialChecklist() {
  const { business } = useAuth();
  const { subscription } = useSubscription();
  const [checklist, setChecklist] = useState<ITrialChecklist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subscription?.plan_type === 'TRIAL') {
        fetchChecklist();
    } else {
        setLoading(false);
    }
  }, [subscription?.plan_type]);

  const fetchChecklist = async () => {
    try {
      const data = await SubscriptionService.getTrialChecklist();
      setChecklist(data);
    } catch (e) {
      console.error("Failed to fetch trial checklist", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;
  if (!checklist) return null;
  if (subscription?.plan_type !== 'TRIAL') return null;

  const items = [
    {
      label: "Account Setup",
      description: "Business profile completed",
      completed: checklist.business_info_completed,
      day: "Day 0"
    },
    {
      label: "Sales Readiness",
      description: `Add at least 5 products (${checklist.products_added_count}/5)`,
      completed: checklist.products_added_count >= 5,
      day: "Day 1"
    },
    {
      label: "Staff & Control",
      description: "At least 1 cashier created",
      completed: checklist.cashier_created,
      day: "Day 2"
    },
    {
      label: "Proof of Value",
      description: "Make your first sale & view reports",
      completed: checklist.first_sale_recorded,
      day: "Day 3"
    }
  ];

  const completedCount = items.filter(i => i.completed).length;
  const isActivated = completedCount === items.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-teal-100 text-teal-600 rounded-lg">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Guided Trial Setup</h3>
            <p className="text-[10px] text-slate-500 font-medium">Activate your trial within 72 hours for full benefits</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <span className={cn(
             "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
             isActivated ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
           )}>
             {isActivated ? "Activated" : "Pending Activation"}
           </span>
        </div>
      </div>
      
      <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        {items.map((item, idx) => (
          <div key={idx} className={cn(
            "relative p-3.5 rounded-xl border transition-all",
            item.completed ? "bg-emerald-50/30 border-emerald-100" : "bg-white border-slate-100"
          )}>
            <div className="flex items-start justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.day}</span>
              {item.completed ? (
                <CheckCircle2 size={16} className="text-emerald-500 animate-in zoom-in" />
              ) : (
                <Circle size={16} className="text-slate-200" />
              )}
            </div>
            <h4 className={cn("text-xs font-bold mb-1", item.completed ? "text-emerald-900" : "text-slate-900")}>
              {item.label}
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {!isActivated && (
        <div className="px-5 py-2.5 bg-teal-600 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Clock size={14} className="animate-pulse" />
            <span className="text-[11px] font-bold">Complete setup to unlock installer commission & priority support</span>
          </div>
          <div className="w-1/3 bg-teal-900/30 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-1000 ease-out" 
              style={{ width: `${(completedCount / items.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
