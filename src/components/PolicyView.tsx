import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

interface PolicyViewProps {
  type: 'privacy' | 'terms';
  onBack: () => void;
}

export const PolicyView: React.FC<PolicyViewProps> = ({ type, onBack }) => {
  const isPrivacy = type === 'privacy';

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 font-serif text-[#28311F]">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#68715F] hover:text-[#28311F] mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Site</span>
      </button>

      <div className="glass-panel rounded-3xl p-8 sm:p-12 border border-white/80">
        <div className="w-10 h-10 rounded-full bg-[#2C3A22]/10 flex items-center justify-center text-[#2C3A22] mb-6">
          <Shield className="w-5 h-5 stroke-[1.5]" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-medium tracking-tight mb-4">
          {isPrivacy ? 'Privacy & Reader Sovereignty' : 'Terms of Use & Copyright Notice'}
        </h1>

        <p className="text-xs text-[#68715F] uppercase tracking-wider mb-8">
          Last Updated: October 2026 · Akhyana Publishing Press
        </p>

        {isPrivacy ? (
          <div className="space-y-6 text-sm leading-relaxed text-[#68715F]">
            <p className="text-[#28311F] font-medium text-base">
              At Akhyana, we believe literature is an intimate sanctuary between author and reader.
            </p>
            <div>
              <h3 className="text-[#28311F] font-semibold text-base mb-2">1. Privacy-Conscious Reading Progress</h3>
              <p>
                Reading progress and new-chapter alerts operate through an anonymous cryptographic reader identifier stored locally on your device. We do not track personal identities, sell browsing history, or share reading profiles with advertising brokers.
              </p>
            </div>
            <div>
              <h3 className="text-[#28311F] font-semibold text-base mb-2">2. Discussion Comments</h3>
              <p>
                When you contribute to a novel discussion, your chosen display name and message are stored solely to facilitate community dialogue on that work.
              </p>
            </div>
            <div>
              <h3 className="text-[#28311F] font-semibold text-base mb-2">3. Storage & Security</h3>
              <p>
                All data is maintained using secure server-side sessions, password hashing (bcrypt), and encrypted databases.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 text-sm leading-relaxed text-[#68715F]">
            <p className="text-[#28311F] font-medium text-base">
              All original fiction, light novels, translations, and illustrations on Akhyana are protected intellectual property.
            </p>
            <div>
              <h3 className="text-[#28311F] font-semibold text-base mb-2">1. Copyright & Authorship</h3>
              <p>
                Manuscripts, character designs, worldbuilding lore, and artistic assets published on Akhyana remain the exclusive property of their respective creators. Unauthorized reproduction, web scraping for model training, or commercial distribution without written consent is strictly prohibited.
              </p>
            </div>
            <div>
              <h3 className="text-[#28311F] font-semibold text-base mb-2">2. Reader Conduct</h3>
              <p>
                Readers are encouraged to participate in thoughtful discussions. Harassment, spam, or abusive comments will be removed by editorial moderators.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
