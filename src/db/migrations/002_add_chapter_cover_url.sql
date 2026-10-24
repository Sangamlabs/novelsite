-- Akhyana Multilingual Novel Publishing Platform
-- Migration: 002_add_chapter_cover_url.sql
-- Safe, backward-compatible migration adding optional custom cover/illustration for chapters

ALTER TABLE chapters ADD COLUMN IF NOT EXISTS cover_url TEXT;
