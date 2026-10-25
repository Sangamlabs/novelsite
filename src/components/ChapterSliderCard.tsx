import React from 'react';
import { BookOpen, Calendar, Clock, Feather } from 'lucide-react';
import { Chapter, Novel } from '../types';

interface ChapterSliderCardProps {
  chapter: Chapter;
  novel?: Novel;
  onReadChapter: (novelSlug: string, chapterSlug: string) => void;
  onOpenNovel: (novelSlug: string) => void;
}

export const ChapterSliderCard: React.FC<ChapterSliderCardProps> = ({
  chapter,
  novel,
  onReadChapter,
  onOpenNovel
}) => {
  const novelTitle = novel?.title || chapter.novel_slug.replace(/-/g, ' ');
  const novelCover = novel?.cover_url || chapter.cover_url;

  // Format date cleanly
  const dateFormatted = chapter.published_at || chapter.created_at
    ? new Date(chapter.published_at || chapter.created_at).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Recent';

  // Estimate read time (approx 200 words per minute)
  const readMinutes = Math.max(1, Math.ceil((chapter.word_count || 1200) / 200));

  return (
    <article className="group h-full flex flex-col justify-between glass-panel rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md border border-white/75 font-serif">
      <div>
        {/* Cover Thumbnail / Header Slot */}
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#2C3A22]/10">
          <div
            onClick={() => onOpenNovel(chapter.novel_slug)}
            className="w-12 h-16 rounded-lg bg-[#DDE5D2]/50 overflow-hidden shrink-0 border border-[#2C3A22]/15 cursor-pointer shadow-2xs"
          >
            {novelCover ? (
              <img
                src={novelCover}
                alt={novelTitle}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#2C3A22]/50">
                <BookOpen className="w-5 h-5" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onOpenNovel(chapter.novel_slug)}
              className="text-xs font-serif text-[#B08D46] hover:underline truncate block w-full text-left font-medium"
              title={novelTitle}
            >
              {novelTitle}
            </button>
            <div className="text-[11px] text-[#68715F] font-serif mt-0.5">
              Chapter {chapter.chapter_number}
            </div>
          </div>
        </div>

        {/* Unboxed Metadata (Zero-Pill Discipline) */}
        <div className="flex items-center gap-2 text-[11px] text-[#68715F] font-serif mb-2 flex-wrap">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#2C3A22]/60" />
            {dateFormatted}
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#2C3A22]/60" />
            {readMinutes} min read
          </span>
          {chapter.word_count > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span>{chapter.word_count.toLocaleString()} words</span>
            </>
          )}
        </div>

        {/* Chapter Title */}
        <h3
          onClick={() => onReadChapter(chapter.novel_slug, chapter.slug)}
          className="text-lg font-serif font-medium text-[#28311F] leading-snug cursor-pointer group-hover:text-[#2C3A22] transition-colors line-clamp-2"
          title={chapter.title}
        >
          {chapter.title}
        </h3>

        {/* Chapter Snippet preview if available */}
        {chapter.body && (
          <p className="text-xs text-[#68715F] font-serif line-clamp-2 mt-2 leading-relaxed italic">
            "{chapter.body.slice(0, 120)}..."
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-[#2C3A22]/10 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onOpenNovel(chapter.novel_slug)}
          className="text-xs font-serif text-[#68715F] hover:text-[#28311F] hover:underline underline-offset-4 cursor-pointer"
        >
          View Novel
        </button>

        <button
          type="button"
          onClick={() => onReadChapter(chapter.novel_slug, chapter.slug)}
          className="px-3 py-1.5 bg-[#2C3A22] text-[#EEF0E4] hover:bg-[#1D2716] rounded-lg text-xs font-serif uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Feather className="w-3 h-3" />
          <span>Read</span>
        </button>
      </div>
    </article>
  );
};
