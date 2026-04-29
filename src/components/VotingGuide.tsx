import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ChevronRight, 
  HelpCircle, 
  ExternalLink, 
  ShieldCheck, 
  Info, 
  Vote, 
  Calendar, 
  CreditCard, 
  AlertTriangle,
  Search,
  UserCheck,
  MapPin
} from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface VotingGuideProps {
  fullView?: boolean;
}

export function VotingGuide({ fullView }: VotingGuideProps) {
  const { t } = useLanguage();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const registrationSteps = [
    { key: 'guideStep1', icon: '🔍', link: 'https://electorallogin.eci.gov.in/', description: 'Enter your details or EPIC number to check if you are on the list.' },
    { key: 'guideStep2', icon: '📝', link: 'https://voters.eci.gov.in/', description: 'If your name is missing, fill Form 6 on the NVSP portal.' },
    { key: 'guideStep3', icon: '📍', link: 'https://electorallogin.eci.gov.in/', description: 'Find your assigned polling station for current year elections.' },
    { key: 'guideStepGov', icon: '📱', link: 'https://voters.eci.gov.in/', description: 'Use the Voter Helpline App or KYC App to know your candidates & details.' },
    { key: 'guideStep4', icon: '🪪', link: null, description: 'Bring your Voter ID card or alternate valid photo ID (like Aadhaar).' },
  ];

  const boothSteps = [
    { key: 'boothStep1', icon: '👤', description: 'Verification of your identity by the First Polling Officer.' },
    { key: 'boothStep2', icon: '✍️', description: 'Finger ink marking and signing the register (Form 17A) with the Second Polling Officer.' },
    { key: 'boothStep3', icon: '🆗', description: 'Deposit slip at Third Officer, show inked finger, and wait for EVM activation.' },
    { key: 'boothStep4', icon: '🗳️', description: 'Cast your vote by pressing the ballot button on the EVM. Hear the beep.' },
    { key: 'boothStep5', icon: '📜', description: 'Check the VVPAT slip for 7 seconds to verify your candidate selection.' },
    { key: 'boothStep6', icon: '🚫', description: 'You can press NOTA (last button) if you wish to exercise "None of the Above".' },
  ];

  const idProofs = [
    'EPIC (Voter ID card)', 'Aadhaar Card', 'PAN Card', 'Passport', 'Driving License', 
    'MGNREGA Job Card', 'Health Insurance Smart Card', 'Pension Document', 
    'Bank/Post Office Passbook', 'Service Identity Card', 'Smart Card (RGI/NPR)', 'Official ID (MPs/MLAs)'
  ];

  const phases = [
    { phase: 1, date: '19-04-2024', states: 21, pcs: 102 },
    { phase: 2, date: '26-04-2024', states: 13, pcs: 89 },
    { phase: 3, date: '07-05-2024', states: 12, pcs: 94 },
    { phase: 4, date: '13-05-2024', states: 10, pcs: 96 },
    { phase: 5, date: '20-05-2024', states: 8, pcs: 49 },
    { phase: 6, date: '25-05-2024', states: 7, pcs: 57 },
    { phase: 7, date: '01-06-2024', states: 8, pcs: 57 },
  ];

  const totalStepsCount = registrationSteps.length + boothSteps.length;
  const progress = Math.round((completedSteps.size / totalStepsCount) * 100);

  const toggleStep = (key: string) => {
    const next = new Set(completedSteps);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setCompletedSteps(next);
  };

  if (!fullView) {
    return (
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{t('votingGuide')}</h2>
          </div>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{progress}%</span>
        </div>

        <div className="space-y-4">
          {registrationSteps.map((step, index) => (
            <div 
              key={step.key}
              className="flex items-start gap-3 relative"
            >
              {index < registrationSteps.length - 1 && (
                <div className="absolute left-[9px] top-6 w-[2px] h-4 bg-slate-100" />
              )}
              <div className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                completedSteps.has(step.key) ? "bg-emerald-500 border-emerald-500 text-white" : "bg-slate-50 border-slate-100 text-slate-400"
              )}>
                {completedSteps.has(step.key) ? <CheckCircle2 className="w-3 h-3" /> : <span className="text-[10px]">{step.icon}</span>}
              </div>
              <div className="flex-1">
                <p className={cn(
                  "text-[11px] font-medium leading-tight",
                  completedSteps.has(step.key) ? "text-slate-400" : "text-slate-600"
                )}>
                  {t(step.key)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24 relative">
      {/* Hero Section */}
      <div className="sticky top-[-24px] z-30 flex flex-col md:flex-row md:items-end justify-between gap-6 p-8 bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl text-white overflow-hidden shadow-2xl shadow-slate-900/20 border border-white/5">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full text-xs font-bold text-blue-300 border border-blue-400/30">
            <Vote className="w-3.5 h-3.5" />
            Voter Empowerment
          </div>
          <h2 className="text-4xl font-black tracking-tighter">{t('votingGuide')}</h2>
          <p className="text-slate-400 text-sm max-w-xl font-medium">
            Complete guide covering registration, identity verification, candidate information, and the process at the polling booth.
          </p>
        </div>
        <div className="relative z-10 text-right">
          <div className="text-5xl font-black text-blue-400 leading-none">{progress}%</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">Civic Readiness</div>
        </div>
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/5 rounded-full blur-2xl -ml-24 -mb-24"></div>
      </div>

      {/* Top Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-900 mb-2">{t('verifyStatus')}</h3>
          <p className="text-sm text-slate-500 mb-4 font-medium">Verify your name in the electoral roll via Web or SMS.</p>
          <a href="https://electoralsearch.eci.gov.in" target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
            Search Now <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <UserCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-900 mb-2">{t('knowYourCandidate')}</h3>
          <p className="text-sm text-slate-500 mb-4 font-medium">View affidavits and criminal records of your local candidates.</p>
          <a href="https://affidavit.eci.gov.in" target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-600 flex items-center gap-1 hover:underline">
            View Portal <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
          <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-900 mb-2">{t('whereToVote')}</h3>
          <p className="text-sm text-slate-500 mb-4 font-medium">Locate your polling booth and get station details easily.</p>
          <a href="https://electoralsearch.eci.gov.in" target="_blank" rel="noreferrer" className="text-xs font-bold text-orange-600 flex items-center gap-1 hover:underline">
            Find Booth <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-12">
          
          {/* Main Checklist Sections */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
               <div className="w-2 h-6 bg-blue-600 rounded-full" />
               <h3 className="text-xl font-black text-slate-900">Step 1: Registration</h3>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-50 shadow-sm overflow-hidden">
              {registrationSteps.map((step, index) => (
                <div 
                  key={step.key} 
                  onClick={() => toggleStep(step.key)}
                  className={cn(
                    "p-6 flex items-start gap-5 cursor-pointer transition-all hover:bg-slate-50/50",
                    completedSteps.has(step.key) && "bg-emerald-50/30"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all font-bold text-sm",
                    completedSteps.has(step.key) 
                      ? "bg-emerald-500 border-emerald-500 text-white" 
                      : "border-slate-100 bg-slate-50 text-slate-400"
                  )}>
                    {completedSteps.has(step.key) ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn("text-base font-bold mb-1", completedSteps.has(step.key) && "text-emerald-800 line-through opacity-60")}>
                      {t(step.key)}
                    </h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{step.description}</p>
                    {step.link && (
                      <a href={step.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                        Visit Site <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
               <div className="w-2 h-6 bg-orange-600 rounded-full" />
               <h3 className="text-xl font-black text-slate-900">Step 2: {t('atBoothTitle')}</h3>
            </div>
            <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-50 shadow-sm overflow-hidden">
              {boothSteps.map((step, index) => (
                <div 
                  key={step.key} 
                  onClick={() => toggleStep(step.key)}
                  className={cn(
                    "p-6 flex items-start gap-5 cursor-pointer transition-all hover:bg-slate-50/50",
                    completedSteps.has(step.key) && "bg-emerald-50/30"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all font-bold text-sm",
                    completedSteps.has(step.key) 
                      ? "bg-emerald-500 border-emerald-500 text-white" 
                      : "border-slate-100 bg-slate-50 text-slate-400"
                  )}>
                    {completedSteps.has(step.key) ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={cn("text-base font-bold mb-1", completedSteps.has(step.key) && "text-emerald-800 line-through opacity-60")}>
                      {t(step.key)}
                    </h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{step.description}</p>
                  </div>
                  <span className="text-xl opacity-20 filter grayscale">{step.icon}</span>
                </div>
              ))}
            </div>
            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-center gap-4 text-amber-900">
               <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
               <p className="text-sm font-bold leading-tight">{t('prohibitionWarning')}</p>
            </div>
          </div>

          {/* ID Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
               <div className="w-2 h-6 bg-emerald-600 rounded-full" />
               <h3 className="text-xl font-black text-slate-900">{t('idProofTitle')}</h3>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl">
              <p className="text-sm text-slate-600 font-bold mb-6">{t('idProofNotice')}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {idProofs.map(id => (
                  <div key={id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <CreditCard className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700">{id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
               <div className="w-2 h-6 bg-slate-900 rounded-full" />
               <h3 className="text-xl font-black text-slate-900">{t('phaseTitle')}</h3>
            </div>
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {phases.map(p => (
                  <div key={p.phase} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col gap-3 group hover:bg-slate-900 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-slate-900 text-white text-[10px] font-black flex items-center justify-center group-hover:bg-white group-hover:text-slate-900 transition-colors">P{p.phase}</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.pcs} PCs</span>
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-900 group-hover:text-white transition-colors">{p.date}</p>
                      <p className="text-[10px] font-bold text-slate-500 group-hover:text-slate-400 transition-colors uppercase tracking-tight">{p.states} States/UTs</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        <div className="lg:col-span-4 space-y-8">
          
          {/* Official Site */}
          <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
             <div className="flex gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h4 className="text-sm font-black text-slate-900">ECI Official Info</h4>
             </div>
             <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
               For more information, please see the Voter Guide on <strong>ecisveep.nic.in</strong> or check <strong>elections24.eci.gov.in</strong>.
             </p>
             <button className="w-full py-2.5 bg-white border border-slate-200 hover:border-blue-300 hover:text-blue-600 rounded-xl text-xs font-black transition-all">
                Visit official Portal
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}

