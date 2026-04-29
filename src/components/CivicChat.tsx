import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic, MicOff, MessageCircle, Bot, Loader2 } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'bot';
  content: string;
}

export function CivicChat() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: 'Hello! I am your Civic Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (content?: string) => {
    const text = content || input;
    if (!text.trim()) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    if (!content) setInput('');
    setIsTyping(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API key missing');
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a helpful civic assistant for a community engagement app. 
      The user is asking in ${language === 'en' ? 'English' : language === 'kn' ? 'Kannada' : 'Hindi'}.
      Answer their question about civic duties, reporting issues, or local authorities. 
      Keep it short, helpful, and professional. 
      
      User message: ${text}`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });

      const botMessage: Message = { 
        role: 'bot', 
        content: result.text || "I'm sorry, I couldn't process that." 
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'bot', content: "I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = language === 'en' ? 'en-US' : language === 'kn' ? 'kn-IN' : 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleSend(transcript);
    };

    recognition.start();
  };

  return (
    <div className="bg-slate-900 rounded-2xl flex flex-col h-full border border-slate-800 shadow-2xl overflow-hidden min-h-[400px]">
      {/* Header */}
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-none">{t('civicAssistant')}</h3>
            <span className="text-[10px] text-emerald-400 font-medium">Online & Ready</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] text-slate-400 font-mono">LIVE</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-900/20' 
                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
            }`}>
              {m.content}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 text-slate-500 rounded-2xl rounded-tl-none p-3 text-xs italic flex items-center gap-2 border border-slate-700">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t('aiTyping')}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative"
        >
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chatPlaceholder')}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl pl-4 pr-24 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={startVoiceInput}
              className={`p-2 rounded-lg transition-all ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-700'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:grayscale transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
        {isListening && (
          <div className="mt-2 text-center">
            <span className="text-[10px] text-blue-400 animate-pulse font-bold tracking-widest">{t('voiceActive')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
