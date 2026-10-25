import {
  Novel,
  Chapter,
  Announcement,
  ReadingProgress,
  Comment,
  AdminUser,
  SiteSettings,
  AdminStats,
  NewChapterAlertData
} from '../types';

const AUTH_TOKEN_KEY = 'akhyana_auth_token';
const READER_ID_KEY = 'akhyana_reader_id';
const DISMISSED_ANNOUNCEMENTS_KEY = 'akhyana_dismissed_announcements';
const BOOKMARKS_KEY = 'akhyana_bookmarked_novels';

// Generate or retrieve persistent anonymous reader ID for reading progress & notifications
export function getReaderId(): string {
  let id = localStorage.getItem(READER_ID_KEY);
  if (!id) {
    id = 'reader_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem(READER_ID_KEY, id);
  }
  return id;
}

export function getBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleBookmark(novelSlug: string): boolean {
  const current = getBookmarks();
  const exists = current.includes(novelSlug);
  const updated = exists ? current.filter(s => s !== novelSlug) : [...current, novelSlug];
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
  return !exists;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

const DEFAULT_PROD_API = 'https://novelsite.onrender.com';
const RAW_API_URL = (import.meta.env.VITE_API_URL || '').trim();

// Smart URL resolution:
// If explicitly provided via env, use it.
// If running on Netlify or remote origin without VITE_API_URL, automatically route to the production Render backend.
function resolveApiBase(): string {
  if (RAW_API_URL) {
    return RAW_API_URL.replace(/\/+$/, '').replace(/\/api$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.endsWith('netlify.app') || host.includes('webcontainer') || host.includes('run.app')) {
      return DEFAULT_PROD_API;
    }
  }
  return '';
}

export const API_BASE_URL = resolveApiBase();

export function endpoint(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

function getHeaders(hasBody: boolean = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication
  async login(email: string, password: string): Promise<{ token: string; user: AdminUser }> {
    const res = await fetch(endpoint('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Authentication error');
    }
    const data = await res.json();
    setAuthToken(data.token);
    return data;
  },

  async verifySession(): Promise<AdminUser | null> {
    const token = getAuthToken();
    if (!token) return null;
    try {
      const res = await fetch(endpoint('/api/auth/session'), {
        headers: getHeaders()
      });
      if (!res.ok) {
        removeAuthToken();
        return null;
      }
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch(endpoint('/api/auth/logout'), {
        method: 'POST',
        headers: getHeaders()
      });
    } finally {
      removeAuthToken();
    }
  },

  // Novels
  async getNovels(): Promise<Novel[]> {
    const res = await fetch(endpoint('/api/novels'));
    if (!res.ok) throw new Error('Failed to load novels');
    return res.json();
  },

  async getNovel(slug: string): Promise<Novel> {
    const res = await fetch(endpoint(`/api/novels/${encodeURIComponent(slug)}`));
    if (!res.ok) throw new Error('Novel not found');
    return res.json();
  },

  async saveNovel(novel: Partial<Novel>, originalSlug?: string): Promise<Novel> {
    const isUpdate = Boolean(novel.id && !novel.id.startsWith('new-'));
    // If updating, route by the existing slug or id to prevent 404 when slug was edited
    const identifier = originalSlug || novel.id || novel.slug;
    const url = isUpdate ? endpoint(`/api/novels/${encodeURIComponent(identifier || '')}`) : endpoint('/api/novels');
    const method = isUpdate ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: getHeaders(true),
      body: JSON.stringify(novel)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to save novel' }));
      throw new Error(err.error || 'Failed to save novel');
    }
    return res.json();
  },

  async deleteNovel(slug: string): Promise<void> {
    const res = await fetch(endpoint(`/api/novels/${encodeURIComponent(slug)}`), {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete novel' }));
      throw new Error(err.error || 'Failed to delete novel');
    }
  },

  // Chapters
  async getChapters(novelSlug: string, includeDrafts: boolean = false): Promise<Chapter[]> {
    const url = endpoint(`/api/novels/${encodeURIComponent(novelSlug)}/chapters${includeDrafts ? '?include_drafts=true' : ''}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load chapters');
    return res.json();
  },

  async getChapter(idOrSlug: string, novelSlug?: string): Promise<Chapter> {
    const url = endpoint(`/api/chapters/${encodeURIComponent(idOrSlug)}${novelSlug ? `?novel=${encodeURIComponent(novelSlug)}` : ''}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error('Chapter not found');
    return res.json();
  },

  async saveChapter(chapter: Partial<Chapter>): Promise<Chapter> {
    const isUpdate = !!chapter.id && !chapter.id.startsWith('new-');
    const url = isUpdate ? endpoint(`/api/chapters/${encodeURIComponent(chapter.id!)}`) : endpoint('/api/chapters');
    const method = isUpdate ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: getHeaders(true),
      body: JSON.stringify(chapter)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to save chapter' }));
      throw new Error(err.error || 'Failed to save chapter');
    }
    return res.json();
  },

  async deleteChapter(id: string): Promise<void> {
    const res = await fetch(endpoint(`/api/chapters/${encodeURIComponent(id)}`), {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete chapter' }));
      throw new Error(err.error || 'Failed to delete chapter');
    }
  },

  // Reading Progress & Alerts
  async recordProgress(novelSlug: string, chapter: Chapter, percent: number = 100): Promise<void> {
    const readerId = getReaderId();
    await fetch(endpoint('/api/reading-progress'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reader_id: readerId,
        novel_slug: novelSlug,
        last_chapter_id: chapter.id,
        last_chapter_number: chapter.chapter_number,
        progress_percent: percent
      })
    }).catch(err => console.warn('Could not record progress', err));
  },

  async getReadingProgress(): Promise<ReadingProgress[]> {
    const readerId = getReaderId();
    const res = await fetch(endpoint(`/api/reading-progress?reader_id=${encodeURIComponent(readerId)}`));
    if (!res.ok) return [];
    return res.json();
  },

  async getNewChapterAlerts(): Promise<NewChapterAlertData[]> {
    const readerId = getReaderId();
    const res = await fetch(endpoint(`/api/reading-progress/alerts?reader_id=${encodeURIComponent(readerId)}`));
    if (!res.ok) return [];
    return res.json();
  },

  // Announcements
  async getAnnouncements(all: boolean = false): Promise<Announcement[]> {
    const res = await fetch(endpoint(`/api/announcements${all ? '?all=true' : ''}`));
    if (!res.ok) return [];
    return res.json();
  },

  async saveAnnouncement(ann: Partial<Announcement>): Promise<Announcement> {
    const isUpdate = !!ann.id && !ann.id.startsWith('new-');
    const url = isUpdate ? endpoint(`/api/announcements/${encodeURIComponent(ann.id!)}`) : endpoint('/api/announcements');
    const method = isUpdate ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: getHeaders(true),
      body: JSON.stringify(ann)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to save announcement' }));
      throw new Error(err.error || 'Failed to save announcement');
    }
    return res.json();
  },

  async deleteAnnouncement(id: string): Promise<void> {
    const res = await fetch(endpoint(`/api/announcements/${encodeURIComponent(id)}`), {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete announcement' }));
      throw new Error(err.error || 'Failed to delete announcement');
    }
  },

  getDismissedAnnouncements(): string[] {
    try {
      const raw = localStorage.getItem(DISMISSED_ANNOUNCEMENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  dismissAnnouncement(id: string) {
    const current = api.getDismissedAnnouncements();
    if (!current.includes(id)) {
      localStorage.setItem(DISMISSED_ANNOUNCEMENTS_KEY, JSON.stringify([...current, id]));
    }
  },

  // Comments
  async getComments(novelSlug: string): Promise<Comment[]> {
    const res = await fetch(endpoint(`/api/novels/${encodeURIComponent(novelSlug)}/comments`));
    if (!res.ok) return [];
    return res.json();
  },

  async getAllComments(): Promise<Comment[]> {
    const res = await fetch(endpoint('/api/admin/comments'), { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async postComment(novelSlug: string, author_name: string, content: string): Promise<Comment> {
    const res = await fetch(endpoint(`/api/novels/${encodeURIComponent(novelSlug)}/comments`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author_name, content })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to post comment' }));
      throw new Error(err.error || 'Failed to submit discussion comment');
    }
    return res.json();
  },

  async updateCommentStatus(id: string, status: 'approved' | 'hidden'): Promise<void> {
    const res = await fetch(endpoint(`/api/comments/${encodeURIComponent(id)}/status`), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update comment');
  },

  async deleteComment(id: string): Promise<void> {
    const res = await fetch(endpoint(`/api/comments/${encodeURIComponent(id)}`), {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete comment' }));
      throw new Error(err.error || 'Failed to delete comment');
    }
  },

  // Site Settings
  async getSettings(): Promise<SiteSettings> {
    const res = await fetch(endpoint('/api/site-settings'));
    if (!res.ok) throw new Error('Failed to load site settings');
    return res.json();
  },

  async updateSettings(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    const res = await fetch(endpoint('/api/site-settings'), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to save settings');
    return res.json();
  },

  // Admin stats & users
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(endpoint('/api/admin/stats'), { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to load stats');
    return res.json();
  },

  async getAdminUsers(): Promise<AdminUser[]> {
    const res = await fetch(endpoint('/api/admin/users'), { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async createAdminUser(userData: { email: string; name: string; role: string; password: string }): Promise<AdminUser> {
    const res = await fetch(endpoint('/api/admin/users'), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(userData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create user' }));
      throw new Error(err.error || 'Failed to create admin');
    }
    return res.json();
  },

  async deleteAdminUser(id: string): Promise<void> {
    const res = await fetch(endpoint(`/api/admin/users/${encodeURIComponent(id)}`), {
      method: 'DELETE',
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete staff member' }));
      throw new Error(err.error || 'Failed to delete staff member');
    }
  },

  // Cover image upload
  async uploadCover(file: File): Promise<{ url: string; filename: string; size: number }> {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('Unsupported image format. Please select a JPEG, PNG, or WebP file.');
    }
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error('Image size exceeds 5MB limit. Please choose a smaller image.');
    }

    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file from device'));
      reader.readAsDataURL(file);
    });

    const res = await fetch(endpoint('/api/upload/cover'), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({
        data: base64Data,
        filename: file.name
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Failed to upload cover image');
    }

    return res.json();
  }
};

