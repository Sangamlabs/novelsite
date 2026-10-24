import React from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { NewChapterAlertData } from '../types';

interface NewChapterAlertProps {
  alerts: NewChapterAlertData[];
  onDismiss: () => void;
  onReadChapter: (novelSlug: string, chapterSlug: string) => void;
}

export const NewChapterAlert: React.FC<NewChapterAlertProps> = ({
  alerts,
  onDismiss,
  onReadChapter
}) => {
  if (alerts.length === 0) return null;

  const firstAlert = alerts[0];

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-sm w-full mx-auto p-1 animate-in slide-in-from-bottom-5 duration-300">
      <div className="relative glass-panel rounded-2xl p-4 shadow-xl border border-white/90 bg-white/90">
        
        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full text-[#68715F] hover:text-[#28311F] hover:bg-black/5 transition-colors cursor-pointer"
          aria-label="Dismiss new chapter alert"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-start gap-3">
          {/* Novel Cover */}
          <img
            src={firstAlert.novel.cover_url}
            alt={firstAlert.novel.title}
            referrerPolicy="no-referrer"
            className="w-12 h-16 object-cover rounded-md shadow-xs shrink-0 border border-[#2C3A22]/15"
          />

          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-1.5 text-[11px] font-sans text-[#B08D46] font-medium uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3 h-3" />
              <span>New Installment Ready</span>
            </div>

            <h4 className="font-serif text-sm font-medium text-[#28311F] truncate">
              {firstAlert.novel.title}
            </h4>

            <p className="text-xs font-serif text-[#68715F] truncate">
              Ch. {firstAlert.latestChapter.chapter_number}: {firstAlert.latestChapter.title}
            </p>

            <button
              onClick={() => onReadChapter(firstAlert.novel.slug, firstAlert.latestChapter.slug)}
              className="mt-2 text-xs font-serif text-[#2C3A22] font-semibold hover:underline underline-offset-4 flex items-center gap-1 cursor-pointer"
            >
              <span>Read Now</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
