import React from 'react';
import { Compass, BookOpen } from 'lucide-react';
import { Novel, LanguageCode } from '../types';
import { UI_TRANSLATIONS } from '../utils/translations';
import forestBackground from '../assets/images/forest_quiet_hero_bg_1792815708624.jpg';
interface HeroProps {
  onExplore: () => void;
  onContinueReading: () => void;
  hasReadingHistory: boolean;
  featuredNovel?: Novel;
  interfaceLanguage?: LanguageCode;
}

export const Hero: React.FC<HeroProps> = ({
  onExplore,
  onContinueReading,
  hasReadingHistory,
  featuredNovel,
  interfaceLanguage = 'en'
}) => {
  const t = UI_TRANSLATIONS[interfaceLanguage] || UI_TRANSLATIONS.en;

  return (
    <section className="relative w-full min-h-[82vh] flex items-center justify-center overflow-hidden py-16 px-6">
      {/* Botanical Forest Quiet Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src={forestBackground}
          alt="Tranquil sage sunlit botanical background"
          className="w-full h-full object-cover object-center opacity-85"
        />
        {/* Soft center vignette to maintain exquisite contrast and text readability */}
        <div className="absolute inset-0 bg-radial from-[#EEF0E4]/90 via-[#EEF0E4]/60 to-transparent" />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
        
        {/* Small Editorial Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/70 border border-[#2C3A22]/15 text-[#2C3A22] text-xs uppercase tracking-widest font-serif mb-6 shadow-xs backdrop-blur-xs">
          <span>{t.heroTagline}</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-medium tracking-tight text-[#28311F] max-w-3xl leading-[1.08] mb-6 text-balance">
          {t.heroHeadline}
        </h1>

        {/* Supporting Copy */}
        <p className="text-lg sm:text-xl text-[#68715F] font-serif max-w-2xl leading-relaxed mb-10 text-balance">
          {t.heroDescription}
        </p>

        {/* Primary and Secondary Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onExplore}
            className="px-7 py-3.5 text-sm uppercase tracking-wider font-serif bg-[#2C3A22] text-[#EEF0E4] rounded-xl hover:bg-[#1C2615] hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4 stroke-[1.75]" />
            <span>{t.heroExploreCta}</span>
          </button>

          <button
            onClick={onContinueReading}
            className="px-6 py-3.5 text-sm uppercase tracking-wider font-serif bg-white/60 hover:bg-white/80 text-[#28311F] rounded-xl border border-[#2C3A22]/15 hover:border-[#2C3A22]/30 transition-all flex items-center gap-2 cursor-pointer shadow-xs backdrop-blur-xs"
          >
            <BookOpen className="w-4 h-4 text-[#2C3A22]" />
            <span>{hasReadingHistory ? t.heroContinueReading : t.heroLatestReleases}</span>
          </button>
        </div>

        {/* Subtle Editorial Kicker */}
        {featuredNovel && (
          <div className="mt-14 pt-8 border-t border-[#2C3A22]/10 flex items-center gap-3 text-xs font-serif text-[#68715F]">
            <span className="text-[#B08D46] tracking-wider uppercase">Featured Series:</span>
            <span className="text-[#28311F] font-medium">{featuredNovel.title}</span>
            <span aria-hidden="true">·</span>
            <span>By {featuredNovel.author}</span>
          </div>
        )}
      </div>
    </section>
  );
};
