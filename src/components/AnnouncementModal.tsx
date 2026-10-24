import React from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { Announcement } from '../types';

interface AnnouncementModalProps {
  announcement: Announcement;
  onDismiss: (id: string) => void;
  onActionClick?: (url: string) => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  announcement,
  onDismiss,
  onActionClick
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="announcement-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C3A22]/30 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg glass-panel-dark text-[#EEF0E4] rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 overflow-hidden">
        
        {/* Subtle decorative gold light */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#B08D46]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close (×) Button */}
        <button
          onClick={() => onDismiss(announcement.id)}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-[#EEF0E4] transition-colors cursor-pointer"
          aria-label="Dismiss Announcement"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#B08D46]/25 border border-[#B08D46]/40 text-[#E8D29F] text-xs font-serif uppercase tracking-widest mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Notice from the Author</span>
        </div>

        {/* Optional Image */}
        {announcement.image_url && (
          <div className="mb-4 rounded-xl overflow-hidden aspect-video w-full bg-black/20">
            <img
              src={announcement.image_url}
              alt=""
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Title */}
        <h2 id="announcement-title" className="text-2xl font-serif font-medium tracking-tight mb-3 text-white">
          {announcement.title}
        </h2>

        {/* Message */}
        <p className="font-serif text-sm text-[#D5E0CC] leading-relaxed mb-6">
          {announcement.message}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
          <button
            onClick={() => onDismiss(announcement.id)}
            className="px-4 py-2 text-xs font-serif uppercase tracking-wider text-[#D5E0CC] hover:text-white transition-colors cursor-pointer"
          >
            Close & Remember
          </button>

          {announcement.action_url && announcement.action_label && (
            <button
              onClick={() => {
                onDismiss(announcement.id);
                if (onActionClick) onActionClick(announcement.action_url!);
              }}
              className="px-5 py-2.5 bg-[#B08D46] hover:bg-[#9B7A38] text-[#1E2619] rounded-xl text-xs font-serif uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>{announcement.action_label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
