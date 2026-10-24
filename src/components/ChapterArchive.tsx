import React, { useState } from 'react';
import { BookOpen, Clock, Globe, ArrowLeft, Search } from 'lucide-react';
import { Novel, Chapter } from '../types';

interface ChapterArchiveProps {
  novels: Novel[];
  chapters: Chapter[];
  onOpenChapter: (novelSlug: string, chapterSlug: string) => void;
  onOpenNovel: (novelSlug: string) => void;
  onBack: () => void;
}

export const ChapterArchive: React.FC<ChapterArchiveProps> = ({
  novels,
  chapters,
  onOpenChapter,
  onOpenNovel,
  onBack
}) => {
  const [selectedNovelSlug, setSelectedNovelSlug] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const publicChapters = chapters.filter(c => c.status === 'published');

  const filteredChapters = publicChapters.filter(c => {
    if (selectedNovelSlug !== 'all' && c.novel_slug !== selectedNovelSlug) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = c.title.toLowerCase().includes(q);
      const numberMatch = c.chapter_number.toString().includes(q);
      const novelMatch = c.novel_slug.toLowerCase().includes(q);
      return titleMatch || numberMatch || novelMatch;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-serif uppercase tracking-wider text-[#68715F] hover:text-[#28311F] mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </button>

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-serif font-medium text-[#28311F] mb-2">
          Chronological Chapter Archive
        </h1>
        <p className="text-sm font-serif text-[#68715F]">
          Explore published installments across all active serials and translations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between border border-white/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#68715F]" />
          <input
            type="text"
            placeholder="Search chapters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-xs font-serif text-[#28311F] placeholder-[#68715F]/70 focus:outline-none focus:ring-1 focus:ring-[#2C3A22]"
          />
        </div>

        {/* Novel filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedNovelSlug('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif transition-colors whitespace-nowrap cursor-pointer ${
              selectedNovelSlug === 'all'
                ? 'bg-[#2C3A22] text-[#EEF0E4]'
                : 'bg-white/50 text-[#68715F] hover:text-[#28311F]'
            }`}
          >
            All Novels
          </button>
          {novels.map(n => (
            <button
              key={n.id}
              onClick={() => setSelectedNovelSlug(n.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-serif transition-colors whitespace-nowrap cursor-pointer ${
                selectedNovelSlug === n.slug
                  ? 'bg-[#2C3A22] text-[#EEF0E4]'
                  : 'bg-white/50 text-[#68715F] hover:text-[#28311F]'
              }`}
            >
              {n.title}
            </button>
          ))}
        </div>
      </div>

      {/* Chapters Listing */}
      {filteredChapters.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center text-sm font-serif text-[#68715F]">
          No published chapters match your filter criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredChapters.map(ch => {
            const novel = novels.find(n => n.slug === ch.novel_slug);
            return (
              <div
                key={ch.id}
                onClick={() => onOpenChapter(ch.novel_slug, ch.slug)}
                className="group glass-panel rounded-xl p-5 hover:bg-white/80 transition-all cursor-pointer border border-white/70 flex items-start gap-4"
              >
                {(ch.cover_url || novel?.cover_url) && (
                  <img
                    src={ch.cover_url || novel?.cover_url}
                    alt={ch.title || novel?.title || ''}
                    referrerPolicy="no-referrer"
                    className="w-14 h-20 object-cover rounded-md shadow-xs shrink-0 border border-white/50"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 text-xs font-serif text-[#68715F] mb-1">
                    <span className="text-[#B08D46] font-medium truncate">
                      {novel?.title || ch.novel_slug}
                    </span>
                    <span className="shrink-0">{ch.published_at ? new Date(ch.published_at).toLocaleDateString() : 'Published'}</span>
                  </div>

                  <h3 className="font-serif text-base font-medium text-[#28311F] truncate group-hover:text-[#2C3A22] transition-colors">
                    Ch. {ch.chapter_number}: {ch.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs font-serif text-[#68715F] mt-2">
                    <span className="tabular-nums">{ch.word_count} words</span>
                    <span aria-hidden="true">·</span>
                    <span className="uppercase">{ch.language}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
