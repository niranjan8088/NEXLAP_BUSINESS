-- Migration: 20261101_add_settings_versions.sql
-- Description: Adds historical versioning snapshots and draft/publish controls for NexLapTech.

CREATE TABLE IF NOT EXISTS store_settings_versions (
  version INT PRIMARY KEY,
  settings JSONB NOT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  published_by JSONB,
  summary TEXT
);

-- Enable RLS
ALTER TABLE store_settings_versions ENABLE ROW LEVEL SECURITY;

-- Allow admin full access, authenticated read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'store_settings_versions' AND policyname = 'Allow public read store_settings_versions'
  ) THEN
    CREATE POLICY "Allow public read store_settings_versions" ON store_settings_versions FOR SELECT USING (true);
  END IF;
END $$;

