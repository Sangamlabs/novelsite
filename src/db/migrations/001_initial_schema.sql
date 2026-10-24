-- Akhyana Multilingual Novel Publishing Platform
-- Migration: 001_initial_schema.sql
-- Production Target: PostgreSQL / Neon / Render

-- Pre-migration compatibility layer: adapt legacy columns if previously provisioned with incompatible types
DO $$
BEGIN
    -- Upgrade admin_users if already present
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
        BEGIN
            ALTER TABLE admin_users ALTER COLUMN id TYPE VARCHAR(64) USING id::text;
        EXCEPTION WHEN others THEN NULL;
        END;
        ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT 'Staff Member';
        ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role VARCHAR(32) DEFAULT 'editor';
        ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
        ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Upgrade chapters if already present
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chapters') THEN
        BEGIN
            ALTER TABLE chapters ALTER COLUMN id TYPE VARCHAR(64) USING id::text;
        EXCEPTION WHEN others THEN NULL;
        END;
        ALTER TABLE chapters ADD COLUMN IF NOT EXISTS novel_id VARCHAR(64);
        ALTER TABLE chapters ADD COLUMN IF NOT EXISTS novel_slug VARCHAR(128) DEFAULT 'the-whispering-canopy';
        ALTER TABLE chapters ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 1;
        ALTER TABLE chapters ADD COLUMN IF NOT EXISTS body TEXT DEFAULT '';
        ALTER TABLE chapters ADD COLUMN IF NOT EXISTS language VARCHAR(8) DEFAULT 'en';
        ALTER TABLE chapters ADD COLUMN IF NOT EXISTS word_count INTEGER DEFAULT 0;
        ALTER TABLE chapters ADD COLUMN IF NOT EXISTS cover_url TEXT;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chapters' AND column_name = 'content') THEN
            UPDATE chapters SET body = content WHERE body IS NULL OR body = '';
        END IF;
    END IF;

    -- Upgrade comments if already present
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
        BEGIN
            ALTER TABLE comments ALTER COLUMN id TYPE VARCHAR(64) USING id::text;
        EXCEPTION WHEN others THEN NULL;
        END;
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS novel_id VARCHAR(64);
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS novel_slug VARCHAR(128) DEFAULT 'the-whispering-canopy';
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS chapter_slug VARCHAR(128);
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS author_name VARCHAR(128) DEFAULT 'Anonymous Reader';
        ALTER TABLE comments ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'body') THEN
            UPDATE comments SET content = body WHERE content IS NULL OR content = '';
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'display_name') THEN
            UPDATE comments SET author_name = display_name WHERE author_name IS NULL OR author_name = 'Anonymous Reader';
        END IF;
    END IF;
END $$;

-- 1. Admin Users & Access Roles
CREATE TABLE IF NOT EXISTS admin_users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT 'Staff Member',
    role VARCHAR(32) NOT NULL DEFAULT 'editor', -- 'owner', 'admin', 'editor', 'moderator'
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMPTZ
);

-- 2. Server-Side Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
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
    novel_id VARCHAR(64) NOT NULL DEFAULT 'nov-1',
    novel_slug VARCHAR(128) NOT NULL DEFAULT 'the-whispering-canopy',
    chapter_number INTEGER NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(128) NOT NULL,
    body TEXT NOT NULL DEFAULT '',
    language VARCHAR(8) NOT NULL DEFAULT 'en',
    status VARCHAR(32) NOT NULL DEFAULT 'draft', -- 'published', 'draft'
    cover_url TEXT,
    word_count INTEGER NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ,
    translations JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
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
    novel_id VARCHAR(64) NOT NULL DEFAULT 'nov-1',
    novel_slug VARCHAR(128) NOT NULL DEFAULT 'the-whispering-canopy',
    last_chapter_id VARCHAR(64) NOT NULL DEFAULT 'ch-1',
    last_chapter_number INTEGER NOT NULL DEFAULT 1,
    progress_percent REAL NOT NULL DEFAULT 0,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_reader_novel UNIQUE(reader_id, novel_id)
);

CREATE INDEX IF NOT EXISTS idx_reader_progress ON reading_progress(reader_id);

-- 7. Comments & Discussions
CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(64) PRIMARY KEY,
    novel_id VARCHAR(64) NOT NULL DEFAULT 'nov-1',
    novel_slug VARCHAR(128) NOT NULL DEFAULT 'the-whispering-canopy',
    chapter_slug VARCHAR(128),
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
    user_id VARCHAR(64),
    action VARCHAR(64) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(64),
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
