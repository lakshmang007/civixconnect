import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  ShieldCheck, 
  LogOut,
  Vote,
  Users,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { signOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';
import { useLanguage } from '../lib/LanguageContext';
import { VotingGuide } from './VotingGuide';

interface SidebarProps {
  activeTab: 'Feed' | 'Authorities' | 'My Issues' | 'Voting';
  setActiveTab: (tab: 'Feed' | 'Authorities' | 'My Issues' | 'Voting') => void;
  user: User | null;
  selectedZip?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ activeTab, setActiveTab, user, selectedZip, isOpen, onClose }: SidebarProps) {
  const { t } = useLanguage();
  const [isGuestMode, setIsGuestMode] = React.useState(localStorage.getItem('guestSupportMode') === 'true');

  const toggleGuestMode = () => {
    const newMode = !isGuestMode;
    setIsGuestMode(newMode);
    localStorage.setItem('guestSupportMode', String(newMode));
    window.dispatchEvent(new CustomEvent('guestModeChanged'));
  };

  const menuItems = [
    { id: 'Feed', label: t('communityFeed'), icon: LayoutDashboard },
    { id: 'Authorities', label: t('authorityDirectory'), icon: ShieldCheck },
    { id: 'Voting', label: t('voterGuide'), icon: Vote },
    { id: 'My Issues', label: t('myIssues'), icon: ClipboardList },
  ] as const;

  const handleTabClick = (tab: typeof menuItems[number]['id']) => {
    setActiveTab(tab);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-72 lg:w-64 bg-white border-r border-slate-200 transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
              CX
            </div>
            <span className="text-xl font-bold tracking-tight text-blue-700">{t('appName')}</span>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-5 h-5 rotate-180" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto no-scrollbar">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group text-sm font-medium",
                activeTab === item.id 
                  ? "bg-blue-50 text-blue-700 shadow-sm" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4",
                activeTab === item.id ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
              )} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Guest Support Profile Section */}
        <div className="pt-4 border-t border-slate-50">
          <div className="px-3 mb-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dev Tools</h4>
          </div>
          <button 
            onClick={toggleGuestMode}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-md transition-all text-xs font-bold",
              isGuestMode ? "bg-orange-50 text-orange-700" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" />
              <span>Guest Mode</span>
            </div>
            {isGuestMode ? <ToggleRight className="w-5 h-5 text-orange-500" /> : <ToggleLeft className="w-5 h-5" />}
          </button>
          <div className="px-3 mt-1">
            <p className="text-[9px] text-slate-400 leading-tight">
              {isGuestMode 
                ? "Multiple support enabled. Every click uses a unique ID." 
                : "Standard mode. One support per account."}
            </p>
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 px-2 py-3 rounded-lg overflow-hidden">
          <img 
            src={user?.photoURL || `https://ui-avatars.com/api/?name=${user?.displayName || 'Guest'}`} 
            alt={user?.displayName || 'Guest'} 
            className="w-10 h-10 rounded-full border-2 border-white shadow-sm shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">{user?.displayName || 'Guest User'}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate">{t('zip')}: {selectedZip || '560001'}</p>
          </div>
        </div>
      </div>
    </aside>
    </>
  );
}
