import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, FileText, Send, MapPin, Loader2, Upload, CheckCircle2, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { User } from 'firebase/auth';
import { issueService } from '../services/issueService';
import { Category, ZipCode } from '../types';
import { cn } from '../lib/utils';
import { useLanguage } from '../lib/LanguageContext';

const issueSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000),
  category: z.enum(['Waste', 'Pothole', 'Water', 'Electricity', 'Other']),
  zipCode: z.string().min(1, "Zip Code is required"),
  imageUrl: z.string().optional().or(z.literal('')),
});

type IssueFormData = z.infer<typeof issueSchema>;

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export function CreateIssueModal({ isOpen, onClose, user }: CreateIssueModalProps) {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const [zipCodes, setZipCodes] = useState<ZipCode[]>([]);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema),
    defaultValues: {
      imageUrl: ''
    }
  });

  const imageUrl = watch('imageUrl');

  React.useEffect(() => {
    console.log("imageUrl state changed:", imageUrl ? imageUrl.substring(0, 50) + "..." : "empty");
  }, [imageUrl]);

  React.useEffect(() => {
    const fetchZipCodes = async () => {
      const codes = await issueService.getZipCodes();
      setZipCodes(codes);
    };
    fetchZipCodes();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log("File selected:", file.name, file.size, file.type);

    // Decreased to 500KB to stay well within 1MB Firestore limit after Base64 encoding (~33% overhead)
    if (file.size > 500000) { 
      alert("Image is too large. Please select a photo smaller than 500KB for faster processing.");
      return;
    }

    const reader = new FileReader();
    reader.onloadstart = () => console.log("Started reading file...");
    reader.onerror = () => console.error("FileReader error");
    reader.onloadend = () => {
      const base64String = reader.result as string;
      console.log("File read successfully, base64 length:", base64String.length);
      
      // Use a timeout to ensure state update doesn't conflict with any browser-level file handling
      setTimeout(() => {
        setValue('imageUrl', base64String, { 
          shouldValidate: true, 
          shouldDirty: true,
          shouldTouch: true 
        });
      }, 0);
    };
    reader.readAsDataURL(file);
    
    // Reset the input so the same file can be selected again if needed
    e.target.value = '';
  };

  const onSubmit = async (data: IssueFormData) => {
    setIsSubmitting(true);
    try {
      const isGuestMode = localStorage.getItem('guestSupportMode') === 'true';
      
      await issueService.createIssue({
        ...data,
        userId: user?.uid || 'anonymous_user',
        location: { lat: 0, lng: 0 }, // For demo
      });

      // Trigger notification to studylucky4@gmail.com
      try {
        await fetch('/api/notify-submission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: data.title,
            userName: user?.displayName || 'Citizen',
            category: data.category,
            zipCode: data.zipCode,
            isGuestMode
          })
        });
        if ((window as any).notifyEmail) (window as any).notifyEmail('studylucky4@gmail.com', `New Submission: "${data.title}"`);
        console.log("Submission notification triggered for studylucky4@gmail.com");
      } catch (e) {
        console.error("Email trigger failed:", e);
      }

      reset();
      onClose();
    } catch (error) {
      console.error("Failed to create issue:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('too large') || errorMessage.includes('1,048,576')) {
        alert("The report is too large to submit. Please use a smaller image (under 500KB).");
      } else {
        alert("Submission failed. Please check your internet connection and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-white rounded-3xl sm:rounded-3xl shadow-2xl overflow-hidden shadow-emerald-500/10 max-h-[90vh] sm:max-h-none flex flex-col"
          >
            <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-slate-900">{t('reportIssue')}</h2>
              <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-4 sm:p-6 space-y-6 overflow-y-auto no-scrollbar flex-1">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('uploadDetails')}</label>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="relative group">
                          <input 
                            {...register('imageUrl')}
                            placeholder="Paste image URL or upload below..." 
                            className={cn(
                              "w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all pr-12 font-medium",
                              errors.imageUrl ? "border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500"
                            )}
                          />
                          {imageUrl && (
                            <button
                              type="button"
                              onClick={() => setValue('imageUrl', '', { shouldValidate: true })}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-200 hover:bg-slate-300 rounded-full transition-colors"
                            >
                              <X className="w-3 h-3 text-slate-600" />
                            </button>
                          )}
                        </div>
                        {errors.imageUrl && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.imageUrl.message}</p>}
                      </div>
                      
                      {imageUrl ? (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-14 h-14 rounded-xl border-2 border-emerald-500 overflow-hidden shrink-0 shadow-lg relative group cursor-pointer"
                          onClick={() => setShowFullPreview(true)}
                        >
                          <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors" />
                          <div className="absolute top-0 right-0 p-0.5 bg-emerald-500 rounded-bl-lg shadow-sm">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        </motion.div>
                      ) : (
                        <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 shrink-0">
                          <Camera className="w-5 h-5 text-slate-300" />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <label 
                        className={cn(
                          "py-3 px-4 rounded-xl text-[10px] font-black transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm uppercase tracking-widest cursor-pointer hover:opacity-90",
                          imageUrl
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                            : "bg-slate-900 text-white shadow-slate-200"
                        )}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {imageUrl ? "Change Photo" : t('uploadFromDevice')}
                        <input 
                          type="file" 
                          accept="image/jpeg,image/png,image/webp" 
                          className="hidden" 
                          onChange={handleFileUpload}
                        />
                      </label>
                      
                      <button 
                        type="button" 
                        onClick={() => setValue('imageUrl', 'https://images.unsplash.com/photo-1594498653385-d5172b532c00?q=80&w=640&auto=format&fit=crop', { shouldValidate: true, shouldDirty: true })}
                        className="py-3 px-4 bg-slate-100 hover:bg-slate-200 rounded-xl text-[10px] font-black text-slate-600 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        {t('samplePhoto')}
                      </button>
                    </div>

                    {imageUrl && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-[10px] font-black text-blue-700 uppercase tracking-tight">Image processed successfully</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setShowFullPreview(true)}
                          className="text-[10px] font-black text-blue-600 hover:underline uppercase"
                        >
                          View Full Size
                        </button>
                      </motion.div>
                    )}
                  </div>
              </div>

              <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('issueCategory')}</label>
                  <select 
                    {...register('category')}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  >
                    <option value="Waste">Waste / Sanitation</option>
                    <option value="Pothole">Pothole / Road Repair</option>
                    <option value="Water">Water Leak / Shortage</option>
                    <option value="Electricity">Electricity / Street Lights</option>
                    <option value="Other">Other Issues</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('locationZip')}</label>
                  <select 
                    {...register('zipCode')}
                    className={cn(
                      "w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all",
                      errors.zipCode ? "border-red-500 focus:ring-red-500/20" : "border-slate-200"
                    )}
                  >
                    <option value="">Select your area...</option>
                    {zipCodes.map(zip => (
                      <option key={zip.code} value={zip.code}>{zip.name} ({zip.code})</option>
                    ))}
                  </select>
                  {errors.zipCode && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.zipCode.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('headline')}</label>
                  <input 
                    {...register('title')}
                    placeholder="Briefly describe the problem (e.g. Broken streetlight on 4th Ave)" 
                    className={cn(
                      "w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all",
                      errors.title ? "border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500"
                    )}
                  />
                  {errors.title && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.title.message}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">{t('detailsContext')}</label>
                  <textarea 
                    {...register('description')}
                    rows={4}
                    placeholder="What's the exact location? How long has this been happening?" 
                    className={cn(
                      "w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all resize-none",
                      errors.description ? "border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500"
                    )}
                  />
                  {errors.description && <p className="text-[10px] text-red-500 font-bold ml-1">{errors.description.message}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-600 tracking-tight">Geo-tag: 12.9716° N, 77.5946° E (Auto-detected)</span>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70"
              >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="animate-pulse">Processing...</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            {t('submit')}
          </>
        )}
      </button>
    </form>
          </motion.div>

          <AnimatePresence>
            {showFullPreview && imageUrl && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md"
              >
                <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl">
                  <div className="absolute top-4 right-4 z-10">
                    <button 
                      onClick={() => setShowFullPreview(false)}
                      className="p-2 bg-slate-900/50 backdrop-blur-md text-white rounded-full shadow-lg hover:bg-slate-900 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <img src={imageUrl} alt="Full Preview" className="w-full h-auto max-h-[80vh] object-contain bg-slate-50" />
                  <div className="p-4 bg-white flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Image Preview</span>
                    <button 
                      onClick={() => setShowFullPreview(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
