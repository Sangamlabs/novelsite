import React from 'react';
import { BookOpen, Sparkles, Bookmark, ArrowRight, Clock } from 'lucide-react';
import { Novel, Chapter, ReadingProgress } from '../types';

interface ReadingProgressCardsProps {
  readingHistory: ReadingProgress[];
  novels: Novel[];
  latestChapter: Chapter | null;
  savedNovelSlugs: string[];
  onOpenChapter: (novelSlug: string, chapterSlug: string) => void;
  onOpenNovel: (novelSlug: string) => void;
  onExplore: () => void;
  onOpenLibrary: () => void;
}

export const ReadingProgressCards: React.FC<ReadingProgressCardsProps> = ({
  readingHistory,
  novels,
  latestChapter,
  savedNovelSlugs,
  onOpenChapter,
  onOpenNovel,
  onExplore,
  onOpenLibrary
}) => {
  // Find current active reading item
  const activeProgress = readingHistory.length > 0 ? readingHistory[0] : null;
  const activeNovel = activeProgress ? novels.find(n => n.slug === activeProgress.novel_slug) : null;

  // Novel for recently updated card
  const latestNovel = latestChapter ? novels.find(n => n.slug === latestChapter.novel_slug) : null;

  // Format relative timestamp
  const formatTime = (iso?: string | null) => {
    if (!iso) return 'Recently';
    const date = new Date(iso);
    const diffHours = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (diffHours < 24) return `${Math.max(1, diffHours)}h ago`;
    const days = Math.round(diffHours / 24);
    return `${days}d ago`;
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Card A: Continue Reading */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200">
          <div>
            <div className="flex items-center justify-between text-xs font-serif text-[#68715F] mb-4">
              <span className="uppercase tracking-wider">Reading In Progress</span>
              <BookOpen className="w-4 h-4 text-[#2C3A22]" />
            </div>

            {activeNovel && activeProgress ? (
              <div className="flex gap-4 items-start">
                <img
                  src={activeNovel.cover_url}
                  alt={activeNovel.title}
                  referrerPolicy="no-referrer"
                  className="w-16 h-22 object-cover rounded-md shadow-xs shrink-0 border border-white/60"
                  onError={(e) => {
                    // Fallback to placeholder if image fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="flex flex-col min-w-0">
                  <h3 className="font-serif text-lg font-medium text-[#28311F] truncate">
                    {activeNovel.title}
                  </h3>
                  <p className="text-xs font-serif text-[#68715F] mt-0.5">
                    Chapter {activeProgress.last_chapter_number}
                  </p>
                  <div className="mt-3 w-full bg-[#DDE5D2] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#2C3A22] h-full rounded-full transition-all"
                      style={{ width: `${Math.max(15, activeProgress.progress_percent)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-sans text-[#68715F] mt-1 tabular-nums">
                    {Math.round(activeProgress.progress_percent)}% finished
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-5 text-center flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#DDE5D2]/50 flex items-center justify-center text-[#68715F] mb-2">
                  <BookOpen className="w-5 h-5" />
                </div>
                <p className="font-serif text-sm text-[#28311F]">No reading history yet</p>
                <p className="text-xs text-[#68715F] mt-1 font-serif">
                  Pick any story from the catalog to begin.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#2C3A22]/10">
            {activeNovel && activeProgress ? (
              <button
                onClick={() => onOpenChapter(activeNovel.slug, activeProgress.last_chapter_id)}
                className="w-full py-2.5 px-4 bg-[#2C3A22] text-[#EEF0E4] hover:bg-[#1D2716] rounded-xl text-xs font-serif uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Continue Reading</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={onExplore}
                className="w-full py-2.5 px-4 bg-white/70 hover:bg-white text-[#28311F] border border-[#2C3A22]/15 rounded-xl text-xs font-serif uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Explore Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Card B: Recently Updated */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200">
          <div>
            <div className="flex items-center justify-between text-xs font-serif text-[#68715F] mb-4">
              <span className="uppercase tracking-wider">Recently Published</span>
              <Sparkles className="w-4 h-4 text-[#B08D46]" />
            </div>

            {latestNovel && latestChapter ? (
              <div className="flex gap-4 items-start">
                <img
                  src={latestNovel.cover_url}
                  alt={latestNovel.title}
                  referrerPolicy="no-referrer"
                  className="w-16 h-22 object-cover rounded-md shadow-xs shrink-0 border border-white/60"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-sans text-[#B08D46] uppercase tracking-wider font-medium">
                    New Chapter
                  </span>
                  <h3 className="font-serif text-lg font-medium text-[#28311F] truncate">
                    {latestNovel.title}
                  </h3>
                  <p className="text-xs font-serif text-[#28311F]/80 mt-0.5 truncate">
                    Ch. {latestChapter.chapter_number}: {latestChapter.title}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] font-serif text-[#68715F] mt-2">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(latestChapter.published_at || latestChapter.created_at)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{latestChapter.word_count} words</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-5 text-center flex flex-col items-center">
                <p className="font-serif text-sm text-[#28311F]">No recent releases</p>
                <p className="text-xs text-[#68715F] mt-1 font-serif">
                  New chapters will appear here upon publication.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-[#2C3A22]/10">
            {latestNovel && latestChapter && (
              <button
                onClick={() => onOpenChapter(latestNovel.slug, latestChapter.slug)}
                className="w-full py-2.5 px-4 bg-white/70 hover:bg-white text-[#28311F] border border-[#2C3A22]/15 rounded-xl text-xs font-serif uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Read Chapter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Card C: Your Library */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between transition-transform hover:-translate-y-0.5 duration-200">
          <div>
            <div className="flex items-center justify-between text-xs font-serif text-[#68715F] mb-4">
              <span className="uppercase tracking-wider">Your Library</span>
              <Bookmark className="w-4 h-4 text-[#2C3A22]" />
            </div>

            <div className="py-2">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-serif font-bold text-[#28311F] tabular-nums">
                  {savedNovelSlugs.length}
                </span>
                <span className="text-xs font-serif text-[#68715F]">
                  {savedNovelSlugs.length === 1 ? 'novel saved' : 'novels saved'}
                </span>
              </div>
              <p className="text-xs font-serif text-[#68715F] leading-relaxed">
                {savedNovelSlugs.length > 0
                  ? 'Your bookmarked stories are saved locally on this browser for easy access.'
                  : 'Bookmark novels to build your private literary collection across visits.'}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#2C3A22]/10">
            <button
              onClick={onOpenLibrary}
              className="w-full py-2.5 px-4 bg-white/70 hover:bg-white text-[#28311F] border border-[#2C3A22]/15 rounded-xl text-xs font-serif uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{savedNovelSlugs.length > 0 ? 'Open Saved Library' : 'Browse To Save'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
