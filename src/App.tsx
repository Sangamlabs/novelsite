import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { Hero } from './components/Hero';
import { ReadingProgressCards } from './components/ReadingProgressCards';
import { NovelCard } from './components/NovelCard';
import { NovelDetails } from './components/NovelDetails';
import { ChapterReader } from './components/ChapterReader';
import { ChapterArchive } from './components/ChapterArchive';
import { AnnouncementModal } from './components/AnnouncementModal';
import { NewChapterAlert } from './components/NewChapterAlert';
import { AdminStudio } from './components/AdminStudio';
import { AuthorLoginView } from './components/AuthorLoginView';
import { LoginModal } from './components/LoginModal';
import { LibraryModal } from './components/LibraryModal';
import { AboutView } from './components/AboutView';
import { PolicyView } from './components/PolicyView';
import { Footer } from './components/Footer';
import {
  Novel,
  Chapter,
  ReadingProgress,
  Announcement,
  AdminUser,
  SiteSettings,
  LanguageCode,
  NewChapterAlertData
} from './types';
import { api, getBookmarks, toggleBookmark } from './services/api';
import { Search } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedNovelSlug, setSelectedNovelSlug] = useState<string | null>(null);
  const [selectedChapterSlug, setSelectedChapterSlug] = useState<string | null>(null);
  const [interfaceLanguage, setInterfaceLanguage] = useState<LanguageCode>('en');
  const [contentLanguage, setContentLanguage] = useState<LanguageCode>('en');

  const [novels, setNovels] = useState<Novel[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [readingHistory, setReadingHistory] = useState<ReadingProgress[]>([]);
  const [savedNovelSlugs, setSavedNovelSlugs] = useState<string[]>([]);
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);
  const [newChapterAlerts, setNewChapterAlerts] = useState<NewChapterAlertData[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);

  const [genreFilter, setGenreFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      setSavedNovelSlugs(getBookmarks());

      // Check active user session
      const user = await api.verifySession();
      setCurrentUser(user);

      // Load novels & chapters
      const [novelList, sett] = await Promise.all([
        api.getNovels(),
        api.getSettings().catch(() => null)
      ]);
      setNovels(novelList);
      if (sett) setSettings(sett);

      // Load all published chapters
      const allCh = await api.getChapters('', false).catch(() => []);
      setChapters(allCh);

      // Load reading progress & alerts
      const prog = await api.getReadingProgress();
      setReadingHistory(prog);

      const alerts = await api.getNewChapterAlerts();
      setNewChapterAlerts(alerts);

      // Load active announcement that hasn't been dismissed
      const announcements = await api.getAnnouncements(false);
      const dismissed = api.getDismissedAnnouncements();
      const firstValid = announcements.find(a => !dismissed.includes(a.id));
      if (firstValid) {
        setActiveAnnouncement(firstValid);
      }
    } catch (err) {
      console.error('Failed to load Akhyana platform data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Bookmark toggle
  const handleToggleBookmark = (slug: string) => {
    toggleBookmark(slug);
    setSavedNovelSlugs(getBookmarks());
  };

  // Announcement dismissal
  const handleDismissAnnouncement = (id: string) => {
    api.dismissAnnouncement(id);
    setActiveAnnouncement(null);
  };

  // Chapter Alert dismissal
  const handleDismissAlert = () => {
    setNewChapterAlerts([]);
  };

  // Check URL hash routing for direct access like #login, #admin, #novel/:slug, #reader/:novelSlug/:chapterSlug
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').trim();
      if (!hash) return;

      const lower = hash.toLowerCase();
      if (lower === 'login' || lower === 'admin') {
        setCurrentView(currentUser ? 'admin' : 'login');
      } else if (lower.startsWith('novel/')) {
        const slug = hash.substring(6).trim();
        if (slug) {
          setSelectedNovelSlug(decodeURIComponent(slug));
          setCurrentView('novel');
        }
      } else if (lower.startsWith('reader/')) {
        const parts = hash.substring(7).split('/');
        if (parts[0] && parts[1]) {
          setSelectedNovelSlug(decodeURIComponent(parts[0]));
          setSelectedChapterSlug(decodeURIComponent(parts[1]));
          setCurrentView('reader');
        }
      } else if (['explore', 'about', 'latest', 'privacy', 'terms'].includes(lower)) {
        setCurrentView(lower);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [currentUser]);

  // Navigation handlers
  const handleNavigate = (view: string, param?: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'login' || view === 'admin') {
      window.location.hash = currentUser ? 'admin' : 'login';
      setCurrentView(currentUser ? 'admin' : 'login');
      return;
    }
    if (view === 'home') {
      window.location.hash = '';
      setSelectedNovelSlug(null);
      setSelectedChapterSlug(null);
    } else if (['explore', 'about', 'latest', 'privacy', 'terms'].includes(view)) {
      window.location.hash = view;
    }
    setCurrentView(view);
    if (view === 'novel' && param) {
      setSelectedNovelSlug(param);
      window.location.hash = `novel/${param}`;
    } else if (view === 'genres') {
      const el = document.getElementById('discovery');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenNovel = (slug: string) => {
    setSelectedNovelSlug(slug);
    setCurrentView('novel');
    window.location.hash = `novel/${slug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenChapter = (novelSlug: string, chapterSlug: string) => {
    setSelectedNovelSlug(novelSlug);
    setSelectedChapterSlug(chapterSlug);
    setCurrentView('reader');
    window.location.hash = `reader/${novelSlug}/${chapterSlug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Login success
  const handleLoginSuccess = (user: AdminUser) => {
    setCurrentUser(user);
    setShowLoginModal(false);
    setCurrentView('admin');
    window.location.hash = 'admin';
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setCurrentView('home');
    window.location.hash = '';
  };

  // Dynamic fetch if selectedNovelSlug is not found in memory (e.g. freshly created or direct deep link)
  useEffect(() => {
    if (selectedNovelSlug && !novels.some(n => n.slug.toLowerCase() === selectedNovelSlug.toLowerCase() || n.id === selectedNovelSlug)) {
      api.getNovel(selectedNovelSlug)
        .then(fetchedNovel => {
          setNovels(prev => [fetchedNovel, ...prev.filter(n => n.id !== fetchedNovel.id && n.slug !== fetchedNovel.slug)]);
        })
        .catch(err => {
          console.warn('Novel lookup fallback error:', err);
        });
    }
  }, [selectedNovelSlug, novels]);

  // Extracted current novel & chapter for details & reader views
  const currentNovel = selectedNovelSlug
    ? (novels.find(n => n.slug.toLowerCase() === selectedNovelSlug.toLowerCase() || n.id === selectedNovelSlug) || null)
    : (currentView === 'novel' || currentView === 'reader' ? null : (novels[0] || null));
  const novelChapters = chapters.filter(c => c.novel_slug === currentNovel?.slug && c.status === 'published');
  const currentChapter = novelChapters.find(c => c.slug === selectedChapterSlug || c.id === selectedChapterSlug) || novelChapters[0];

  const featuredNovel = novels.find(n => n.slug === settings?.featured_novel_slug) || novels.find(n => n.is_featured) || novels[0];
  const latestPublishedChapter = chapters.length > 0 ? chapters[chapters.length - 1] : null;

  // Filtered novels for discovery section
  const genresList = ['All', 'Botanical Fantasy', 'Literary Fiction', 'Mystery', 'Slice of Life', 'High Fantasy'];
  const filteredNovels = novels.filter(n => {
    const matchesGenre = genreFilter === 'All' || n.genres.includes(genreFilter);
    const matchesSearch = !searchQuery.trim() ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.synopsis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesGenre && matchesSearch;
  });

  const savedNovels = novels.filter(n => savedNovelSlugs.includes(n.slug));

  return (
    <div className="min-h-screen flex flex-col bg-[#EEF0E4] text-[#28311F] selection:bg-[#DDE5D2] selection:text-[#28311F]">
      
      {/* Active Announcement Modal Popup */}
      {activeAnnouncement && (
        <AnnouncementModal
          announcement={activeAnnouncement}
          onDismiss={handleDismissAnnouncement}
          onActionClick={(url) => {
            if (url.startsWith('/novel/') && url.includes('/chapter/')) {
              const parts = url.split('/');
              handleOpenChapter(parts[2], parts[4]);
            } else if (url.startsWith('#')) {
              handleNavigate('explore');
            }
          }}
        />
      )}

      {/* New Chapter Notification Toast for returning readers */}
      <NewChapterAlert
        alerts={newChapterAlerts}
        onDismiss={handleDismissAlert}
        onReadChapter={handleOpenChapter}
      />

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onSuccess={handleLoginSuccess}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* Library Modal */}
      {showLibraryModal && (
        <LibraryModal
          savedNovels={savedNovels}
          onClose={() => setShowLibraryModal(false)}
          onOpenNovel={handleOpenNovel}
          onRemoveBookmark={handleToggleBookmark}
          onExplore={() => handleNavigate('explore')}
        />
      )}

      {/* Top Floating Navigation */}
      {currentView !== 'reader' && currentView !== 'admin' && (
        <Navigation
          currentView={currentView}
          onNavigate={handleNavigate}
          interfaceLanguage={interfaceLanguage}
          onLanguageChange={setInterfaceLanguage}
          savedNovelCount={savedNovelSlugs.length}
          isLoggedIn={!!currentUser}
          onOpenLibrary={() => setShowLibraryModal(true)}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1">
        
        {/* ================= VIEW: CHAPTER READER ================= */}
        {currentView === 'reader' && (
          currentNovel && currentChapter ? (
            <ChapterReader
              novel={currentNovel}
              chapter={currentChapter}
              allChapters={novelChapters}
              contentLanguage={contentLanguage}
              onLanguageChange={setContentLanguage}
              onSelectChapter={handleOpenChapter}
              onReturnToNovel={handleOpenNovel}
            />
          ) : loading ? (
            <div className="min-h-[50vh] flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#2C3A22] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-serif text-[#68715F]">Opening manuscript...</p>
            </div>
          ) : (
            <div className="min-h-[50vh] flex flex-col items-center justify-center py-20 px-4 text-center">
              <h2 className="text-2xl font-serif text-[#28311F] mb-2">Chapter Not Found</h2>
              <p className="text-sm text-[#68715F] font-serif max-w-md mb-6">
                This chapter draft has not been published or does not exist.
              </p>
              <button
                onClick={() => handleNavigate('home')}
                className="px-5 py-2.5 bg-[#2C3A22] text-[#EEF0E4] rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer"
              >
                Return to Library
              </button>
            </div>
          )
        )}

        {/* ================= VIEW: AUTHOR LOGIN ================= */}
        {currentView === 'login' && (
          <AuthorLoginView
            onSuccess={handleLoginSuccess}
            onReturnToSite={() => handleNavigate('home')}
          />
        )}

        {/* ================= VIEW: ADMIN STUDIO ================= */}
        {currentView === 'admin' && (
          currentUser ? (
            <AdminStudio
              currentUser={currentUser}
              onLogout={handleLogout}
              onReturnToSite={() => handleNavigate('home')}
              onDataChanged={loadInitialData}
              onNovelSaved={(saved) => {
                setNovels(prev => [saved, ...prev.filter(n => n.id !== saved.id && n.slug !== saved.slug)]);
                setSelectedNovelSlug(saved.slug);
              }}
              onOpenNovel={handleOpenNovel}
              onOpenChapter={handleOpenChapter}
            />
          ) : (
            <AuthorLoginView
              onSuccess={handleLoginSuccess}
              onReturnToSite={() => handleNavigate('home')}
            />
          )
        )}

        {/* ================= VIEW: NOVEL DETAILS ================= */}
        {currentView === 'novel' && (
          currentNovel ? (
            <NovelDetails
              novel={currentNovel}
              chapters={novelChapters}
              interfaceLanguage={interfaceLanguage}
              readingProgress={readingHistory.find(r => r.novel_slug === currentNovel.slug)}
              isBookmarked={savedNovelSlugs.includes(currentNovel.slug)}
              onToggleBookmark={handleToggleBookmark}
              onReadChapter={handleOpenChapter}
              onBack={() => handleNavigate('home')}
            />
          ) : loading ? (
            <div className="min-h-[50vh] flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#2C3A22] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-serif text-[#68715F]">Gathering manuscript details...</p>
            </div>
          ) : (
            <div className="min-h-[50vh] flex flex-col items-center justify-center py-20 px-4 text-center">
              <h2 className="text-2xl font-serif text-[#28311F] mb-2">Novel Not Found</h2>
              <p className="text-sm text-[#68715F] font-serif max-w-md mb-6">
                The requested novel could not be located in the current library.
              </p>
              <button
                onClick={() => handleNavigate('home')}
                className="px-5 py-2.5 bg-[#2C3A22] text-[#EEF0E4] rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer"
              >
                Return to Library
              </button>
            </div>
          )
        )}

        {/* ================= VIEW: CHAPTER ARCHIVE ================= */}
        {currentView === 'latest' && (
          <ChapterArchive
            novels={novels}
            chapters={chapters}
            onOpenChapter={handleOpenChapter}
            onOpenNovel={handleOpenNovel}
            onBack={() => setCurrentView('home')}
          />
        )}

        {/* ================= VIEW: ABOUT ================= */}
        {currentView === 'about' && (
          <AboutView
            onBack={() => setCurrentView('home')}
            onExplore={() => handleNavigate('explore')}
          />
        )}

        {/* ================= VIEW: PRIVACY & TERMS ================= */}
        {(currentView === 'privacy' || currentView === 'terms') && (
          <PolicyView
            type={currentView as 'privacy' | 'terms'}
            onBack={() => setCurrentView('home')}
          />
        )}

        {/* ================= VIEW: HOMEPAGE & EXPLORE ================= */}
        {(currentView === 'home' || currentView === 'explore' || currentView === 'genres') && (
          <div>
            {/* Near-Full-Screen Hero */}
            <Hero
              onExplore={() => {
                const el = document.getElementById('discovery');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onContinueReading={() => {
                if (readingHistory.length > 0) {
                  const first = readingHistory[0];
                  handleOpenChapter(first.novel_slug, first.last_chapter_id);
                } else if (latestPublishedChapter) {
                  handleOpenChapter(latestPublishedChapter.novel_slug, latestPublishedChapter.slug);
                }
              }}
              hasReadingHistory={readingHistory.length > 0}
              featuredNovel={featuredNovel}
              interfaceLanguage={interfaceLanguage}
            />

            {/* Reading Progress Cards (Continue Reading, Recently Updated, Your Library) */}
            <ReadingProgressCards
              readingHistory={readingHistory}
              novels={novels}
              latestChapter={latestPublishedChapter}
              savedNovelSlugs={savedNovelSlugs}
              onOpenChapter={handleOpenChapter}
              onOpenNovel={handleOpenNovel}
              onExplore={() => {
                const el = document.getElementById('discovery');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenLibrary={() => setShowLibraryModal(true)}
            />

            {/* Novel Discovery Section */}
            <section id="discovery" className="max-w-7xl mx-auto px-6 py-16">
              
              {/* Section Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-[#2C3A22]/15">
                <div>
                  <span className="text-xs font-serif uppercase tracking-widest text-[#B08D46] block mb-1">
                    Editorial Catalog
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-serif font-medium text-[#28311F]">
                    Find your next world.
                  </h2>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#68715F]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search titles, authors, lore..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-xs font-serif text-[#28311F] placeholder-[#68715F]/70 focus:outline-none focus:ring-1 focus:ring-[#2C3A22]"
                  />
                </div>
              </div>

              {/* Genre Filter Tabs (Functional segmented buttons) */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8">
                {genresList.map(g => (
                  <button
                    key={g}
                    onClick={() => setGenreFilter(g)}
                    className={`px-4 py-2 rounded-xl text-xs font-serif transition-colors whitespace-nowrap cursor-pointer ${
                      genreFilter === g
                        ? 'bg-[#2C3A22] text-[#EEF0E4] shadow-xs'
                        : 'bg-white/50 text-[#68715F] hover:bg-white hover:text-[#28311F]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>

              {/* Novels Grid */}
              {filteredNovels.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center text-sm font-serif text-[#68715F]">
                  No novels match the current filter or search criteria.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredNovels.map(novel => (
                    <NovelCard
                      key={novel.id}
                      novel={novel}
                      interfaceLanguage={interfaceLanguage}
                      isBookmarked={savedNovelSlugs.includes(novel.slug)}
                      onToggleBookmark={handleToggleBookmark}
                      onSelect={handleOpenNovel}
                      onRead={(slug) => {
                        const chaptersForNovel = chapters.filter(c => c.novel_slug === slug && c.status === 'published');
                        if (chaptersForNovel.length > 0) {
                          handleOpenChapter(slug, chaptersForNovel[0].slug);
                        } else {
                          handleOpenNovel(slug);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

      </main>

      {/* Global Literary Footer */}
      {currentView !== 'reader' && currentView !== 'admin' && (
        <Footer
          onNavigate={handleNavigate}
          isLoggedIn={!!currentUser}
          onOpenLogin={() => handleNavigate('login')}
        />
      )}
    </div>
  );
}
