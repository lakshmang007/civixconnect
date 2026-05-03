import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { issueService } from '../services/issueService';
import { Issue } from '../types';
import { IssueCard } from './IssueCard';
import { motion, AnimatePresence } from 'motion/react';
import { Filter, Plus } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { cn } from '../lib/utils';

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
  const [sortBy, setSortBy] = useState<'latest' | 'trending'>('latest');

  useEffect(() => {
    const unsubscribe = issueService.subscribeToIssues((data) => {
      setIssues(data);
      setLoading(false);
    }, { zipCode });

    return () => unsubscribe();
  }, [zipCode]);

  const processedIssues = useMemo(() => {
    let result = [...issues];
    
    // Filter
    if (filterUserId) {
      result = result.filter(i => i.userId === filterUserId);
    }
    
    // Sort
    if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      result.sort((a, b) => b.votesCount - a.votesCount);
    }

    return result;
  }, [issues, filterUserId, sortBy]);

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
          className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-blue-500/20 group cursor-pointer"
          onClick={onCreateClick}
          role="button"
          aria-label="Request Election Support"
        >
          <div className="relative z-10">
            <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Need Election Assistance?</h3>
            <p className="text-blue-50 text-sm font-medium max-w-md">Found a discrepancy or need help with a booth process? Report it to get AI-verified support and escalation.</p>
            <button className="mt-6 px-6 py-3 bg-white text-blue-700 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">
              Request Verification
            </button>
          </div>
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-110 transition-transform duration-500" aria-hidden="true">
             <Plus className="w-64 h-64" />
          </div>
        </motion.div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-slate-800">{filterUserId ? "Your Election Support History" : t('priorityFeed')}</h2>
        <div className="flex items-center gap-2 text-[10px] sm:text-xs" role="group" aria-label="Sort options">
          <span className="text-slate-400 font-bold uppercase tracking-tight mr-1 hidden xs:inline">Sort By:</span>
          <button 
            onClick={() => setSortBy('latest')}
            aria-pressed={sortBy === 'latest'}
            className={cn(
              "px-3 py-1 border rounded-md font-bold transition-all",
              sortBy === 'latest' 
                ? "bg-blue-700 text-white border-blue-700 shadow-sm shadow-blue-500/20" 
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {t('latest')}
          </button>
          <button 
            onClick={() => setSortBy('trending')}
            aria-pressed={sortBy === 'trending'}
            className={cn(
              "px-3 py-1 border rounded-md font-bold transition-all",
              sortBy === 'trending' 
                ? "bg-blue-700 text-white border-blue-700 shadow-sm shadow-blue-500/20" 
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            )}
          >
            {t('trending')}
          </button>
        </div>
      </div>

      {processedIssues.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 border-dashed" role="region" aria-label="No data available">
          <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner" aria-hidden="true">
            <Plus className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">{filterUserId ? "No Support Requests Yet" : t('noIssues')}</h3>
          <p className="text-slate-500 text-sm font-medium mt-2 max-w-xs mx-auto">
            {filterUserId 
              ? "You haven't requested any election-related verification yet. Need help with the process? Start here!" 
              : t('beFirst')}
          </p>
          {filterUserId && (
            <button 
              onClick={onCreateClick}
              className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              aria-label="Request Support Now"
            >
              Get Support
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6" role="feed" aria-busy="false">
          <AnimatePresence>
            {processedIssues.map((issue) => (
              <motion.div
                key={issue.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                role="article"
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
