import React, { useState } from 'react';
import { Bookmark, BookOpen, Globe } from 'lucide-react';
import { Novel, LanguageCode } from '../types';
import { UI_TRANSLATIONS } from '../utils/translations';

interface NovelCardProps {
  novel: Novel;
  interfaceLanguage: LanguageCode;
  isBookmarked: boolean;
  onToggleBookmark: (slug: string) => void;
  onSelect: (slug: string) => void;
  onRead: (slug: string) => void;
}

export const NovelCard: React.FC<NovelCardProps> = ({
  novel,
  interfaceLanguage,
  isBookmarked,
  onToggleBookmark,
  onSelect,
  onRead
}) => {
  const [imageError, setImageError] = useState(false);
  const t = UI_TRANSLATIONS[interfaceLanguage] || UI_TRANSLATIONS.en;

  // Determine localized title/synopsis if available
  const localized = novel.translations?.[interfaceLanguage];
  const title = localized?.title || novel.title;
  const synopsis = localized?.synopsis || novel.synopsis;

  const languageLabels: Record<string, string> = {
    en: 'EN',
    jp: '日本語',
    hi: 'Hinglish'
  };

  return (
    <article className="group relative flex flex-col justify-between glass-panel rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md border border-white/75">
      <div>
        {/* Cover Image Slot with 3:4 aspect ratio & resilient fallback */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#DDE5D2]/40 mb-4 border border-[#2C3A22]/10">
          {!imageError && novel.cover_url ? (
            <img
              src={novel.cover_url}
              alt={`Cover for ${title}`}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-103"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-[#DDE5D2] to-[#EEF0E4]">
              <BookOpen className="w-8 h-8 text-[#2C3A22]/50 mb-2" />
              <p className="font-serif text-sm font-medium text-[#28311F]">{title}</p>
              <p className="text-xs text-[#68715F] mt-1 font-serif">{novel.author}</p>
            </div>
          )}

          {/* Bookmark Quick Action Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(novel.slug);
            }}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer ${
              isBookmarked
                ? 'bg-[#2C3A22] text-[#EEF0E4]'
                : 'bg-white/70 text-[#28311F] hover:bg-white'
            }`}
            aria-label={isBookmarked ? 'Remove from library' : 'Save to library'}
          >
            <Bookmark className="w-3.5 h-3.5" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Clean Unboxed Metadata Line (Zero-Pill Discipline) */}
        <div className="flex items-center gap-1.5 text-xs text-[#68715F] font-serif mb-2 flex-wrap">
          <span>{novel.genres[0] || 'Fiction'}</span>
          <span aria-hidden="true">·</span>
          <span className="capitalize">{novel.status}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {novel.available_languages.map(l => languageLabels[l] || l.toUpperCase()).join(' / ')}
          </span>
        </div>

        {/* Novel Title */}
        <h3
          onClick={() => onSelect(novel.slug)}
          className="text-xl font-serif font-medium text-[#28311F] leading-snug cursor-pointer group-hover:text-[#2C3A22] transition-colors"
        >
          {title}
        </h3>

        {/* Author Attribution */}
        <p className="text-xs text-[#68715F] font-serif mt-1">
          By <span className="text-[#28311F] font-medium">{novel.author}</span>
        </p>

        {/* Short Synopsis */}
        <p className="text-xs text-[#68715F] font-serif line-clamp-3 mt-3 leading-relaxed">
          {synopsis}
        </p>
      </div>

      {/* Card Action Footer */}
      <div className="mt-6 pt-4 border-t border-[#2C3A22]/10 flex items-center justify-between gap-3">
        <button
          onClick={() => onSelect(novel.slug)}
          className="text-xs font-serif text-[#28311F] hover:underline underline-offset-4 py-1.5 cursor-pointer"
        >
          {interfaceLanguage === 'hi' ? 'Details & Chapters' : interfaceLanguage === 'jp' ? '詳細・目次' : 'Details & Archive'}
        </button>

        <button
          onClick={() => onRead(novel.slug)}
          className="px-3.5 py-1.5 bg-[#2C3A22] text-[#EEF0E4] hover:bg-[#1D2716] rounded-lg text-xs font-serif uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <span>{t.readNow}</span>
          <BookOpen className="w-3 h-3" />
        </button>
      </div>
    </article>
  );
};
