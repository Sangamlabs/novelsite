import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FileText,
  MessageSquare,
  Bell,
  Settings,
  Users,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  Eye,
  ArrowLeft,
  Image as ImageIcon,
  Shield,
  Save
} from 'lucide-react';
import {
  Novel,
  Chapter,
  Announcement,
  Comment,
  AdminUser,
  SiteSettings,
  AdminStats,
  LanguageCode
} from '../types';
import { api } from '../services/api';
import { CoverUploader } from './CoverUploader';

interface AdminStudioProps {
  currentUser: AdminUser | null;
  onLogout: () => void;
  onReturnToSite: () => void;
  onDataChanged?: () => void;
  onNovelSaved?: (novel: Novel) => void;
  onOpenNovel?: (slug: string) => void;
  onOpenChapter?: (novelSlug: string, chapterSlug: string) => void;
}

interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  isDestructive?: boolean;
  isProcessing: boolean;
  onConfirm: () => Promise<void>;
}

type AdminTab = 'dashboard' | 'novels' | 'chapters' | 'media' | 'discussions' | 'announcements' | 'admins' | 'settings';

export const AdminStudio: React.FC<AdminStudioProps> = ({
  currentUser,
  onLogout,
  onReturnToSite,
  onDataChanged,
  onNovelSaved,
  onOpenNovel,
  onOpenChapter
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [novels, setNovels] = useState<Novel[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string; actionLabel?: string; onAction?: () => void } | null>(null);

  // In-app confirmation dialog state (replaces window.confirm)
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  // Novel Form State
  const [editingNovel, setEditingNovel] = useState<Partial<Novel> | null>(null);
  const [originalNovelSlug, setOriginalNovelSlug] = useState<string | null>(null);
  const [isSavingNovel, setIsSavingNovel] = useState(false);

  // Chapter Form State
  const [editingChapter, setEditingChapter] = useState<Partial<Chapter> | null>(null);
  const [isSavingChapter, setIsSavingChapter] = useState(false);

  // Announcement Form State
  const [editingAnnouncement, setEditingAnnouncement] = useState<Partial<Announcement> | null>(null);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  // Admin creation state
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'admin' | 'editor' | 'moderator'>('editor');
  const [newAdminPassword, setNewAdminPassword] = useState('');


  // Curated cover library for instant selection
  const curatedCovers = [
    { label: 'The Whispering Canopy', url: '/src/assets/images/novel_cover_whispering_canopy_1792815709554.jpg' },
    { label: 'Blade of the Jade Lotus', url: '/src/assets/images/novel_cover_jade_lotus_1792815711079.jpg' },
    { label: 'Apothecary of the Forgotten Ward', url: '/src/assets/images/novel_cover_tokyo_apothecary_1792815712119.jpg' },
    { label: 'Monsoon Memories', url: '/src/assets/images/novel_cover_monsoon_rain_1792815711515.jpg' }
  ];

  useEffect(() => {
    loadAllData();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string, actionLabel?: string, onAction?: () => void) => {
    setNotification({ type, message, actionLabel, onAction });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [s, n, c, cm, a, st] = await Promise.all([
        api.getAdminStats().catch(() => null),
        api.getNovels(),
        // Get all chapters including drafts
        api.getChapters('', true).catch(() => []),
        api.getAllComments().catch(() => []),
        api.getAnnouncements(true).catch(() => []),
        api.getSettings().catch(() => null)
      ]);
      setStats(s);
      setNovels(n);
      setChapters(c);
      setComments(cm);
      setAnnouncements(a);
      setSettings(st);

      if (currentUser?.role === 'owner') {
        const u = await api.getAdminUsers().catch(() => []);
        setAdmins(u);
      }
    } catch (err: any) {
      showNotification('error', 'Failed to load studio data');
    } finally {
      setLoading(false);
    }
  };

  /* ================= Novel Actions ================= */
  const handleSaveNovel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNovel?.title?.trim() || !editingNovel?.slug?.trim()) {
      showNotification('error', 'Title and unique slug are required');
      return;
    }
    try {
      setIsSavingNovel(true);
      const saved = await api.saveNovel(editingNovel, originalNovelSlug || undefined);
      showNotification(
        'success',
        `Novel "${saved.title}" saved successfully!`,
        'View Novel ↗',
        () => onOpenNovel && onOpenNovel(saved.slug)
      );
      setEditingNovel(null);
      setOriginalNovelSlug(null);
      await loadAllData();
      if (onNovelSaved) onNovelSaved(saved);
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save novel');
    } finally {
      setIsSavingNovel(false);
    }
  };

  const confirmDeleteNovel = (novel: Novel) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Novel Serial',
      message: `Are you certain you wish to permanently delete "${novel.title}"? All associated chapters, discussion comments, and reader history will be permanently deleted. This cannot be undone.`,
      confirmText: 'Delete Permanently',
      isDestructive: true,
      isProcessing: false,
      onConfirm: async () => {
        setConfirmModal(prev => prev ? { ...prev, isProcessing: true } : null);
        try {
          await api.deleteNovel(novel.slug);
          showNotification('success', `"${novel.title}" and its chapters were successfully deleted`);
          setConfirmModal(null);
          await loadAllData();
          if (onDataChanged) onDataChanged();
        } catch (err: any) {
          showNotification('error', err.message || 'Failed to delete novel');
          setConfirmModal(null);
        }
      }
    });
  };

  /* ================= Chapter Actions ================= */
  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChapter?.novel_slug || !editingChapter?.title || editingChapter?.chapter_number === undefined) {
      showNotification('error', 'Novel, chapter title, and number are required');
      return;
    }
    try {
      setIsSavingChapter(true);
      const saved = await api.saveChapter(editingChapter);
      showNotification(
        'success',
        `Chapter ${saved.chapter_number} saved successfully!`,
        'Read Chapter ↗',
        () => onOpenChapter && onOpenChapter(saved.novel_slug, saved.slug)
      );
      setEditingChapter(null);
      await loadAllData();
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save chapter');
    } finally {
      setIsSavingChapter(false);
    }
  };

  const confirmDeleteChapter = (ch: Chapter) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Chapter Manuscript',
      message: `Are you certain you wish to delete Chapter ${ch.chapter_number}: "${ch.title}"?`,
      confirmText: 'Delete Chapter',
      isDestructive: true,
      isProcessing: false,
      onConfirm: async () => {
        setConfirmModal(prev => prev ? { ...prev, isProcessing: true } : null);
        try {
          await api.deleteChapter(ch.id);
          showNotification('success', `Chapter ${ch.chapter_number} removed`);
          setConfirmModal(null);
          await loadAllData();
          if (onDataChanged) onDataChanged();
        } catch (err: any) {
          showNotification('error', err.message || 'Failed to delete chapter');
          setConfirmModal(null);
        }
      }
    });
  };


  /* ================= Comment Actions ================= */
  const handleUpdateComment = async (id: string, status: 'approved' | 'hidden') => {
    try {
      await api.updateCommentStatus(id, status);
      showNotification('success', `Comment set to ${status}`);
      loadAllData();
    } catch (err: any) {
      showNotification('error', 'Failed to update comment');
    }
  };

  const confirmDeleteComment = (c: Comment) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Reader Comment',
      message: `Are you certain you wish to permanently delete the comment by "${c.author_name}" on ${c.novel_slug}?`,
      confirmText: 'Delete Comment',
      isDestructive: true,
      isProcessing: false,
      onConfirm: async () => {
        setConfirmModal(prev => prev ? { ...prev, isProcessing: true } : null);
        try {
          await api.deleteComment(c.id);
          showNotification('success', 'Comment deleted successfully');
          setConfirmModal(null);
          loadAllData();
        } catch (err: any) {
          showNotification('error', err.message || 'Failed to delete comment');
          setConfirmModal(null);
        }
      }
    });
  };

  /* ================= Announcement Actions ================= */
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAnnouncement?.title || !editingAnnouncement?.message) {
      showNotification('error', 'Title and message are required');
      return;
    }
    try {
      setIsSavingAnnouncement(true);
      await api.saveAnnouncement(editingAnnouncement);
      showNotification('success', 'Announcement saved and published');
      setEditingAnnouncement(null);
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to save announcement');
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const confirmDeleteAnnouncement = (a: Announcement) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Broadcast Announcement',
      message: `Are you certain you wish to delete the announcement "${a.title}"?`,
      confirmText: 'Remove Notice',
      isDestructive: true,
      isProcessing: false,
      onConfirm: async () => {
        setConfirmModal(prev => prev ? { ...prev, isProcessing: true } : null);
        try {
          await api.deleteAnnouncement(a.id);
          showNotification('success', 'Announcement removed');
          setConfirmModal(null);
          loadAllData();
        } catch (err: any) {
          showNotification('error', err.message || 'Failed to delete announcement');
          setConfirmModal(null);
        }
      }
    });
  };

  /* ================= Site Settings Actions ================= */
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateSettings(settings);
      showNotification('success', 'Site settings updated');
    } catch (err: any) {
      showNotification('error', 'Failed to save settings');
    }
  };

  /* ================= Admin User Actions ================= */
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail || !newAdminName || !newAdminPassword) {
      showNotification('error', 'All admin credentials are required');
      return;
    }
    try {
      await api.createAdminUser({
        email: newAdminEmail,
        name: newAdminName,
        role: newAdminRole,
        password: newAdminPassword
      });
      showNotification('success', `Created ${newAdminRole} account for ${newAdminName}`);
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminPassword('');
      loadAllData();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to create admin');
    }
  };

  const confirmDeleteAdmin = (a: AdminUser) => {
    setConfirmModal({
      isOpen: true,
      title: 'Revoke Staff Access',
      message: `Are you certain you wish to revoke author studio access for "${a.name}" (${a.email})?`,
      confirmText: 'Revoke Access',
      isDestructive: true,
      isProcessing: false,
      onConfirm: async () => {
        setConfirmModal(prev => prev ? { ...prev, isProcessing: true } : null);
        try {
          await api.deleteAdminUser(a.id);
          showNotification('success', `Access revoked for ${a.name}`);
          setConfirmModal(null);
          loadAllData();
        } catch (err: any) {
          showNotification('error', err.message || 'Failed to delete staff member');
          setConfirmModal(null);
        }
      }
    });
  };


  return (
    <div className="min-h-screen bg-[#EEF0E4] text-[#28311F] font-serif">
      
      {/* Top Banner & User Role Info */}
      <div className="bg-[#2C3A22] text-[#EEF0E4] px-6 py-3 text-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onReturnToSite}
            className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity cursor-pointer font-serif uppercase tracking-wider"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Site</span>
          </button>
          <span className="opacity-40">|</span>
          <span className="font-sans font-medium text-[#B08D46] uppercase tracking-wider">
            Akhyana Author Studio
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 opacity-90">
            <Shield className="w-3.5 h-3.5 text-[#B08D46]" />
            <span>{currentUser?.name || 'Administrator'}</span>
            <span className="opacity-60 capitalize font-sans text-[11px] px-1.5 py-0.5 rounded bg-white/10">
              {currentUser?.role}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
            title="Log out securely"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Notifications Toast */}
      {notification && (
        <div
          className={`fixed top-14 right-6 z-50 p-4 rounded-xl text-xs font-serif shadow-lg border animate-in slide-in-from-top-2 duration-200 ${
            notification.type === 'success'
              ? 'bg-[#DDE5D2] text-[#2C3A22] border-[#2C3A22]/30'
              : 'bg-red-100 text-red-900 border-red-300'
          }`}
        >
          {notification.message}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Studio Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-[#2C3A22]/15">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BookOpen },
            { id: 'novels', label: 'Novels', icon: BookOpen },
            { id: 'chapters', label: 'Chapters', icon: FileText },
            { id: 'media', label: 'Covers & Media', icon: ImageIcon },
            { id: 'discussions', label: 'Discussions', icon: MessageSquare },
            { id: 'announcements', label: 'Announcements', icon: Bell },
            ...(currentUser?.role === 'owner' ? [{ id: 'admins', label: 'Admin Accounts', icon: Users }] : []),
            { id: 'settings', label: 'Site Settings', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as AdminTab);
                  setEditingNovel(null);
                  setEditingChapter(null);
                  setEditingAnnouncement(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-serif uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#2C3A22] text-[#EEF0E4] shadow-xs'
                    : 'bg-white/50 text-[#68715F] hover:bg-white/80 hover:text-[#28311F]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================= TAB: DASHBOARD ================= */}
        {activeTab === 'dashboard' && stats && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="glass-panel rounded-2xl p-6">
                <span className="text-xs uppercase tracking-widest text-[#68715F]">Active Serials</span>
                <p className="text-3xl font-serif font-bold text-[#28311F] mt-2 tabular-nums">{stats.novel_count}</p>
                <span className="text-xs text-[#68715F] mt-1 block">Original fiction titles</span>
              </div>

              <div className="glass-panel rounded-2xl p-6">
                <span className="text-xs uppercase tracking-widest text-[#68715F]">Published Chapters</span>
                <p className="text-3xl font-serif font-bold text-[#28311F] mt-2 tabular-nums">{stats.published_chapter_count}</p>
                <span className="text-xs text-[#68715F] mt-1 block">{stats.draft_chapter_count} pending drafts</span>
              </div>

              <div className="glass-panel rounded-2xl p-6">
                <span className="text-xs uppercase tracking-widest text-[#68715F]">Total Word Count</span>
                <p className="text-3xl font-serif font-bold text-[#28311F] mt-2 tabular-nums">{stats.total_words.toLocaleString()}</p>
                <span className="text-xs text-[#68715F] mt-1 block">Across all manuscripts</span>
              </div>

              <div className="glass-panel rounded-2xl p-6">
                <span className="text-xs uppercase tracking-widest text-[#68715F]">Reader Comments</span>
                <p className="text-3xl font-serif font-bold text-[#28311F] mt-2 tabular-nums">{stats.comment_count}</p>
                <span className="text-xs text-[#68715F] mt-1 block">{stats.pending_comments} need review</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quick Actions */}
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-base font-medium text-[#28311F] mb-4">Quick Publishing Actions</h3>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setEditingNovel({
                        title: '',
                        slug: '',
                        synopsis: '',
                        author: currentUser?.name || 'Author',
                        cover_url: curatedCovers[0].url,
                        genres: ['Botanical Fantasy'],
                        status: 'ongoing',
                        available_languages: ['en'],
                        is_featured: false
                      });
                      setActiveTab('novels');
                    }}
                    className="p-3 bg-white/60 hover:bg-white rounded-xl border border-[#2C3A22]/15 text-left text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer"
                  >
                    <span>Create New Serial / Novel</span>
                    <Plus className="w-4 h-4 text-[#2C3A22]" />
                  </button>

                  <button
                    onClick={() => {
                      setEditingChapter({
                        novel_slug: novels[0]?.slug || '',
                        chapter_number: chapters.length + 1,
                        title: '',
                        slug: '',
                        body: '',
                        language: 'en',
                        status: 'draft'
                      });
                      setActiveTab('chapters');
                    }}
                    className="p-3 bg-white/60 hover:bg-white rounded-xl border border-[#2C3A22]/15 text-left text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer"
                  >
                    <span>Write New Chapter Draft</span>
                    <Plus className="w-4 h-4 text-[#2C3A22]" />
                  </button>

                  <button
                    onClick={() => {
                      setEditingAnnouncement({
                        title: '',
                        message: '',
                        type: 'general',
                        status: 'published'
                      });
                      setActiveTab('announcements');
                    }}
                    className="p-3 bg-white/60 hover:bg-white rounded-xl border border-[#2C3A22]/15 text-left text-xs uppercase tracking-wider flex items-center justify-between cursor-pointer"
                  >
                    <span>Post Reader Announcement</span>
                    <Bell className="w-4 h-4 text-[#2C3A22]" />
                  </button>
                </div>
              </div>

              {/* Recent Novels Preview */}
              <div className="glass-panel rounded-2xl p-6">
                <h3 className="text-base font-medium text-[#28311F] mb-4">Active Novels Catalog</h3>
                <div className="flex flex-col gap-2.5">
                  {novels.map(n => (
                    <div key={n.id} className="flex items-center justify-between p-2 rounded-lg bg-white/40 border border-[#2C3A22]/10 text-xs">
                      <div className="flex items-center gap-2">
                        <img src={n.cover_url} alt="" className="w-6 h-8 object-cover rounded shrink-0" />
                        <span className="font-medium text-[#28311F]">{n.title}</span>
                      </div>
                      <span className="text-[#68715F] capitalize">{n.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: NOVELS ================= */}
        {activeTab === 'novels' && (
          <div>
            {!editingNovel ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-medium text-[#28311F]">Novels & Serials</h2>
                    <p className="text-xs text-[#68715F]">Manage metadata, synopsis, translations, and publishing status</p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingNovel({
                        title: '',
                        slug: '',
                        synopsis: '',
                        author: currentUser?.name || 'Author',
                        cover_url: curatedCovers[0].url,
                        genres: ['Botanical Fantasy'],
                        status: 'ongoing',
                        available_languages: ['en'],
                        is_featured: false
                      });
                      setOriginalNovelSlug(null);
                    }}
                    className="px-4 py-2.5 bg-[#2C3A22] text-[#EEF0E4] rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-xs hover:bg-[#1D2716] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Novel</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {novels.map(novel => (
                    <div key={novel.id} className="glass-panel rounded-2xl p-5 flex gap-4 items-start">
                      <img
                        src={novel.cover_url}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-20 h-28 object-cover rounded-xl shadow-xs shrink-0 border border-white/60"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs uppercase tracking-wider text-[#B08D46]">{novel.genres[0]}</span>
                          <span className="text-xs text-[#68715F] capitalize">{novel.status}</span>
                        </div>
                        <h3 className="text-lg font-medium text-[#28311F] truncate mt-0.5">{novel.title}</h3>
                        <p className="text-xs text-[#68715F]">By {novel.author}</p>
                        <p className="text-xs text-[#68715F] line-clamp-2 mt-2 leading-relaxed">{novel.synopsis}</p>

                        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-[#2C3A22]/10">
                          <button
                            onClick={() => {
                              setEditingNovel(novel);
                              setOriginalNovelSlug(novel.slug);
                            }}
                            className="text-xs text-[#2C3A22] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          {onOpenNovel && (
                            <button
                              onClick={() => onOpenNovel(novel.slug)}
                              className="text-xs text-[#B08D46] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                              title="View in public reader"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Story</span>
                            </button>
                          )}
                          <button
                            onClick={() => confirmDeleteNovel(novel)}
                            className="text-xs text-red-700 hover:underline flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveNovel} className="glass-panel rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#2C3A22]/15">
                  <h3 className="text-xl font-medium text-[#28311F]">
                    {editingNovel.id ? 'Edit Novel' : 'Publish New Novel'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingNovel(null)}
                    className="text-xs text-[#68715F] hover:text-[#28311F]"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Whispers of the Bamboo Glade"
                      value={editingNovel.title || ''}
                      onChange={(e) => {
                        const title = e.target.value;
                        const autoSlug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                        const isNew = !editingNovel.id;
                        setEditingNovel({
                          ...editingNovel,
                          title,
                          slug: isNew ? autoSlug : (editingNovel.slug || autoSlug)
                        });
                      }}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-sm font-serif"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Unique Slug</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. whispers-of-the-bamboo-glade"
                      value={editingNovel.slug || ''}
                      onChange={(e) => {
                        const clean = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                        setEditingNovel({ ...editingNovel, slug: clean });
                      }}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-sm font-serif"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Author Name</label>
                    <input
                      type="text"
                      required
                      value={editingNovel.author || ''}
                      onChange={(e) => setEditingNovel({ ...editingNovel, author: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-sm font-serif"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Status</label>
                    <select
                      value={editingNovel.status || 'ongoing'}
                      onChange={(e) => setEditingNovel({ ...editingNovel, status: e.target.value as any })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-sm font-serif"
                    >
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="hiatus">Hiatus</option>
                    </select>
                  </div>
                </div>

                {/* Cover Image Uploader with Drag-and-Drop & Preview */}
                <div className="mb-6">
                  <CoverUploader
                    label="Novel Cover Artwork"
                    helperText="Upload an image from your laptop, phone, or tablet. Supports drag-and-drop. Formats: JPEG, PNG, WebP (max 5MB)."
                    value={editingNovel.cover_url}
                    onChange={(url) => setEditingNovel({ ...editingNovel, cover_url: url })}
                    aspectRatio="3/4"
                    curatedCovers={curatedCovers}
                  />
                </div>

                {/* Synopsis */}
                <div className="mb-4">
                  <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Synopsis</label>
                  <textarea
                    rows={4}
                    value={editingNovel.synopsis || ''}
                    onChange={(e) => setEditingNovel({ ...editingNovel, synopsis: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-sm font-serif leading-relaxed"
                  />
                </div>

                {/* Japanese translation support */}
                <div className="p-4 rounded-xl bg-white/40 border border-[#2C3A22]/10 mb-6">
                  <h4 className="text-xs uppercase tracking-widest text-[#B08D46] mb-3">Japanese Translation (Optional)</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="日本語のタイトル (Japanese Title)"
                      value={editingNovel.translations?.jp?.title || ''}
                      onChange={(e) => {
                        const existingJp = editingNovel.translations?.jp || { title: '', synopsis: '' };
                        setEditingNovel({
                          ...editingNovel,
                          translations: {
                            ...editingNovel.translations,
                            jp: { ...existingJp, title: e.target.value }
                          }
                        });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/70 border border-[#2C3A22]/15 text-xs font-serif"
                    />
                    <textarea
                      rows={2}
                      placeholder="日本語のあらすじ (Japanese Synopsis)"
                      value={editingNovel.translations?.jp?.synopsis || ''}
                      onChange={(e) => {
                        const existingJp = editingNovel.translations?.jp || { title: '', synopsis: '' };
                        setEditingNovel({
                          ...editingNovel,
                          translations: {
                            ...editingNovel.translations,
                            jp: { ...existingJp, synopsis: e.target.value }
                          }
                        });
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/70 border border-[#2C3A22]/15 text-xs font-serif"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={isSavingNovel}
                    onClick={() => setEditingNovel(null)}
                    className="px-4 py-2 text-xs uppercase tracking-wider text-[#68715F] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingNovel}
                    className="px-6 py-2.5 bg-[#2C3A22] text-[#EEF0E4] hover:bg-[#1D2716] disabled:opacity-60 rounded-xl text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    {isSavingNovel && (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{isSavingNovel ? 'Saving Manuscript...' : (editingNovel.id ? 'Update Novel' : 'Publish Novel')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ================= TAB: CHAPTERS ================= */}
        {activeTab === 'chapters' && (
          <div>
            {!editingChapter ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-medium text-[#28311F]">Chapters & Manuscripts</h2>
                    <p className="text-xs text-[#68715F]">Write manuscripts, edit drafts, and publish to the live reader</p>
                  </div>
                  <button
                    onClick={() => setEditingChapter({
                      novel_slug: novels[0]?.slug || '',
                      chapter_number: chapters.length + 1,
                      title: '',
                      slug: '',
                      body: '',
                      language: 'en',
                      status: 'draft'
                    })}
                    className="px-4 py-2.5 bg-[#2C3A22] text-[#EEF0E4] rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Chapter</span>
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {chapters.map(ch => {
                    const novel = novels.find(n => n.slug === ch.novel_slug);
                    return (
                      <div
                        key={ch.id}
                        className="glass-panel rounded-xl p-4 flex items-center justify-between gap-4 border border-white/70"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <span className="text-xs font-bold text-[#B08D46] tabular-nums shrink-0">
                            Ch. {ch.chapter_number}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-[#28311F] truncate text-sm">{ch.title}</h4>
                              <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-sans ${
                                ch.status === 'published' ? 'bg-[#DDE5D2] text-[#2C3A22]' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {ch.status}
                              </span>
                            </div>
                            <p className="text-xs text-[#68715F]">
                              {novel?.title || ch.novel_slug} · {ch.word_count} words · {ch.language.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {onOpenChapter && (
                            <button
                              onClick={() => onOpenChapter(ch.novel_slug, ch.slug)}
                              className="p-2 text-[#B08D46] hover:bg-white/60 rounded-lg cursor-pointer"
                              title="Read Chapter in Reader"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setEditingChapter(ch)}
                            className="p-2 text-[#2C3A22] hover:bg-white/60 rounded-lg cursor-pointer"
                            title="Edit Chapter"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDeleteChapter(ch)}
                            className="p-2 text-red-700 hover:bg-white/60 rounded-lg cursor-pointer"
                            title="Delete Chapter"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveChapter} className="glass-panel rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#2C3A22]/15">
                  <h3 className="text-xl font-medium text-[#28311F]">
                    {editingChapter.id ? 'Edit Manuscript' : 'New Chapter Draft'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingChapter(null)}
                    className="text-xs text-[#68715F] hover:text-[#28311F]"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Target Novel</label>
                    <select
                      value={editingChapter.novel_slug || ''}
                      onChange={(e) => setEditingChapter({ ...editingChapter, novel_slug: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-sm font-serif"
                    >
                      {novels.map(n => (
                        <option key={n.id} value={n.slug}>{n.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Chapter Number</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editingChapter.chapter_number ?? 1}
                      onChange={(e) => setEditingChapter({ ...editingChapter, chapter_number: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-sm font-serif"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Publication State</label>
                    <select
                      value={editingChapter.status || 'draft'}
                      onChange={(e) => setEditingChapter({ ...editingChapter, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-sm font-serif"
                    >
                      <option value="draft">Draft (Private)</option>
                      <option value="published">Published (Public)</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Chapter Title</label>
                  <input
                    type="text"
                    required
                    value={editingChapter.title || ''}
                    onChange={(e) => {
                      const title = e.target.value;
                      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      setEditingChapter({
                        ...editingChapter,
                        title,
                        slug: editingChapter.slug ? editingChapter.slug : slug
                      });
                    }}
                    placeholder="e.g. The Ink of Falling Lichen"
                    className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-base font-serif"
                  />
                </div>

                {/* Chapter Cover Artwork / Illustration Uploader */}
                <div className="mb-6">
                  <CoverUploader
                    label="Chapter Artwork / Illustration (Optional)"
                    helperText="Upload an optional custom cover or scene illustration for this chapter. Formats: JPEG, PNG, WebP (max 5MB)."
                    value={editingChapter.cover_url}
                    onChange={(url) => setEditingChapter({ ...editingChapter, cover_url: url })}
                    aspectRatio="16/9"
                  />
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs uppercase tracking-wider text-[#68715F]">Chapter Prose</label>
                    <span className="text-xs text-[#68715F] tabular-nums">
                      {(editingChapter.body || '').trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>
                  <textarea
                    rows={14}
                    value={editingChapter.body || ''}
                    onChange={(e) => setEditingChapter({ ...editingChapter, body: e.target.value })}
                    placeholder="Write the prose here. Separate paragraphs with a blank line for optimal book typesetting."
                    className="w-full p-4 rounded-xl bg-white/80 border border-[#2C3A22]/15 text-base font-serif leading-relaxed"
                  />
                </div>

                {/* Multilingual Chapter Translations */}
                <div className="p-4 rounded-xl bg-white/40 border border-[#2C3A22]/10 mb-6">
                  <h4 className="text-xs uppercase tracking-widest text-[#B08D46] mb-3">Multilingual Translation (Optional)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#68715F] mb-1">Japanese Title</label>
                      <input
                        type="text"
                        value={editingChapter.translations?.jp?.title || ''}
                        onChange={(e) => {
                          const existing = editingChapter.translations?.jp || { title: '', body: '' };
                          setEditingChapter({
                            ...editingChapter,
                            translations: {
                              ...editingChapter.translations,
                              jp: { ...existing, title: e.target.value }
                            }
                          });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-white/70 border border-[#2C3A22]/15 text-xs font-serif"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-[#68715F] mb-1">Hinglish Title</label>
                      <input
                        type="text"
                        value={editingChapter.translations?.hi?.title || ''}
                        onChange={(e) => {
                          const existing = editingChapter.translations?.hi || { title: '', body: '' };
                          setEditingChapter({
                            ...editingChapter,
                            translations: {
                              ...editingChapter.translations,
                              hi: { ...existing, title: e.target.value }
                            }
                          });
                        }}
                        className="w-full px-3 py-1.5 rounded-lg bg-white/70 border border-[#2C3A22]/15 text-xs font-serif"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={isSavingChapter}
                    onClick={() => setEditingChapter(null)}
                    className="px-4 py-2 text-xs uppercase tracking-wider text-[#68715F] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingChapter}
                    className="px-6 py-2.5 bg-[#2C3A22] text-[#EEF0E4] hover:bg-[#1D2716] disabled:opacity-60 rounded-xl text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    {isSavingChapter && (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{isSavingChapter ? 'Saving Manuscript...' : (editingChapter.id ? 'Update Chapter' : 'Save Chapter')}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ================= TAB: MEDIA / COVERS ================= */}
        {activeTab === 'media' && (
          <div className="glass-panel rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-medium text-[#28311F] mb-2">Book Cover Gallery & Media Storage</h2>
            <p className="text-xs text-[#68715F] mb-6">
              Persistent high-resolution botanical novel artworks generated for Akhyana serials.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {curatedCovers.map((cover, i) => (
                <div key={i} className="group relative rounded-xl overflow-hidden glass-panel p-2 border border-white/80">
                  <div className="aspect-[3/4] overflow-hidden rounded-lg">
                    <img
                      src={cover.url}
                      alt={cover.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-2 text-xs font-serif text-[#28311F] font-medium truncate">
                    {cover.label}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(cover.url);
                      showNotification('success', 'Image URL copied to clipboard');
                    }}
                    className="mt-1 text-[11px] text-[#B08D46] hover:underline block"
                  >
                    Copy Path
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB: DISCUSSIONS / COMMENTS ================= */}
        {activeTab === 'discussions' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-medium text-[#28311F]">Reader Discussions & Moderation</h2>
              <p className="text-xs text-[#68715F]">Review, approve, or hide reader comments across all novels</p>
            </div>

            <div className="flex flex-col gap-3">
              {comments.map(c => (
                <div key={c.id} className="glass-panel rounded-xl p-5 border border-white/70">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#28311F]">{c.author_name}</span>
                      <span className="text-[#68715F]">on {c.novel_slug}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-sans ${
                        c.status === 'approved' ? 'bg-[#DDE5D2] text-[#2C3A22]' : 'bg-red-100 text-red-800'
                      }`}>
                        {c.status}
                      </span>
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <p className="text-sm text-[#28311F] mb-4">{c.content}</p>

                  <div className="flex items-center gap-3 pt-3 border-t border-[#2C3A22]/10 text-xs">
                    {c.status === 'hidden' ? (
                      <button
                        onClick={() => handleUpdateComment(c.id, 'approved')}
                        className="text-[#2C3A22] font-medium hover:underline cursor-pointer"
                      >
                        Approve Comment
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateComment(c.id, 'hidden')}
                        className="text-amber-800 font-medium hover:underline cursor-pointer"
                      >
                        Hide Comment
                      </button>
                    )}
                    <button
                      onClick={() => confirmDeleteComment(c)}
                      className="text-red-700 hover:underline cursor-pointer ml-auto"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB: ANNOUNCEMENTS ================= */}
        {activeTab === 'announcements' && (
          <div>
            {!editingAnnouncement ? (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-medium text-[#28311F]">Broadcast Announcements</h2>
                    <p className="text-xs text-[#68715F]">Popup notices that appear to visitors on entry</p>
                  </div>
                  <button
                    onClick={() => setEditingAnnouncement({
                      title: '',
                      message: '',
                      type: 'general',
                      status: 'published'
                    })}
                    className="px-4 py-2.5 bg-[#2C3A22] text-[#EEF0E4] rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Announcement</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {announcements.map(a => (
                    <div key={a.id} className="glass-panel rounded-xl p-5 border border-white/70">
                      <div className="flex items-center justify-between text-xs text-[#68715F] mb-2">
                        <span className="capitalize text-[#B08D46] font-medium">{a.type.replace('_', ' ')}</span>
                        <span className="capitalize">{a.status}</span>
                      </div>
                      <h3 className="text-lg font-medium text-[#28311F] mb-2">{a.title}</h3>
                      <p className="text-xs text-[#68715F] line-clamp-3 mb-4 leading-relaxed">{a.message}</p>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-[#2C3A22]/10 text-xs">
                        <button
                          onClick={() => setEditingAnnouncement(a)}
                          className="text-[#2C3A22] hover:underline font-medium cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDeleteAnnouncement(a)}
                          className="text-red-700 hover:underline cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveAnnouncement} className="glass-panel rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#2C3A22]/15">
                  <h3 className="text-xl font-medium text-[#28311F]">
                    {editingAnnouncement.id ? 'Edit Announcement' : 'New Broadcast'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setEditingAnnouncement(null)}
                    className="text-xs text-[#68715F]"
                  >
                    Cancel
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Headline</label>
                  <input
                    type="text"
                    required
                    value={editingAnnouncement.title || ''}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-sm font-serif"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Message Content</label>
                  <textarea
                    rows={4}
                    required
                    value={editingAnnouncement.message || ''}
                    onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, message: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-sm font-serif"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Action Button Text</label>
                    <input
                      type="text"
                      placeholder="e.g. Read Chapter 3"
                      value={editingAnnouncement.action_label || ''}
                      onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, action_label: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/70 border border-[#2C3A22]/15 text-xs font-serif"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Action Link / URL</label>
                    <input
                      type="text"
                      placeholder="e.g. #explore"
                      value={editingAnnouncement.action_url || ''}
                      onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, action_url: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-white/70 border border-[#2C3A22]/15 text-xs font-serif"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#2C3A22]/10">
                  <button
                    type="button"
                    disabled={isSavingAnnouncement}
                    onClick={() => setEditingAnnouncement(null)}
                    className="px-4 py-2 text-xs uppercase tracking-wider text-[#68715F] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAnnouncement}
                    className="px-6 py-2.5 bg-[#2C3A22] text-[#EEF0E4] hover:bg-[#1D2716] disabled:opacity-60 rounded-xl text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    {isSavingAnnouncement && (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    <span>{isSavingAnnouncement ? 'Saving...' : 'Save Broadcast'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ================= TAB: ADMIN ACCOUNTS (Owner Only) ================= */}
        {activeTab === 'admins' && currentUser?.role === 'owner' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-7">
              <h2 className="text-2xl font-medium text-[#28311F] mb-2">Authorized Staff Accounts</h2>
              <p className="text-xs text-[#68715F] mb-6">Manage roles and permissions for Akhyana authors and editors</p>

              <div className="flex flex-col gap-3">
                {admins.map(a => (
                  <div key={a.id} className="glass-panel rounded-xl p-4 flex items-center justify-between border border-white/70">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#28311F] text-sm">{a.name}</span>
                        <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-[#2C3A22]/10 text-[#2C3A22] font-sans">
                          {a.role}
                        </span>
                      </div>
                      <span className="text-xs text-[#68715F]">{a.email}</span>
                    </div>
                    {a.role !== 'owner' && (
                      <button
                        type="button"
                        onClick={() => confirmDeleteAdmin(a)}
                        className="text-xs text-red-700 hover:underline flex items-center gap-1 cursor-pointer ml-auto"
                        title="Revoke Staff Access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Revoke</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-5">
              <form onSubmit={handleCreateAdmin} className="glass-panel rounded-2xl p-6 border border-white/80">
                <h3 className="text-lg font-medium text-[#28311F] mb-4">Add Staff Member</h3>
                
                <div className="mb-3">
                  <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/70 border border-[#2C3A22]/15 text-xs font-serif"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/70 border border-[#2C3A22]/15 text-xs font-serif"
                  />
                </div>

                <div className="mb-3">
                  <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Role</label>
                  <select
                    value={newAdminRole}
                    onChange={(e) => setNewAdminRole(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/70 border border-[#2C3A22]/15 text-xs font-serif"
                  >
                    <option value="admin">Admin (Full content & site control)</option>
                    <option value="editor">Editor (Manuscripts and chapters)</option>
                    <option value="moderator">Moderator (Discussions only)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/70 border border-[#2C3A22]/15 text-xs font-serif"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#2C3A22] text-[#EEF0E4] rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer"
                >
                  Create Account
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB: SITE SETTINGS ================= */}
        {activeTab === 'settings' && settings && (
          <form onSubmit={handleSaveSettings} className="glass-panel rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-medium text-[#28311F] mb-1">Site Customization & Brand Settings</h2>
            <p className="text-xs text-[#68715F] mb-6">Customize global branding, featured novel, and reader themes</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Site Brand Name</label>
                <input
                  type="text"
                  value={settings.site_name}
                  onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-sm font-serif"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Tagline</label>
                <input
                  type="text"
                  value={settings.tagline}
                  onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-sm font-serif"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Featured Serial (Hero spotlight)</label>
                <select
                  value={settings.featured_novel_slug}
                  onChange={(e) => setSettings({ ...settings, featured_novel_slug: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-sm font-serif"
                >
                  {novels.map(n => (
                    <option key={n.id} value={n.slug}>{n.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#68715F] mb-1">Footer Copyright Text</label>
                <input
                  type="text"
                  value={settings.footer_text}
                  onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white/70 border border-[#2C3A22]/15 text-sm font-serif"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#2C3A22]/10">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#2C3A22] text-[#EEF0E4] rounded-xl text-xs uppercase tracking-wider font-semibold cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>
        )}

      </div>

      {/* In-app Confirmation Dialog (Works reliably across sandboxed iframes & production) */}
      {confirmModal && confirmModal.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#28311F]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="glass-panel bg-[#EEF0E4] border border-[#2C3A22]/20 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-medium text-[#28311F] font-serif mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-sm text-[#4A5540] leading-relaxed mb-6 font-serif">
              {confirmModal.message}
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2C3A22]/10">
              <button
                type="button"
                disabled={confirmModal.isProcessing}
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 text-xs uppercase tracking-wider text-[#68715F] hover:text-[#28311F] disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={confirmModal.isProcessing}
                onClick={() => confirmModal.onConfirm()}
                className={`px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-semibold text-white transition-colors cursor-pointer flex items-center gap-2 shadow-xs ${
                  confirmModal.isDestructive
                    ? 'bg-red-800 hover:bg-red-900 disabled:opacity-60'
                    : 'bg-[#2C3A22] hover:bg-[#1D2716] disabled:opacity-60'
                }`}
              >
                {confirmModal.isProcessing && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>{confirmModal.isProcessing ? 'Processing...' : confirmModal.confirmText}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

