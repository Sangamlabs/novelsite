export type LanguageCode = 'en' | 'jp' | 'hi';

export interface NovelTranslation {
  title: string;
  synopsis: string;
}

export interface Novel {
  id: string;
  slug: string;
  title: string;
  synopsis: string;
  author: string;
  cover_url: string;
  genres: string[];
  status: 'ongoing' | 'completed' | 'hiatus';
  available_languages: LanguageCode[];
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  translations?: Record<string, NovelTranslation>;
}

export interface ChapterTranslation {
  title: string;
  body: string;
}

export interface Chapter {
  id: string;
  novel_id: string;
  novel_slug: string;
  chapter_number: number;
  order_index: number;
  title: string;
  slug: string;
  body: string;
  language: LanguageCode;
  status: 'published' | 'draft';
  cover_url?: string | null;
  published_at: string | null;
  created_at: string;
  word_count: number;
  translations?: Record<string, ChapterTranslation>;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'general' | 'chapter_release' | 'novel_release' | 'update';
  action_label?: string | null;
  action_url?: string | null;
  image_url?: string | null;
  status: 'published' | 'draft';
  created_at: string;
  expires_at?: string | null;
}

export interface ReadingProgress {
  reader_id: string;
  novel_id: string;
  novel_slug: string;
  last_chapter_id: string;
  last_chapter_number: number;
  last_read_at: string;
  progress_percent: number;
}

export interface Comment {
  id: string;
  novel_id: string;
  novel_slug: string;
  chapter_slug?: string;
  author_name: string;
  content: string;
  status: 'approved' | 'pending' | 'hidden';
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'moderator';
  created_at: string;
}

export interface SiteSettings {
  site_name: string;
  tagline: string;
  featured_novel_slug: string;
  accent_color: string;
  footer_text: string;
  allow_comments: boolean;
  announcement_popup_enabled: boolean;
}

export interface AdminStats {
  novel_count: number;
  chapter_count: number;
  published_chapter_count: number;
  draft_chapter_count: number;
  comment_count: number;
  pending_comments: number;
  total_words: number;
}

export interface NewChapterAlertData {
  novel: Novel;
  latestChapter: Chapter;
  lastReadChapterNumber: number;
}
