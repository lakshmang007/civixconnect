
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Mic, 
  X, 
  Bot, 
  User as UserIcon, 
  Camera, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCcw,
  ChevronRight,
  Mail,
  Navigation
} from 'lucide-react';
import { ChatState, getResponse, saveToDB } from '../services/mockLlmService';
import { User } from 'firebase/auth';

interface Message {
  role: 'bot' | 'user';
  text: string;
  options?: string[];
  requiresUpload?: boolean;
  requiresRegistration?: boolean;
  mapQuery?: string;
  isForm?: boolean;
  isEmailNotification?: boolean;
}

interface SmartElectionBotProps {
  user: User;
  zipCode: string;
}

export function SmartElectionBot({ user, zipCode }: SmartElectionBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const initialBotMessage: Message = { 
    role: 'bot', 
    text: `Hello, ${user.displayName || 'Citizen'}. I am your AI Civic Assistant, powered by Gemini. To help verify your registration or find polling details in Google Maps for ${zipCode || 'your area'}, please select your language:`,
    options: ['English', 'Kannada']
  };

  const [messages, setMessages] = useState<Message[]>([initialBotMessage]);
  const [input, setInput] = useState('');
  const [chatState, setChatState] = useState<ChatState>({ 
    step: 'LANGUAGE',
    userName: user.displayName || undefined,
    locationName: zipCode || undefined
  });
  const [isTyping, setIsTyping] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{lat: number, lng: number} | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCurrentCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, (err) => console.log("Location not shared:", err));
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Update context when props change (if chat is fresh)
  useEffect(() => {
    if (chatState.step === 'LANGUAGE') {
      setChatState(prev => ({
        ...prev,
        userName: user.displayName || undefined,
        locationName: zipCode || undefined
      }));
    }
  }, [user.displayName, zipCode]);

  const updateState = (newState: Partial<ChatState>) => {
    setChatState(prev => ({ ...prev, ...newState }));
  };

  const handleRestart = () => {
    setIsTyping(true);
    setMessages([]); // Clear for a moment to show transition
    
    setTimeout(() => {
      setMessages([initialBotMessage]);
      setChatState({ 
        step: 'LANGUAGE',
        userName: user.displayName || undefined,
        locationName: zipCode || undefined
      });
      setInput('');
      setIsTyping(false);
    }, 800);
  };

  const notifyElectionMonitor = async () => {
    // Call real backend endpoint
    try {
      await fetch('/api/notify-monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: user.displayName || 'Citizen',
          location: zipCode || 'Unknown Area',
          action: 'Verification & Registration Bot Flow'
        })
      });
      if ((window as any).notifyEmail) (window as any).notifyEmail('studylucky4@gmail.com', `Election Monitor Alert: Verified Resident Active`);
      console.log("Email notification triggered to studylucky4@gmail.com");
    } catch (error) {
      console.error("Failed to notify monitor:", error);
    }
  };

  const handleSend = async (messageText: string) => {
    if (!messageText.trim()) return;

    // Add user message
    const userMsg: Message = { role: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI delay
    setTimeout(async () => {
      const response = getResponse(messageText, chatState, updateState);
      const botMsg: Message = { 
        role: 'bot', 
        text: response.text,
        options: response.options,
        requiresUpload: response.requiresUpload,
        requiresRegistration: response.requiresRegistration,
        mapQuery: response.mapQuery
      };
      
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);

      if (response.triggerEmail) {
        await notifyElectionMonitor();
      }
    }, 1000);
  };

  const handleOptionClick = (option: string) => {
    handleSend(option);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Mock upload success
      setIsTyping(true);
      setTimeout(() => {
        handleSend("Document uploaded: age_verify_id.jpg");
      }, 500);
    }
  };

  const handleRegistration = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const area = formData.get('area') as string;

    if (area) {
      saveToDB({ name: user.displayName, email: user.email, area, registeredAt: new Date().toISOString() });
      updateState({ step: 'LOCATE' });
      handleSend(`Registration verified for ${area}`);
    }
  };

  return (
    <>
      {/* Bot Toggle (Now relative to parent fixed container in App.tsx) */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center border-2 border-blue-500/50 group relative overflow-hidden shrink-0"
      >
        <div className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-10 transition-opacity" />
        {isOpen ? <X className="w-8 h-8" /> : <Bot className="w-8 h-8 text-blue-400" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-900">1</span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 100 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: isMobile 
                ? '100vw' 
                : (isMaximized ? '90vw' : '380px'),
              height: isMobile 
                ? '100dvh' 
                : (isMaximized ? '85vh' : '600px'),
              bottom: isMobile 
                ? '0' 
                : (isMaximized ? '7.5vh' : '180px'),
              right: isMobile 
                ? '0' 
                : (isMaximized ? '5vw' : '32px'),
              borderRadius: isMobile ? '0px' : '24px'
            }}
            exit={{ opacity: 0, scale: 0.9, y: 100 }}
            className="fixed bg-slate-900 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] border border-blue-500/20 flex flex-col overflow-hidden z-[60] backdrop-blur-xl transition-[width,height,bottom,right,border-radius] duration-300 ease-in-out"
          >
            {/* Header */}
            <div className="p-4 md:p-6 bg-slate-900/50 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white tracking-tight uppercase">Election AI</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Secured Assistant</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleRestart}
                  className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title="Restart Chat"
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                  title={isMaximized ? "Minimize" : "Maximize"}
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar custom-scrollbar bg-gradient-to-b from-transparent to-blue-900/5">
              {messages.map((m, i) => (
                <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <motion.div
                    initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', damping: 20 }}
                    className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                      m.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-900/30 font-medium' 
                        : 'bg-slate-800 text-slate-100 rounded-tl-none border border-white/5'
                    }`}
                  >
                    {m.text}
                  </motion.div>

                  {/* Dynamic Inline Components */}
                  {m.options && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {m.options.map((opt, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleOptionClick(opt)}
                          className="px-4 py-2 bg-slate-800 hover:bg-blue-600 border border-white/5 text-[10px] font-black text-blue-400 hover:text-white uppercase tracking-widest rounded-full transition-all duration-300"
                        >
                          {opt}
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {m.requiresUpload && (
                    <label className="mt-4 flex items-center gap-3 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer group transition-all">
                      <Camera className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-black text-slate-300 uppercase tracking-tighter">Snap or Upload ID</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </label>
                  )}

                  {m.requiresRegistration && (
                    <motion.form 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onSubmit={handleRegistration}
                      className="mt-4 w-full bg-slate-800/80 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-md"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <AlertCircle className="w-4 h-4 text-blue-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Encryption Active</span>
                      </div>
                      <div className="space-y-4">
                        <input name="area" required placeholder="Area / Ward Name" className="w-full bg-slate-900/50 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-blue-500/50 transition-all font-medium" />
                        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/40">
                          Verify & Register
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {m.mapQuery && (
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mt-4 w-full flex flex-col gap-3"
                    >
                      <div className="w-full aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                        <iframe 
                          width="100%" 
                          height="100%" 
                          frameBorder="0" 
                          loading="lazy"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(m.mapQuery)}&output=embed`}
                        />
                      </div>
                      <button 
                         onClick={() => {
                           const origin = currentCoords ? `${currentCoords.lat},${currentCoords.lng}` : 'My+Location';
                           window.open(`https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${encodeURIComponent(m.mapQuery)}&travelmode=driving`, '_blank');
                         }}
                         className="flex items-center justify-center gap-2 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all"
                      >
                        <Navigation className="w-4 h-4 text-blue-400" />
                        Navigate to Polling Station
                      </button>
                    </motion.div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-1.5 items-center">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-6 bg-slate-900/50 border-t border-white/5">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                className="flex items-center gap-3"
              >
                <div className="flex-1 relative flex items-center">
                  <label htmlFor="bot-input" className="sr-only">Ask Election AI</label>
                  <input 
                    id="bot-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask election AI..."
                    className="w-full bg-slate-800 border border-white/5 rounded-2xl px-5 py-4 text-xs text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-blue-500/50 pr-12 font-medium"
                  />
                  <button type="button" className="absolute right-4 text-slate-500 hover:text-blue-400 transition-colors">
                    <Mic className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-blue-900/30 group"
                >
                  <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(59, 130, 246, 0.2); border-radius: 20px; }
      `}} />
    </>
  );
}
