import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { issueService } from '../services/issueService';
import { Issue } from '../types';
import { IssueCard } from './IssueCard';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, Plus } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

interface IssueFeedProps {
  user: User;
  filterUserId?: string;
  zipCode?: string;
  onCreateClick?: () => void;
}

export function IssueFeed({ user, filterUserId, zipCode, onCreateClick }: IssueFeedProps) {
  const { t } = useLanguage();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = issueService.subscribeToIssues((data) => {
      let filtered = data;
      if (filterUserId) {
        filtered = data.filter(i => i.userId === filterUserId);
      }
      setIssues(filtered);
      setLoading(false);
    }, { zipCode });

    return () => unsubscribe();
  }, [filterUserId, zipCode]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {filterUserId && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-500/20 group cursor-pointer"
          onClick={onCreateClick}
        >
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Report a New Issue</h3>
            <p className="text-emerald-50 text-sm font-medium max-w-md">Saw something in your neighborhood that needs attention? Help your community by reporting it today.</p>
            <button className="mt-6 px-6 py-3 bg-white text-emerald-700 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
              Launch Report Tool
            </button>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-500">
             <Plus className="w-64 h-64" />
          </div>
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">{filterUserId ? "Your Submission History" : t('priorityFeed')}</h2>
        <div className="flex gap-2 text-xs">
          <button className="px-3 py-1 bg-white border border-slate-200 rounded-md font-bold text-slate-600 hover:bg-slate-50 transition-all">
            {t('latest')}
          </button>
          <button className="px-3 py-1 bg-blue-700 text-white rounded-md font-bold shadow-sm shadow-blue-500/20">
            {t('trending')}
          </button>
        </div>
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed">
          <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Plus className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">{filterUserId ? "No Reports Yet" : t('noIssues')}</h3>
          <p className="text-slate-500 text-sm font-medium mt-2 max-w-xs mx-auto">
            {filterUserId 
              ? "You haven't submitted any civic issues to the platform yet. Start by reporting your first issue!" 
              : t('beFirst')}
          </p>
          {filterUserId && (
            <button 
              onClick={onCreateClick}
              className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Report First Issue
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {issues.map((issue) => (
              <motion.div
                key={issue.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <IssueCard 
                  issue={issue} 
                  user={user} 
                  isPersonalFeed={!!filterUserId} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
