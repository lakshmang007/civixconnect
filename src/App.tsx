/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ShieldCheck, 
  Plus, 
  Search, 
  MapPin, 
  LogOut, 
  LogIn,
  AlertCircle,
  CheckCircle2,
  Bell,
  Mail,
  X
} from 'lucide-react';
import { auth, signInWithGoogle } from './lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { IssueFeed } from './components/IssueFeed';
import { AuthorityDirectory } from './components/AuthorityDirectory';
import { CreateIssueModal } from './components/CreateIssueModal';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { VotingGuide } from './components/VotingGuide';
import { issueService } from './services/issueService';
import { SmartElectionBot } from './components/SmartElectionBot';
import { useLanguage } from './lib/LanguageContext';

export default function App() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'Feed' | 'Authorities' | 'My Issues' | 'Voting'>('Feed');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedZip, setSelectedZip] = useState<string>('');
  const [notifications, setNotifications] = useState<{id: string, text: string, type: 'mail' | 'info'}[]>([]);

  const addNotification = (text: string, type: 'mail' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setNotifications(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // Expose notify globally for demo purposes
  useEffect(() => {
    (window as any).notifyEmail = (target: string, type: string) => {
      addNotification(`📧 Mail triggered to ${target} (${type})`, 'mail');
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(loading => false);
      
      if (u) {
        // Seed data for demo only when signed in
        issueService.seedZipCodes();
        issueService.seedAuthorities();
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-slate-200"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('appName')}</h1>
          <p className="text-slate-600 mb-8 font-medium">
            Empowering neighbors to validate, prioritize, and escalate community issues with transparency.
          </p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-200 py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 shadow-sm" />
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900 overflow-hidden relative">
      <AnimatePresence>
        <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-slate-900/95 backdrop-blur-md text-white px-5 py-4 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-4 w-[calc(100vw-48px)] sm:min-w-[320px] sm:w-auto pointer-events-auto"
            >
              <div className={`w-10 h-10 shrink-0 rounded-2xl flex items-center justify-center ${n.type === 'mail' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                {n.type === 'mail' ? <Mail className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">System Traffic</p>
                <p className="text-xs font-bold leading-tight truncate">{n.text}</p>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(nv => nv.id !== n.id))}
                className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        selectedZip={selectedZip} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col lg:pl-64 h-screen overflow-hidden">
        <Header 
          user={user} 
          onFilterChange={(zip) => setSelectedZip(zip)} 
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        <main className="flex-1 p-4 sm:p-6 overflow-hidden">
          <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
            <section className="col-span-12 xl:col-span-8 flex flex-col h-full overflow-y-auto no-scrollbar pb-32 lg:pb-24">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'Feed' && <IssueFeed user={user} zipCode={selectedZip} />}
                  {activeTab === 'Authorities' && <AuthorityDirectory selectedZip={selectedZip} />}
                  {activeTab === 'My Issues' && <IssueFeed user={user} filterUserId={user.uid} zipCode={selectedZip} onCreateClick={() => setIsModalOpen(true)} />}
                  {activeTab === 'Voting' && <VotingGuide fullView />}
                </motion.div>
              </AnimatePresence>
            </section>

            <aside className="hidden xl:flex xl:col-span-4 flex-col gap-6 h-full overflow-hidden">
              <AuthorityDirectory compact selectedZip={selectedZip} />
              <div className="flex-1 min-h-0 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Verified Platform</h3>
                <p className="text-sm text-slate-500 font-medium">All reports are timestamped and verified via decentralized community consensus.</p>
              </div>
            </aside>
          </div>
        </main>
      </div>

      {/* Buttons */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 lg:right-12 z-40 flex flex-col gap-3 sm:gap-4">
        <SmartElectionBot user={user} zipCode={selectedZip} />
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
          className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-2xl shadow-emerald-500/40 flex items-center justify-center transition-transform"
        >
          <Plus className="w-7 h-7 sm:w-8 sm:h-8" />
        </motion.button>
      </div>

      <CreateIssueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} user={user} />
    </div>
  );
}
