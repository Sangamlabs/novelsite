import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Globe, Settings2, Moon, Sun, BookMarked } from 'lucide-react';
import { Novel, Chapter, LanguageCode } from '../types';
import { api } from '../services/api';

interface ChapterReaderProps {
  novel: Novel;
  chapter: Chapter;
  allChapters: Chapter[];
  contentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onSelectChapter: (novelSlug: string, chapterSlug: string) => void;
  onReturnToNovel: (novelSlug: string) => void;
}

type ReaderTheme = 'sage' | 'paper' | 'sepia' | 'night';
type FontSize = 'sm' | 'base' | 'lg' | 'xl';

export const ChapterReader: React.FC<ChapterReaderProps> = ({
  novel,
  chapter,
  allChapters,
  contentLanguage,
  onLanguageChange,
  onSelectChapter,
  onReturnToNovel
}) => {
  const [theme, setTheme] = useState<ReaderTheme>('sage');
  const [fontSize, setFontSize] = useState<FontSize>('lg');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Determine current chapter content based on content language translation
  const translation = chapter.translations?.[contentLanguage];
  const displayTitle = (contentLanguage !== chapter.language && translation?.title)
    ? translation.title
    : chapter.title;
  const displayBody = (contentLanguage !== chapter.language && translation?.body)
    ? translation.body
    : chapter.body;

  // Find previous and next chapters
  const sortedChapters = [...allChapters].sort((a, b) => a.order_index - b.order_index);
  const currentIndex = sortedChapters.findIndex(c => c.id === chapter.id || c.slug === chapter.slug);
  const prevChapter = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

  // Record reading progress on mount & scroll
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    api.recordProgress(novel.slug, chapter, 100);
  }, [chapter.id]);

  // Track scroll progress for literary reading bar
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(progress);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const themeClasses: Record<ReaderTheme, { bg: string; text: string; header: string; panel: string }> = {
    sage: {
      bg: 'bg-[#EEF0E4]',
      text: 'text-[#28311F]',
      header: 'bg-[#EEF0E4]/90 border-[#2C3A22]/10',
      panel: 'bg-white/60 border-[#2C3A22]/15 text-[#28311F]'
    },
    paper: {
      bg: 'bg-[#FAF8F5]',
      text: 'text-[#1D211A]',
      header: 'bg-[#FAF8F5]/90 border-neutral-200',
      panel: 'bg-white/80 border-neutral-300 text-neutral-900'
    },
    sepia: {
      bg: 'bg-[#F4ECE1]',
      text: 'text-[#362B1D]',
      header: 'bg-[#F4ECE1]/90 border-[#B08D46]/20',
      panel: 'bg-[#EDE2D2] border-[#B08D46]/30 text-[#362B1D]'
    },
    night: {
      bg: 'bg-[#151B12]',
      text: 'text-[#D5E0CC]',
      header: 'bg-[#151B12]/95 border-white/10',
      panel: 'bg-[#20271C] border-white/15 text-[#D5E0CC]'
    }
  };

  const currentTheme = themeClasses[theme];

  const fontSizeClasses: Record<FontSize, string> = {
    sm: 'text-base leading-relaxed',
    base: 'text-lg leading-relaxed',
    lg: 'text-xl leading-loose',
    xl: 'text-2xl leading-loose'
  };

  return (
    <div className={`min-h-screen ${currentTheme.bg} ${currentTheme.text} transition-colors duration-200`}>
      {/* Scroll Progress Indicator Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-[#DDE5D2]/30">
        <div
          className="h-full bg-[#B08D46] transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Reader Floating Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-6 py-3.5 flex items-center justify-between gap-4 ${currentTheme.header}`}>
        <button
          onClick={() => onReturnToNovel(novel.slug)}
          className="inline-flex items-center gap-2 text-xs font-serif uppercase tracking-wider opacity-75 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">{novel.title}</span>
          <span className="sm:hidden">Archive</span>
        </button>

        {/* Dynamic Chapter Dropdown */}
        <div className="flex items-center gap-2 max-w-xs sm:max-w-md">
          <select
            value={chapter.slug}
            onChange={(e) => onSelectChapter(novel.slug, e.target.value)}
            className={`text-xs font-serif px-2.5 py-1.5 rounded-lg border focus:outline-none cursor-pointer truncate ${currentTheme.panel}`}
          >
            {sortedChapters.map((c) => (
              <option key={c.id} value={c.slug} className="bg-white text-[#28311F]">
                Ch. {c.chapter_number}: {c.title}
              </option>
            ))}
          </select>
        </div>

        {/* Controls toggler */}
        <div className="flex items-center gap-2">
          {/* Chapter Language selector */}
          <div className="flex items-center rounded-lg border p-0.5 text-xs font-serif">
            {(['en', 'jp', 'hi'] as LanguageCode[]).map(lang => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  contentLanguage === lang
                    ? 'bg-[#2C3A22] text-[#EEF0E4]'
                    : 'opacity-60 hover:opacity-100'
                }`}
                title={`Switch chapter translation to ${lang.toUpperCase()}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowControls(!showControls)}
            className={`p-2 rounded-lg border transition-colors cursor-pointer ${currentTheme.panel}`}
            aria-label="Reading Controls"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating Reader Settings Panel */}
      {showControls && (
        <div className={`fixed top-16 right-6 z-50 p-5 rounded-2xl shadow-xl border w-72 max-w-[calc(100vw-3rem)] backdrop-blur-xl ${currentTheme.panel}`}>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-current/10">
            <span className="text-xs uppercase tracking-widest font-serif font-medium">Reader Settings</span>
            <button
              onClick={() => setShowControls(false)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>

          {/* Theme Canvas Selector */}
          <div className="mb-4">
            <label className="block text-xs uppercase tracking-wider opacity-70 mb-2">Reading Canvas</label>
            <div className="grid grid-cols-4 gap-2">
              {(['sage', 'paper', 'sepia', 'night'] as ReaderTheme[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-serif capitalize border transition-all text-center ${
                    theme === t ? 'ring-2 ring-[#B08D46] font-semibold' : 'opacity-80 hover:opacity-100'
                  } ${
                    t === 'sage' ? 'bg-[#EEF0E4] text-[#28311F]' :
                    t === 'paper' ? 'bg-[#FAF8F5] text-[#1D211A]' :
                    t === 'sepia' ? 'bg-[#F4ECE1] text-[#362B1D]' :
                    'bg-[#151B12] text-[#D5E0CC]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Font Size Selector */}
          <div>
            <label className="block text-xs uppercase tracking-wider opacity-70 mb-2">Type Scale</label>
            <div className="grid grid-cols-4 gap-2">
              {(['sm', 'base', 'lg', 'xl'] as FontSize[]).map(s => (
                <button
                  key={s}
                  onClick={() => setFontSize(s)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-serif uppercase border transition-all text-center ${
                    fontSize === s ? 'ring-2 ring-[#B08D46] font-semibold' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Chapter Reading Canvas */}
      <main ref={containerRef} className="max-w-2xl mx-auto px-6 py-16 sm:py-20 font-serif">
        
        {/* Chapter Header */}
        <div className="text-center mb-14 pb-8 border-b border-current/15">
          <p className="text-xs uppercase tracking-widest text-[#B08D46] font-serif mb-2">
            Chapter {chapter.chapter_number}
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif font-medium tracking-tight mb-4 leading-tight text-balance">
            {displayTitle}
          </h1>
          <div className="flex items-center justify-center gap-2 text-xs opacity-70">
            <span>{novel.title}</span>
            <span aria-hidden="true">·</span>
            <span>By {novel.author}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{chapter.word_count} words</span>
          </div>
        </div>

        {/* Optional Chapter Artwork / Illustration */}
        {chapter.cover_url && (
          <div className="mb-12 rounded-2xl overflow-hidden shadow-sm border border-current/15 max-h-[420px] bg-black/5">
            <img
              src={chapter.cover_url}
              alt={displayTitle}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Chapter Prose Body */}
        <div className={`space-y-6 ${fontSizeClasses[fontSize]} text-balance selection:bg-[#B08D46]/20`}>
          {displayBody.split('\n\n').map((paragraph, idx) => {
            if (!paragraph.trim()) return null;
            return (
              <p key={idx} className="indent-6 sm:indent-8 first-of-type:indent-0">
                {paragraph}
              </p>
            );
          })}
        </div>

        {/* Chapter Bottom Navigation & Progress Acknowledgement */}
        <div className="mt-20 pt-10 border-t border-current/15 flex flex-col items-center">
          <div className="flex items-center justify-between w-full gap-4 mb-8">
            {prevChapter ? (
              <button
                onClick={() => onSelectChapter(novel.slug, prevChapter.slug)}
                className={`py-2.5 px-4 rounded-xl text-xs font-serif uppercase tracking-wider border flex items-center gap-2 transition-colors cursor-pointer ${currentTheme.panel}`}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Chapter {prevChapter.chapter_number}</span>
                <span className="sm:hidden">Prev</span>
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={() => onReturnToNovel(novel.slug)}
              className="text-xs font-serif uppercase tracking-widest opacity-75 hover:opacity-100 hover:underline underline-offset-4"
            >
              Table of Contents
            </button>

            {nextChapter ? (
              <button
                onClick={() => onSelectChapter(novel.slug, nextChapter.slug)}
                className="py-2.5 px-4 rounded-xl text-xs font-serif uppercase tracking-wider bg-[#2C3A22] text-[#EEF0E4] hover:bg-[#1D2716] flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <span className="hidden sm:inline">Chapter {nextChapter.chapter_number}</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-xs font-serif opacity-70">End of published chapters</span>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
