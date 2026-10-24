import React, { useState, useEffect } from 'react';
import { Bookmark, BookOpen, Clock, Globe, ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { Novel, Chapter, Comment, LanguageCode, ReadingProgress } from '../types';
import { api } from '../services/api';
import { UI_TRANSLATIONS } from '../utils/translations';

interface NovelDetailsProps {
  novel: Novel;
  chapters: Chapter[];
  interfaceLanguage: LanguageCode;
  readingProgress?: ReadingProgress;
  isBookmarked: boolean;
  onToggleBookmark: (slug: string) => void;
  onReadChapter: (novelSlug: string, chapterSlug: string) => void;
  onBack: () => void;
}

export const NovelDetails: React.FC<NovelDetailsProps> = ({
  novel,
  chapters,
  interfaceLanguage,
  readingProgress,
  isBookmarked,
  onToggleBookmark,
  onReadChapter,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'chapters' | 'discussion'>('chapters');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [imageError, setImageError] = useState(false);

  const t = UI_TRANSLATIONS[interfaceLanguage] || UI_TRANSLATIONS.en;

  // Localized text
  const localized = novel.translations?.[interfaceLanguage];
  const title = localized?.title || novel.title;
  const synopsis = localized?.synopsis || novel.synopsis;

  useEffect(() => {
    loadComments();
  }, [novel.slug]);

  const loadComments = async () => {
    try {
      setLoadingComments(true);
      const data = await api.getComments(novel.slug);
      setComments(data);
    } catch (err) {
      console.warn('Failed to fetch comments', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    setCommentSuccess(false);

    if (!authorName.trim() || !commentText.trim()) {
      setCommentError('Please provide both your name and comment.');
      return;
    }

    try {
      setSubmittingComment(true);
      const newComment = await api.postComment(novel.slug, authorName.trim(), commentText.trim());
      setComments(prev => [newComment, ...prev]);
      setCommentText('');
      setCommentSuccess(true);
      setTimeout(() => setCommentSuccess(false), 4000);
    } catch (err: any) {
      setCommentError(err.message || 'Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const filteredChapters = chapters.filter(c =>
    c.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.chapter_number.toString().includes(searchFilter)
  );

  const firstChapter = chapters[0];
  const continueChapter = readingProgress
    ? chapters.find(c => c.id === readingProgress.last_chapter_id || c.chapter_number === readingProgress.last_chapter_number) || firstChapter
    : null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* Return Navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs font-serif uppercase tracking-wider text-[#68715F] hover:text-[#28311F] mb-8 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Catalog</span>
      </button>

      {/* Novel Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start mb-12">
        {/* Cover Artwork */}
        <div className="md:col-span-4 flex flex-col items-center">
          <div className="relative aspect-[3/4] w-full max-w-sm rounded-2xl overflow-hidden glass-panel p-2 shadow-lg border border-white/80">
            {!imageError && novel.cover_url ? (
              <img
                src={novel.cover_url}
                alt={title}
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full rounded-xl flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-[#DDE5D2] to-[#EEF0E4]">
                <BookOpen className="w-10 h-10 text-[#2C3A22]/50 mb-3" />
                <p className="font-serif text-lg font-medium text-[#28311F]">{title}</p>
                <p className="text-xs text-[#68715F] mt-1 font-serif">{novel.author}</p>
              </div>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="w-full max-w-sm mt-4 flex gap-3">
            <button
              onClick={() => onToggleBookmark(novel.slug)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-serif uppercase tracking-wider border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                isBookmarked
                  ? 'bg-[#2C3A22] text-[#EEF0E4] border-[#2C3A22]'
                  : 'bg-white/60 hover:bg-white text-[#28311F] border-[#2C3A22]/15'
              }`}
            >
              <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
              <span>{isBookmarked ? t.savedToLibrary : t.saveToLibrary}</span>
            </button>
          </div>
        </div>

        {/* Novel Details & Meta */}
        <div className="md:col-span-8 flex flex-col">
          {/* Metadata Row (Zero-Pill discipline) */}
          <div className="flex items-center gap-2 text-xs font-serif text-[#68715F] mb-3 flex-wrap">
            <span>{novel.genres.join(' / ')}</span>
            <span aria-hidden="true">·</span>
            <span className="capitalize">{novel.status}</span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3" />
              Translations: {novel.available_languages.map(l => l.toUpperCase()).join(', ')}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl font-serif font-medium text-[#28311F] leading-tight mb-3">
            {title}
          </h1>

          {/* Author */}
          <p className="text-sm font-serif text-[#68715F] mb-6">
            Written by <span className="text-[#28311F] font-medium">{novel.author}</span>
          </p>

          {/* Primary Reading CTAs */}
          <div className="flex flex-wrap items-center gap-4 mb-8">
            {continueChapter ? (
              <button
                onClick={() => onReadChapter(novel.slug, continueChapter.slug)}
                className="px-6 py-3 bg-[#2C3A22] text-[#EEF0E4] hover:bg-[#1D2716] rounded-xl text-xs font-serif uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>Continue: Chapter {continueChapter.chapter_number}</span>
              </button>
            ) : firstChapter ? (
              <button
                onClick={() => onReadChapter(novel.slug, firstChapter.slug)}
                className="px-6 py-3 bg-[#2C3A22] text-[#EEF0E4] hover:bg-[#1D2716] rounded-xl text-xs font-serif uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>Start Reading (Ch. 1)</span>
              </button>
            ) : (
              <span className="text-xs font-serif text-[#68715F]">No chapters published yet.</span>
            )}

            {chapters.length > 0 && continueChapter && firstChapter && continueChapter.id !== firstChapter.id && (
              <button
                onClick={() => onReadChapter(novel.slug, firstChapter.slug)}
                className="px-5 py-3 bg-white/60 hover:bg-white text-[#28311F] border border-[#2C3A22]/15 rounded-xl text-xs font-serif uppercase tracking-wider transition-colors cursor-pointer"
              >
                Restart from Chapter 1
              </button>
            )}
          </div>

          {/* Synopsis */}
          <div className="glass-panel rounded-2xl p-6 border border-white/80">
            <h2 className="text-xs uppercase tracking-widest font-serif text-[#68715F] mb-3">
              Synopsis
            </h2>
            <p className="font-serif text-[#28311F] text-base leading-relaxed whitespace-pre-line">
              {synopsis}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs: Chapters vs Discussion */}
      <div className="border-b border-[#2C3A22]/15 mb-8 flex gap-8">
        <button
          onClick={() => setActiveTab('chapters')}
          className={`pb-3 text-sm font-serif tracking-wider transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
            activeTab === 'chapters'
              ? 'border-[#2C3A22] text-[#28311F] font-semibold'
              : 'border-transparent text-[#68715F] hover:text-[#28311F]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Chapter Archive ({chapters.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('discussion')}
          className={`pb-3 text-sm font-serif tracking-wider transition-colors cursor-pointer border-b-2 flex items-center gap-2 ${
            activeTab === 'discussion'
              ? 'border-[#2C3A22] text-[#28311F] font-semibold'
              : 'border-transparent text-[#68715F] hover:text-[#28311F]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Discussion ({comments.length})</span>
        </button>
      </div>

      {/* Tab Content: Chapters */}
      {activeTab === 'chapters' && (
        <div>
          {/* Search Chapters */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <input
              type="text"
              placeholder="Filter chapters by title or number..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl glass-panel text-sm font-serif text-[#28311F] placeholder-[#68715F]/70 border border-[#2C3A22]/15 focus:outline-none focus:ring-1 focus:ring-[#2C3A22] w-full max-w-md"
            />
          </div>

          {filteredChapters.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-sm font-serif text-[#68715F]">
              No chapters match your filter.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredChapters.map((ch) => {
                const isCurrentRead = readingProgress?.last_chapter_id === ch.id;
                return (
                  <div
                    key={ch.id}
                    onClick={() => onReadChapter(novel.slug, ch.slug)}
                    className="group glass-panel rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-white/80 transition-all cursor-pointer border border-white/70"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <span className="font-serif text-sm font-medium text-[#B08D46] tabular-nums shrink-0">
                        {ch.chapter_number < 10 ? `0${ch.chapter_number}` : ch.chapter_number}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-serif text-base font-medium text-[#28311F] truncate group-hover:text-[#2C3A22]">
                          {ch.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-serif text-[#68715F] mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{ch.published_at ? new Date(ch.published_at).toLocaleDateString() : 'Published'}</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{ch.word_count} words</span>
                          {isCurrentRead && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#2C3A22] font-medium">Currently Reading</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReadChapter(novel.slug, ch.slug);
                      }}
                      className="px-3.5 py-1.5 text-xs font-serif text-[#28311F] group-hover:text-[#EEF0E4] group-hover:bg-[#2C3A22] rounded-lg transition-colors border border-[#2C3A22]/15 whitespace-nowrap"
                    >
                      Read Chapter
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Discussion */}
      {activeTab === 'discussion' && (
        <div className="max-w-3xl">
          {/* Submission Form */}
          <form onSubmit={handleCommentSubmit} className="glass-panel rounded-2xl p-6 border border-white/80 mb-8">
            <h3 className="font-serif text-base font-medium text-[#28311F] mb-4">
              Join the Literary Conversation
            </h3>

            {commentError && (
              <div className="mb-4 p-3 rounded-lg bg-red-100/80 border border-red-200 text-xs font-serif text-red-800">
                {commentError}
              </div>
            )}

            {commentSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-[#DDE5D2] border border-[#2C3A22]/20 text-xs font-serif text-[#2C3A22]">
                Your comment has been submitted and posted to the discussion!
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs font-serif text-[#68715F] uppercase tracking-wider mb-1">
                Your Name or Pseudonym
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="e.g. Scholar of Vael-Thorn"
                className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-sm font-serif text-[#28311F] focus:outline-none focus:ring-1 focus:ring-[#2C3A22]"
                maxLength={60}
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-serif text-[#68715F] uppercase tracking-wider mb-1">
                Comment
              </label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={3}
                placeholder="Share your thoughts on the world, lore, or prose..."
                className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-sm font-serif text-[#28311F] focus:outline-none focus:ring-1 focus:ring-[#2C3A22]"
                maxLength={1500}
              />
            </div>

            <button
              type="submit"
              disabled={submittingComment}
              className="px-5 py-2.5 bg-[#2C3A22] text-[#EEF0E4] hover:bg-[#1D2716] disabled:opacity-50 rounded-xl text-xs font-serif uppercase tracking-wider transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submittingComment ? 'Submitting...' : 'Post Comment'}</span>
            </button>
          </form>

          {/* Comment List */}
          {loadingComments ? (
            <div className="text-center py-8 text-sm font-serif text-[#68715F]">
              Loading discussion...
            </div>
          ) : comments.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center text-sm font-serif text-[#68715F]">
              Be the first to share an observation about this story.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {comments.map((c) => (
                <div key={c.id} className="glass-panel rounded-xl p-5 border border-white/70">
                  <div className="flex items-center justify-between text-xs font-serif text-[#68715F] mb-2">
                    <span className="font-medium text-[#28311F]">{c.author_name}</span>
                    <span>{new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="font-serif text-sm text-[#28311F] leading-relaxed whitespace-pre-line">
                    {c.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
