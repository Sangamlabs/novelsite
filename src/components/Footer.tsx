import React from 'react';
import { Feather, Shield, Mail, Send } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
  isLoggedIn: boolean;
  onOpenLogin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  isLoggedIn,
  onOpenLogin
}) => {
  return (
    <footer className="w-full border-t border-[#2C3A22]/15 bg-[#EEF0E4]/90 py-16 px-6 font-serif">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-12">
        
        {/* Brand Column */}
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-full bg-[#2C3A22]/10 border border-[#2C3A22]/15 flex items-center justify-center text-[#2C3A22]">
              <Feather className="w-3.5 h-3.5" />
            </div>
            <span className="text-2xl font-serif tracking-tight text-[#28311F]">
              Akhyana
            </span>
          </div>
          <p className="text-xs text-[#68715F] leading-relaxed mb-4">
            An original fiction and multilingual light novel publishing press. Built with quiet editorial reverence for timeless storytelling.
          </p>
          <p className="text-xs italic text-[#B08D46]">
            “Every story leaves a shadow.”
          </p>
        </div>

        {/* Navigation & Contact Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-xs text-[#68715F]">
          <div>
            <span className="uppercase tracking-widest text-[#28311F] font-semibold block mb-3">
              Catalog
            </span>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('explore')} className="hover:text-[#28311F] transition-colors cursor-pointer">
                  Explore Stories
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('genres')} className="hover:text-[#28311F] transition-colors cursor-pointer">
                  Browse Genres
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('latest')} className="hover:text-[#28311F] transition-colors cursor-pointer">
                  Latest Chapters
                </button>
              </li>
            </ul>
          </div>

          <div>
            <span className="uppercase tracking-widest text-[#28311F] font-semibold block mb-3">
              Editorial
            </span>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-[#28311F] transition-colors cursor-pointer">
                  About Akhyana
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-[#28311F] transition-colors cursor-pointer">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-[#28311F] transition-colors cursor-pointer">
                  Terms of Use
                </button>
              </li>
            </ul>
          </div>

          <div>
            <span className="uppercase tracking-widest text-[#28311F] font-semibold block mb-3">
              Publishing
            </span>
            <ul className="space-y-2">
              <li>
                {isLoggedIn ? (
                  <button onClick={() => onNavigate('admin')} className="text-[#2C3A22] font-semibold hover:underline flex items-center gap-1 cursor-pointer">
                    <Shield className="w-3 h-3" />
                    <span>Author Studio</span>
                  </button>
                ) : (
                  <button onClick={onOpenLogin} className="hover:text-[#28311F] transition-colors flex items-center gap-1 cursor-pointer">
                    <Shield className="w-3 h-3" />
                    <span>Author Login</span>
                  </button>
                )}
              </li>
              <li className="text-[#68715F]/80">
                English · 日本語 · Hinglish
              </li>
            </ul>
          </div>

          <div>
            <span className="uppercase tracking-widest text-[#28311F] font-semibold block mb-3">
              Contact
            </span>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="mailto:akhyanaweb@gmail.com"
                  className="hover:text-[#28311F] transition-colors flex items-center gap-1.5 group"
                  aria-label="Send email to akhyanaweb@gmail.com"
                >
                  <Mail className="w-3.5 h-3.5 text-[#B08D46] shrink-0" />
                  <span className="truncate">akhyanaweb@gmail.com</span>
                </a>
              </li>
              <li>
                <a
                  href="https://t.me/akhyana_studio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#28311F] transition-colors flex items-center gap-1.5 group"
                  aria-label="Open Telegram channel @akhyana_studio"
                >
                  <Send className="w-3.5 h-3.5 text-[#B08D46] shrink-0" />
                  <span>@akhyana_studio</span>
                </a>
              </li>
              <li className="text-[#68715F]/75 pt-1 text-[11px] leading-relaxed">
                Direct press & translation desk
              </li>
            </ul>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-[#2C3A22]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#68715F]">
        <p>© Akhyana. All original fiction, light novels and translations reserved.</p>
        <p>Aesthetic Direction: Forest Quiet Editorial</p>
      </div>
    </footer>
  );
};
