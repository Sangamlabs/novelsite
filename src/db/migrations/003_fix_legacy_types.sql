-- Akhyana Migration: 003_fix_legacy_types.sql
-- Harmonize legacy column types to VARCHAR(64) and loosen legacy constraints

DO $$
BEGIN
    -- Drop legacy foreign key on comments if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'comments_chapter_id_fkey'
    ) THEN
        ALTER TABLE comments DROP CONSTRAINT comments_chapter_id_fkey;
    END IF;

    -- Update legacy role check on admin_users to allow all Akhyana roles
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'admin_users_role_check'
    ) THEN
        ALTER TABLE admin_users DROP CONSTRAINT admin_users_role_check;
        ALTER TABLE admin_users ADD CONSTRAINT admin_users_role_check
            CHECK (role IN ('owner', 'admin', 'editor', 'moderator'));
    END IF;

    -- Loosen legacy not-null constraints if present
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_users' AND column_name = 'username' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE admin_users ALTER COLUMN username DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_users' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE admin_users ALTER COLUMN is_active SET DEFAULT true;
        ALTER TABLE admin_users ALTER COLUMN is_active DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admin_users' AND column_name = 'login_count'
    ) THEN
        ALTER TABLE admin_users ALTER COLUMN login_count SET DEFAULT 0;
        ALTER TABLE admin_users ALTER COLUMN login_count DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'chapter_id' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE comments ALTER COLUMN chapter_id DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'display_name' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE comments ALTER COLUMN display_name DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'body' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE comments ALTER COLUMN body DROP NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'language' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE comments ALTER COLUMN language DROP NOT NULL;
    END IF;

    -- Convert ID columns to VARCHAR(64)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'comments' AND column_name = 'chapter_id' AND data_type != 'character varying'
    ) THEN
        ALTER TABLE comments ALTER COLUMN chapter_id TYPE VARCHAR(64) USING chapter_id::text;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'chapters' AND column_name = 'id' AND data_type != 'character varying'
    ) THEN
        ALTER TABLE chapters ALTER COLUMN id TYPE VARCHAR(64) USING id::text;
    END IF;
END $$;
