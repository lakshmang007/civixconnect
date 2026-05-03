import React, { useState, useEffect } from 'react';
import { MapPin, Bell, Menu, Languages } from 'lucide-react';
import { User } from 'firebase/auth';
import { ZipCode } from '../types';
import { issueService } from '../services/issueService';
import { useLanguage, Language } from '../lib/LanguageContext';

interface HeaderProps {
  user: User;
  onFilterChange: (zipCode: string) => void;
  onMenuClick: () => void;
  onNotificationClick: () => void;
}

export function Header({ user, onFilterChange, onMenuClick, onNotificationClick }: HeaderProps) {
  const { t, language, setLanguage } = useLanguage();
  const [zipCodes, setZipCodes] = useState<ZipCode[]>([]);
  const [selectedZip, setSelectedZip] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const data = await issueService.getZipCodes();
      setZipCodes(data);
    };
    fetch();
  }, []);

  const handleZipChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedZip(code);
    onFilterChange(code);
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between shadow-sm shadow-slate-500/5">
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative max-w-sm w-full hidden md:block">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <MapPin className="w-4 h-4 text-slate-400" />
          </div>
          <select 
            value={selectedZip}
            onChange={handleZipChange}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer"
          >
            <option value="">{t('searchPlaceholder')}</option>
            {zipCodes.map(zip => (
              <option key={zip.code} value={zip.code}>{zip.name} ({zip.code})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(['en', 'kn', 'hi'] as Language[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all uppercase ${
                language === lang 
                  ? "bg-white text-blue-600 shadow-sm" 
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-wider">
          <MapPin className="w-3 h-3" />
          {selectedZip ? `${t('area')}: ${selectedZip}` : `Shivajinagar (560001)`}
        </div>
        <button 
          onClick={onNotificationClick}
          className="relative p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="lg:hidden flex items-center shrink-0">
          <img 
             src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=random`}
             alt="User Profile"
             className="w-8 h-8 rounded-full border border-slate-200 shadow-sm"
             onClick={onMenuClick}
          />
        </div>
      </div>
    </header>
  );
}
