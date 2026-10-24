-- Akhyana Multilingual Novel Publishing Platform
-- Migration: 001_initial_schema.sql
-- Production Target: PostgreSQL / Neon / Render

-- 1. Admin Users & Access Roles
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'editor', -- 'owner', 'admin', 'editor', 'moderator'
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMPTZ
);

-- 2. Server-Side Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Novels
CREATE TABLE IF NOT EXISTS novels (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(128) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    synopsis TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    cover_url TEXT NOT NULL,
    genres TEXT[] NOT NULL DEFAULT '{}',
    status VARCHAR(32) NOT NULL DEFAULT 'ongoing', -- 'ongoing', 'completed', 'hiatus'
    available_languages TEXT[] NOT NULL DEFAULT '{"en"}',
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    translations JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Chapters
CREATE TABLE IF NOT EXISTS chapters (
    id VARCHAR(64) PRIMARY KEY,
    novel_id VARCHAR(64) NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    novel_slug VARCHAR(128) NOT NULL,
    chapter_number INTEGER NOT NULL,
    order_index INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(128) NOT NULL,
    body TEXT NOT NULL,
    language VARCHAR(8) NOT NULL DEFAULT 'en',
    status VARCHAR(32) NOT NULL DEFAULT 'draft', -- 'published', 'draft'
    word_count INTEGER NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ,
    translations JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_novel_chapter UNIQUE(novel_id, chapter_number)
);

CREATE INDEX IF NOT EXISTS idx_chapters_novel ON chapters(novel_id, order_index);
CREATE INDEX IF NOT EXISTS idx_chapters_slug ON chapters(novel_slug, slug);

-- 5. Announcements & Broadcasts
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(32) NOT NULL DEFAULT 'general',
    action_label VARCHAR(128),
    action_url TEXT,
    image_url TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ
);

-- 6. Reader Progress (Privacy-conscious anonymous reading alerts)
CREATE TABLE IF NOT EXISTS reading_progress (
    id SERIAL PRIMARY KEY,
    reader_id VARCHAR(128) NOT NULL,
    novel_id VARCHAR(64) NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    novel_slug VARCHAR(128) NOT NULL,
    last_chapter_id VARCHAR(64) NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    last_chapter_number INTEGER NOT NULL,
    progress_percent REAL NOT NULL DEFAULT 0,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_reader_novel UNIQUE(reader_id, novel_id)
);

CREATE INDEX IF NOT EXISTS idx_reader_progress ON reading_progress(reader_id);

-- 7. Comments & Discussions
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(64) PRIMARY KEY,
    novel_id VARCHAR(64) NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
    novel_slug VARCHAR(128) NOT NULL,
    author_name VARCHAR(128) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'approved', -- 'approved', 'pending', 'hidden'
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_novel ON comments(novel_id, created_at DESC);

-- 8. Site Settings
CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(64) PRIMARY KEY,
    site_name VARCHAR(128) NOT NULL DEFAULT 'Akhyana',
    tagline VARCHAR(255) NOT NULL DEFAULT 'Stories that stay with you.',
    featured_novel_slug VARCHAR(128),
    accent_color VARCHAR(32) NOT NULL DEFAULT '#B08D46',
    footer_text TEXT NOT NULL DEFAULT '© Akhyana. All original fiction and translations reserved.',
    allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
    announcement_popup_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES admin_users(id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(64),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
