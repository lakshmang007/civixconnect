import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserCheck, Activity, Award, ChevronRight, X, Clock, CheckCircle2, AlertCircle, Sparkles, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Authority, Issue, IssueStatus } from '../types';
import { issueService } from '../services/issueService';
import { cn } from '../lib/utils';
import { useLanguage } from '../lib/LanguageContext';

interface AuthorityDirectoryProps {
  compact?: boolean;
  selectedZip?: string;
}

export function AuthorityDirectory({ compact, selectedZip }: AuthorityDirectoryProps) {
  const { t } = useLanguage();
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuthority, setSelectedAuthority] = useState<Authority | null>(null);
  const [ledgerIssues, setLedgerIssues] = useState<Issue[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const data = await issueService.getAuthorities(selectedZip);
      setAuthorities(data);
      setLoading(false);
    };
    fetch();
  }, [selectedZip]);

  const openLedger = async (auth: Authority) => {
    setSelectedAuthority(auth);
    setLoadingLedger(true);
    const issues = await issueService.getIssuesByAuthority(auth.id);
    setLedgerIssues(issues);
    setLoadingLedger(false);
  };

  if (loading) return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />
      ))}
    </div>
  );

  const displayAuthorities = compact && !selectedZip ? authorities.slice(0, 3) : authorities;

  if (compact) {
    return (
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
          {selectedZip ? `Local Representatives (${selectedZip})` : t('authorityDirectory')}
        </h2>
        <div className="space-y-3">
          {displayAuthorities.map((auth) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={auth.id} 
              onClick={() => openLedger(auth)}
              className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden relative border border-slate-100">
                  <img 
                    src={auth.photoUrl || `https://ui-avatars.com/api/?name=${auth.name}&background=random`} 
                    alt={auth.name} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-none mb-1">{auth.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-medium">{auth.department}</p>
                </div>
              </div>
              <span className={cn(
                "px-2 py-1 text-[9px] font-bold rounded-full uppercase",
                auth.status === 'In-Office' ? "bg-emerald-100 text-emerald-700" :
                auth.status === 'On-Field' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
              )}>
                {auth.status === 'In-Office' ? 'In-Office' : auth.status === 'On-Field' ? 'On-Field' : 'Offline'}
              </span>
            </motion.div>
          ))}
          {displayAuthorities.length === 0 && (
            <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No authorities found for this ZIP</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t('authorityDirectory')}</h2>
          {selectedZip && (
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full uppercase tracking-tighter shadow-sm border border-emerald-200">
              Filtered by: {selectedZip}
            </span>
          )}
        </div>
        <p className="text-slate-500 text-sm font-medium">Connecting community problems with the right decision makers to build a better city.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {authorities.map((auth) => (
          <motion.div
            key={auth.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col relative overflow-hidden"
          >
            <div className="flex items-center gap-5 mb-6">
              <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 border border-slate-200 overflow-hidden shadow-inner">
                <img 
                  src={auth.photoUrl || `https://ui-avatars.com/api/?name=${auth.name}&background=random`} 
                  alt={auth.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-lg font-black text-slate-900">{auth.name}</h3>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-2">{auth.department}</p>
                <div className="flex flex-wrap gap-1">
                  {auth.zipCodes?.map(z => (
                    <span key={z} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black rounded uppercase">{z}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-0.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{t('status')}</span>
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full shadow-[0_0_4px_currentColor]",
                    auth.status === 'In-Office' ? "text-emerald-500 bg-emerald-500 animate-pulse" :
                    auth.status === 'On-Field' ? "text-blue-500 bg-blue-500" : "text-slate-400 bg-slate-400"
                  )} />
                  <span className={cn(
                    "text-xs font-black uppercase tracking-tight",
                    auth.status === 'In-Office' ? "text-emerald-700" :
                    auth.status === 'On-Field' ? "text-blue-700" : "text-slate-500"
                  )}>{auth.status}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-0.5">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider text-right">Performance</span>
                <div className="flex items-center justify-end gap-1.5 text-slate-700">
                  <Award className="w-3 h-3 text-amber-500" />
                  <span className="text-xs font-black">{auth.resolutionCount} Closed</span>
                </div>
              </div>
            </div>

            <button 
              onClick={() => openLedger(auth)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-900 border border-slate-900 rounded-xl text-[10px] font-black text-white hover:bg-slate-800 transition-all group shadow-lg shadow-slate-900/10 uppercase tracking-widest"
            >
              {t('resolutionLedger')}
              <ChevronRight className="w-4 h-4 text-white/50 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedAuthority && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAuthority(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl border-2 border-white shadow-xl overflow-hidden bg-white flex-shrink-0">
                    <img 
                      src={selectedAuthority.photoUrl} 
                      className="w-full h-full object-cover" 
                      alt=""
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 leading-tight">{selectedAuthority.name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedAuthority.department}</p>
                      <span className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Resolution Ledger</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedAuthority(null)}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all active:scale-95 shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                {/* Resolution Ledger (Achievements) Section */}
                {selectedAuthority.achievements && selectedAuthority.achievements.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 ml-1">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Key Performance Milestones</h4>
                    </div>
                    <div className="grid gap-3">
                      {selectedAuthority.achievements.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 flex gap-3 group hover:bg-emerald-50 transition-colors">
                          <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
                            {idx + 1}
                          </div>
                          <p className="text-xs font-bold text-slate-700 leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Community Task History */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 ml-1">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Community Task Resolution History</h4>
                  </div>
                  {loadingLedger ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="w-8 h-8 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Auditing Records...</p>
                    </div>
                  ) : ledgerIssues.length > 0 ? (
                    <div className="space-y-3">
                      {ledgerIssues.map((issue) => (
                        <div key={issue.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 transition-all flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h4 className="text-[13px] font-black text-slate-900 leading-snug">{issue.title}</h4>
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{issue.category}</span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{new Date(issue.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border",
                            issue.status === IssueStatus.RESOLVED 
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                              : "bg-blue-100 text-blue-700 border-blue-200"
                          )}>
                            {issue.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-3 shadow-sm">
                        <AlertCircle className="w-6 h-6 text-slate-300" />
                      </div>
                      <h4 className="text-slate-900 text-xs font-black uppercase tracking-widest mb-1">No Active Task Entries</h4>
                      <p className="text-slate-500 text-[10px] font-bold max-w-xs mx-auto">There are currently no community-reported issues officially escalated to this authority's office.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Civic Accountability Score</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-black">{selectedAuthority.resolutionCount} Total Resolutions</span>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  Verified Official
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
