import React from 'react';
import { X, Bookmark, BookOpen, Trash2 } from 'lucide-react';
import { Novel } from '../types';

interface LibraryModalProps {
  savedNovels: Novel[];
  onClose: () => void;
  onOpenNovel: (slug: string) => void;
  onRemoveBookmark: (slug: string) => void;
  onExplore: () => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({
  savedNovels,
  onClose,
  onOpenNovel,
  onRemoveBookmark,
  onExplore
}) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2C3A22]/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/80 bg-white/95 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#2C3A22]/15">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-[#2C3A22]" />
            <h2 className="text-xl font-serif font-medium text-[#28311F]">Your Reading Library</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#68715F] hover:text-[#28311F] hover:bg-black/5"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {savedNovels.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#DDE5D2]/60 flex items-center justify-center text-[#68715F] mb-3">
                <Bookmark className="w-6 h-6" />
              </div>
              <p className="font-serif text-base text-[#28311F] font-medium">Your library is currently empty</p>
              <p className="font-serif text-xs text-[#68715F] max-w-xs mt-1 mb-6">
                Click the bookmark icon on any novel card to add it to your personal collection.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onExplore();
                }}
                className="px-5 py-2.5 bg-[#2C3A22] text-[#EEF0E4] rounded-xl text-xs font-serif uppercase tracking-wider cursor-pointer"
              >
                Explore Novels
              </button>
            </div>
          ) : (
            savedNovels.map(novel => (
              <div
                key={novel.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/70 border border-[#2C3A22]/10 hover:bg-white transition-colors"
              >
                <div
                  onClick={() => {
                    onClose();
                    onOpenNovel(novel.slug);
                  }}
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                >
                  <img
                    src={novel.cover_url}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-12 h-16 object-cover rounded-md shadow-xs border border-white/60 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-serif text-sm font-medium text-[#28311F] truncate hover:text-[#2C3A22]">
                      {novel.title}
                    </h3>
                    <p className="text-xs font-serif text-[#68715F]">By {novel.author}</p>
                    <span className="text-[10px] text-[#B08D46] font-serif uppercase">{novel.genres[0]}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenNovel(novel.slug);
                    }}
                    className="p-2 text-[#2C3A22] hover:bg-[#EEF0E4] rounded-lg cursor-pointer"
                    title="Open Novel"
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemoveBookmark(novel.slug)}
                    className="p-2 text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                    title="Remove from library"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {savedNovels.length > 0 && (
          <div className="pt-4 border-t border-[#2C3A22]/15 text-center text-xs font-serif text-[#68715F]">
            {savedNovels.length} {savedNovels.length === 1 ? 'novel' : 'novels'} saved
          </div>
        )}
      </div>
    </div>
  );
};
