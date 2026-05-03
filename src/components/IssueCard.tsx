import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, 
  MapPin, 
  Clock, 
  MessageSquare, 
  Share2, 
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Trash2,
  Pencil,
  Save,
  Undo2,
  Maximize2,
  MinusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Issue, IssueStatus } from '../types';
import { User } from 'firebase/auth';
import { issueService } from '../services/issueService';
import { summarizeIssue } from '../lib/gemini';
import { cn } from '../lib/utils';
import { useLanguage } from '../lib/LanguageContext';

interface IssueCardProps {
  issue: Issue;
  user: User;
  isPersonalFeed?: boolean;
}

const VOTE_THRESHOLD = 5; 

export const IssueCard = React.memo(({ issue, user, isPersonalFeed }: IssueCardProps) => {
  const { t } = useLanguage();
  const [isVoting, setIsVoting] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [optimisticVotes, setOptimisticVotes] = useState<number | null>(null);
  
  // Sync optimistic votes when actual votes change
  useEffect(() => {
    setOptimisticVotes(null);
  }, [issue.votesCount]);

  // Edit fields
  const [editTitle, setEditTitle] = useState(issue.title);
  const [editDescription, setEditDescription] = useState(issue.description);

  // Guest support mode
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestVoteIds, setGuestVoteIds] = useState<string[]>([]);

  useEffect(() => {
    // Check if guest mode is enabled from localStorage
    const checkGuestMode = () => {
      const mode = localStorage.getItem('guestSupportMode') === 'true';
      setIsGuestMode(mode);
      
      const storedIds = localStorage.getItem(`guest_votes_${issue.id}`);
      if (storedIds) {
        setGuestVoteIds(JSON.parse(storedIds));
      }
    };

    checkGuestMode();
    window.addEventListener('storage', checkGuestMode);
    
    // Custom event for same-window updates
    window.addEventListener('guestModeChanged', checkGuestMode as any);

    return () => {
      window.removeEventListener('storage', checkGuestMode);
      window.removeEventListener('guestModeChanged', checkGuestMode as any);
    };
  }, []);

  useEffect(() => {
    const checkVote = async () => {
      // In guest mode, we don't block based on 'hasVoted' as much
      if (!isGuestMode) {
        const voted = await issueService.checkIfVoted(issue.id);
        setHasVoted(voted);
      } else {
        setHasVoted(false); // Always allow voting in guest mode
      }
    };
    checkVote();
  }, [issue.id, user.uid, isGuestMode]);

  const currentVotes = optimisticVotes !== null ? optimisticVotes : issue.votesCount;
  const progress = Math.min((currentVotes / VOTE_THRESHOLD) * 100, 100);
  const isEscalated = issue.status === IssueStatus.ESCALATED;
  const isResolved = issue.status === IssueStatus.RESOLVED;

  const handleVote = async () => {
    if (isVoting || isEscalated || isResolved) return;
    if (!isGuestMode && hasVoted) return;

    setIsVoting(true);
    // Optimistic update for guest mode
    if (isGuestMode) {
      setOptimisticVotes((optimisticVotes !== null ? optimisticVotes : issue.votesCount) + 1);
    }

    try {
      let voteUserId = undefined;
      if (isGuestMode) {
        // Generate a temporary guest ID for this vote
        voteUserId = `guest_${Math.random().toString(36).substring(2, 11)}`;
      }

      await issueService.voteForIssue(issue.id, voteUserId);
      
      if (!isGuestMode) {
        setHasVoted(true);
      } else if (voteUserId) {
        const newIds = [...guestVoteIds, voteUserId];
        setGuestVoteIds(newIds);
        localStorage.setItem(`guest_votes_${issue.id}`, JSON.stringify(newIds));
      }
      
      // Check if threshold reached after voting (using optimistic or actual count)
      const nextCount = (optimisticVotes !== null ? optimisticVotes : issue.votesCount) + 1;
      if (nextCount >= VOTE_THRESHOLD && !isEscalated) {
        handleEscalate();
      }
    } catch (error: any) {
      // Reset optimistic on error
      setOptimisticVotes(null);
      
      let displayMessage = "Error voting";
      try {
        const parsed = JSON.parse(error.message);
        displayMessage = parsed.error || displayMessage;
      } catch (e) {
        displayMessage = error.message || displayMessage;
      }
      
      if (displayMessage === "You have already voted for this issue") {
        setHasVoted(true);
      } else {
        alert(displayMessage);
      }
    } finally {
      setIsVoting(false);
    }
  };

  const handleRemoveVote = async () => {
    if (isVoting || isEscalated || isResolved) return;
    if (!isGuestMode && !hasVoted) return;
    if (isGuestMode && guestVoteIds.length === 0) return;

    setIsVoting(true);
    
    // Optimistic update
    setOptimisticVotes(Math.max(0, (optimisticVotes !== null ? optimisticVotes : issue.votesCount) - 1));

    try {
      let voteUserId = undefined;
      if (isGuestMode) {
        voteUserId = guestVoteIds[guestVoteIds.length - 1]; // Remove last one
      }

      await issueService.removeVote(issue.id, voteUserId);
      
      if (!isGuestMode) {
        setHasVoted(false);
      } else {
        const newIds = guestVoteIds.slice(0, -1);
        setGuestVoteIds(newIds);
        localStorage.setItem(`guest_votes_${issue.id}`, JSON.stringify(newIds));
      }
    } catch (error: any) {
      setOptimisticVotes(null);
      alert(error.message || "Error removing support");
    } finally {
      setIsVoting(false);
    }
  };

  const handleEscalate = async () => {
    setIsEscalating(true);
    try {
      // 1. Generate AI Summary (Feature 3)
      const aiSummary = await summarizeIssue(
        issue.title, 
        issue.description, 
        ["Resident says: This has been a problem for weeks.", "Neighbor: Kids can't play here safely."]
      );
      setSummary(aiSummary);

      // 2. Update Firestore Status
      // For demo, we just assign the first authority we find
      const authorities = await issueService.getAuthorities();
      const authorityId = authorities?.[0]?.id || 'admin_1';
      
      await issueService.escalateIssue(issue.id, authorityId);

      // 3. Simulate Backend Notification (Twilio/Resend)
      try {
        const response = await fetch('/api/escalate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            issueId: issue.id,
            summary: aiSummary,
            authorityName: authorities?.[0]?.name || 'Ward Officer'
          })
        });
        const result = await response.json();
        if (result.success) {
          if ((window as any).notifyEmail) (window as any).notifyEmail(result.sentTo, `Issue Escalated (#${issue.id.slice(-4).toUpperCase()})`);
          console.log(`Notification sent to ${result.sentTo}`);
        }
      } catch (f) {
        console.log("Mock escalation notification sent");
      }

      setShowSummary(true);
    } catch (error) {
      console.error("Escalation failed:", error);
    } finally {
      setIsEscalating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await issueService.deleteIssue(issue.id);
    } catch (error) {
      console.error("Delete failed:", error);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleUpdate = async () => {
    if (!editTitle || !editDescription) return;
    setIsUpdating(true);
    try {
      await issueService.updateIssue(issue.id, {
        title: editTitle,
        description: editDescription
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div 
      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm relative hover:shadow-md transition-all group overflow-hidden"
      role="article"
      aria-labelledby={`issue-title-${issue.id}`}
    >
      {/* Image Zoom Modal */}
      <AnimatePresence>
        {isZoomed && issue.imageUrl && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomed(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Image Preview"
            className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 cursor-zoom-out"
          >
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={issue.imageUrl} 
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
              alt={`Full size preview of ${issue.title}`}
            />
            <button 
              onClick={() => setIsZoomed(false)}
              aria-label="Close Preview"
              className="absolute top-6 right-6 text-white bg-white/10 backdrop-blur-md p-3 rounded-full hover:bg-white/20 transition-all border border-white/20"
            >
              <Undo2 className="w-6 h-6" aria-hidden="true" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="alertdialog"
            aria-labelledby="delete-confirm-title"
            aria-describedby="delete-confirm-desc"
            className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
          >
            <Trash2 className="w-8 h-8 text-red-500 mb-3" aria-hidden="true" />
            <h4 id="delete-confirm-title" className="text-white font-black uppercase tracking-tight text-sm mb-1">Delete Submission?</h4>
            <p id="delete-confirm-desc" className="text-slate-400 text-[10px] font-bold mb-4 max-w-[180px]">This will permanently remove your report from the platform.</p>
            <div className="flex gap-2 w-full max-w-[200px]">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Delete"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span 
            className={cn(
              "px-2 py-0.5 text-[10px] font-bold uppercase rounded border transition-colors",
              isEscalated ? "bg-emerald-50 text-emerald-700 border-emerald-200" : 
              isResolved ? "bg-slate-100 text-slate-600 border-slate-200" :
              "bg-blue-50 text-blue-600 border-blue-100"
            )}
            role="status"
          >
            {issue.status}
          </span>
          <span className="text-[11px] text-slate-400 font-mono" aria-label={`Issue ID ${issue.id}`}>#{issue.id.slice(-4).toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-3">
          {isPersonalFeed && issue.userId === user.uid && !showDeleteConfirm && !isEditing && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => setIsEditing(true)}
                aria-label="Edit Topic"
                className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
              >
                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                aria-label="Delete Topic"
                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
          <span className="text-[11px] text-slate-400 italic">{t('reported')} {new Date(issue.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-200" role="form" aria-label="Edit topic form">
          <div className="space-y-1">
            <label htmlFor={`edit-title-${issue.id}`} className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
            <input 
              id={`edit-title-${issue.id}`}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor={`edit-desc-${issue.id}`} className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
            <textarea 
              id={`edit-desc-${issue.id}`}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setIsEditing(false);
                setEditTitle(issue.title);
                setEditDescription(issue.description);
              }}
              disabled={isUpdating}
              className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              <Undo2 className="w-3.5 h-3.5" aria-hidden="true" />
              Cancel
            </button>
            <button 
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" aria-hidden="true" />}
              Update Submission
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3 id={`issue-title-${issue.id}`} className="text-lg font-bold text-slate-900 mb-1 leading-tight">{issue.title}</h3>
          <p className="text-sm text-slate-600 line-clamp-2 mb-5">
            {issue.description}
          </p>
        </>
      )}

      {issue.imageUrl && !isEditing && (
        <button 
          onClick={() => setIsZoomed(true)}
          aria-label={`Zoom image: ${issue.title}`}
          className="w-full relative mb-6 rounded-xl overflow-hidden border border-slate-100 shadow-inner max-h-48 cursor-zoom-in group/img bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <img 
            src={issue.imageUrl} 
            alt={issue.title} 
            className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
             <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover/img:opacity-100 transition-all scale-75 group-hover/img:scale-100" aria-hidden="true" />
          </div>
        </button>
      )}

      {/* Progress Section */}
      {!isEscalated && !isResolved && (
        <div className="space-y-2 mb-6" role="progressbar" aria-valuenow={currentVotes} aria-valuemin={0} aria-valuemax={VOTE_THRESHOLD}>
          <div className="flex justify-between text-xs font-medium">
            <span className="text-blue-700">{currentVotes}/{VOTE_THRESHOLD} {t('support')}s</span>
            <span className="text-slate-400 italic">{progress >= 80 ? 'Threshold almost met' : 'Validating priority'}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
            />
          </div>
        </div>
      )}

      {/* Escalation/Summary Section */}
      {(isEscalated || showSummary) && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          role="region"
          aria-label="AI Verification Summary"
          className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm text-sm" aria-hidden="true">
            🤖
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-emerald-800 mb-0.5">{t('aiEscalation')}</p>
            <p className="text-[11px] text-emerald-600 leading-relaxed italic line-clamp-2">
              {summary || "Data payload dispatched to Authority at " + (issue.updatedAt?.toLocaleTimeString() || "10:15 AM")}
            </p>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button 
            onClick={handleVote}
            disabled={isVoting || (!isGuestMode && hasVoted) || isEscalated || isResolved}
            aria-pressed={!isGuestMode && hasVoted}
            className={cn(
              "px-4 sm:px-6 py-2 rounded-lg font-bold text-[10px] sm:text-sm transition-all shadow-sm active:scale-95 flex items-center gap-2 whitespace-nowrap shrink-0",
              !isGuestMode && hasVoted
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default"
                : isEscalated || isResolved 
                  ? "bg-slate-50 text-slate-300 cursor-not-allowed border-slate-100" 
                  : "bg-blue-700 text-white hover:bg-blue-800 shadow-blue-500/20"
            )}
          >
            {isVoting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (!isGuestMode && hasVoted) ? (
              <>
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                {t('supported')}
              </>
            ) : t('support')}
          </button>

          {(isGuestMode || hasVoted) && !isEscalated && !isResolved && (
            <button 
              onClick={handleRemoveVote}
              disabled={isVoting}
              aria-label="Remove Support"
              className="p-1.5 sm:p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-90 shrink-0"
            >
              <MinusCircle className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </button>
          )}
          <div className="flex items-center gap-1 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0" role="button" aria-label="12 Comments">
            <MessageSquare className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs font-bold font-mono">12</span>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-60 grayscale hover:grayscale-0 transition-all shrink-0">
          <img 
            src={`https://ui-avatars.com/api/?name=${issue.userId}&background=random`} 
            alt="" 
            className="w-6 h-6 rounded-full"
            aria-hidden="true"
          />
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{t('verifiedResident')}</span>
        </div>
      </div>
    </div>
  );
});
