import React from 'react';
import { ArrowLeft, Feather } from 'lucide-react';

interface AboutViewProps {
  onBack: () => void;
  onExplore: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onBack, onExplore }) => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 font-serif text-[#28311F]">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#68715F] hover:text-[#28311F] mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </button>

      <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-white/80">
        <div className="w-12 h-12 rounded-full bg-[#2C3A22]/10 flex items-center justify-center text-[#2C3A22] mb-6">
          <Feather className="w-6 h-6 stroke-[1.5]" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-medium tracking-tight mb-6">
          About Akhyana
        </h1>

        <p className="text-lg text-[#68715F] leading-relaxed mb-6 font-serif">
          *Akhyana* (आख्यान) derives from the classical Sanskrit concept of narrative: stories that carry memory across generations, whispered under canopies, read in quiet courtyards during monsoon rains, or treasured in hidden bookshops.
        </p>

        <div className="space-y-6 text-sm text-[#28311F] leading-relaxed border-t border-[#2C3A22]/15 pt-6">
          <p>
            We are an independent digital publishing imprint dedicated to original fiction, web novels, and light novels. Our works explore rich fantasy worlds, quiet introspective mysteries, and cross-cultural folklore across Hinglish, English, and Japanese.
          </p>

          <h3 className="text-xl font-medium pt-2">The "Forest Quiet" Philosophy</h3>
          <p className="text-[#68715F]">
            Modern reading interfaces are often overcrowded with distracting notifications, gamified points, and aggressive engagement prompts. Akhyana is built on the inverse principle: the *Forest Quiet* aesthetic. Pale sage tones, soft sunlight, frosted glass panels, and the uncluttered elegance of Times New Roman typography let the prose breathe and take center stage.
          </p>

          <h3 className="text-xl font-medium pt-2">Multilingual Publishing</h3>
          <p className="text-[#68715F]">
            Every story on Akhyana is crafted with attention to linguistic nuance. Whether reading an English chapter, exploring Japanese translations set in authentic vertical and horizontal serif type, or savoring Hinglish prose, translations are handled with fidelity rather than machine shortcuts.
          </p>
        </div>

        <div className="mt-10 pt-8 border-t border-[#2C3A22]/15 flex items-center justify-between">
          <span className="text-xs italic text-[#B08D46]">
            Every story leaves a shadow.
          </span>
          <button
            onClick={onExplore}
            className="px-6 py-2.5 bg-[#2C3A22] text-[#EEF0E4] rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer"
          >
            Explore Stories ↗
          </button>
        </div>
      </div>
    </div>
  );
};
