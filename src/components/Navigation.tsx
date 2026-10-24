import React, { useState } from 'react';
import { BookOpen, Bookmark, Menu, X, Feather } from 'lucide-react';
import { LanguageCode } from '../types';
import { UI_TRANSLATIONS } from '../utils/translations';

interface NavigationProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
  interfaceLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  savedNovelCount: number;
  isLoggedIn: boolean;
  onOpenLibrary: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  onNavigate,
  interfaceLanguage,
  onLanguageChange,
  savedNovelCount,
  isLoggedIn,
  onOpenLibrary
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = UI_TRANSLATIONS[interfaceLanguage] || UI_TRANSLATIONS.en;

  const navLinks = [
    { id: 'home', label: t.navHome },
    { id: 'explore', label: t.navExplore },
    { id: 'genres', label: t.navGenres },
    { id: 'latest', label: t.navLatest },
    { id: 'about', label: t.navAbout }
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#EEF0E4]/85 border-b border-[#2C3A22]/10 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-8">
        
        {/* Zone 1: Brand Wordmark (Single text element with minimal literary icon) */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 group text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3A22]"
          aria-label="Akhyana Home"
        >
          <div className="w-8 h-8 rounded-full bg-[#2C3A22]/8 border border-[#2C3A22]/15 flex items-center justify-center text-[#2C3A22] transition-transform group-hover:scale-105">
            <Feather className="w-4 h-4 stroke-[1.5]" />
          </div>
          <span className="text-2xl font-serif tracking-tight text-[#28311F] whitespace-nowrap shrink-0">
            Akhyana
          </span>
        </button>

        {/* Zone 2: 5 Concise Single-Line Navigation Links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm tracking-wide text-[#68715F] font-serif">
          {navLinks.map(link => {
            const isActive = currentView === link.id;
            return (
              <button
                key={link.id}
                onClick={() => onNavigate(link.id)}
                className={`transition-colors hover:text-[#28311F] whitespace-nowrap shrink-0 py-1 border-b ${
                  isActive
                    ? 'text-[#28311F] border-[#2C3A22] font-medium'
                    : 'border-transparent'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Controls (Library, Language, Author Studio / Explore) */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          {/* Library Button */}
          <button
            onClick={onOpenLibrary}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-serif text-[#28311F] hover:bg-white/60 transition-colors border border-[#2C3A22]/10"
            title="Saved reading library"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{t.navLibrary}</span>
            {savedNovelCount > 0 && (
              <span className="text-[11px] font-sans px-1.5 py-0.2 rounded-full bg-[#2C3A22] text-[#EEF0E4]">
                {savedNovelCount}
              </span>
            )}
          </button>

          {/* Language Switcher */}
          <div className="flex items-center rounded-lg bg-white/50 border border-[#2C3A22]/10 p-0.5 text-xs font-serif">
            {(['en', 'jp', 'hi'] as LanguageCode[]).map(lang => (
              <button
                key={lang}
                onClick={() => onLanguageChange(lang)}
                className={`px-2 py-1 rounded transition-colors whitespace-nowrap ${
                  interfaceLanguage === lang
                    ? 'bg-[#2C3A22] text-[#EEF0E4] shadow-xs'
                    : 'text-[#68715F] hover:text-[#28311F]'
                }`}
              >
                {lang === 'en' ? 'English' : lang === 'jp' ? '日本語' : 'Hinglish'}
              </button>
            ))}
          </div>

          {/* Author Login / Studio Button */}
          {isLoggedIn ? (
            <button
              onClick={() => onNavigate('admin')}
              className="px-3.5 py-1.5 text-xs font-serif text-[#28311F] hover:bg-white/60 transition-colors border border-[#2C3A22]/15 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              title="Open Author Studio"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#2C3A22]" />
              <span>{t.navStudio}</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('login')}
              className="px-3.5 py-1.5 text-xs font-serif text-[#28311F] hover:bg-white/60 transition-colors border border-[#2C3A22]/15 rounded-lg flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
              title="Author & Staff Login"
            >
              <Feather className="w-3.5 h-3.5 text-[#2C3A22]" />
              <span>{t.navAuthorLogin}</span>
            </button>
          )}

          {/* Primary Action Button */}
          <button
            onClick={() => onNavigate('explore')}
            className="px-4 py-2 text-xs tracking-wider uppercase font-serif text-[#EEF0E4] bg-[#2C3A22] rounded-lg hover:bg-[#1D2716] transition-all shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.navExploreButton}
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex lg:hidden items-center gap-2">
          <button
            onClick={onOpenLibrary}
            className="p-2 text-[#28311F] rounded-lg hover:bg-white/50"
            aria-label="View Library"
          >
            <Bookmark className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#28311F] rounded-lg hover:bg-white/50 focus-visible:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-6 pt-4 pb-6 bg-[#EEF0E4]/95 backdrop-blur-xl border-b border-[#2C3A22]/15 flex flex-col gap-4 font-serif">
          <nav className="flex flex-col gap-3">
            {navLinks.map(link => (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setMobileMenuOpen(false);
                }}
                className="text-left text-base text-[#28311F] py-2 border-b border-[#2C3A22]/5"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-xs text-[#68715F]">Interface Language:</span>
            <div className="flex items-center gap-1">
              {(['en', 'jp', 'hi'] as LanguageCode[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => onLanguageChange(lang)}
                  className={`px-2.5 py-1 text-xs rounded ${
                    interfaceLanguage === lang
                      ? 'bg-[#2C3A22] text-[#EEF0E4]'
                      : 'bg-white/40 text-[#68715F]'
                  }`}
                >
                  {lang === 'en' ? 'EN' : lang === 'jp' ? 'JP' : 'HI'}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                onNavigate(isLoggedIn ? 'admin' : 'login');
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 text-center text-xs tracking-wider uppercase bg-[#2C3A22] text-[#EEF0E4] rounded-lg"
            >
              {isLoggedIn ? 'Open Author Studio' : 'Author Studio Login'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
