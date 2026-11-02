-- Migration: 20261031_create_settings_tables.sql
-- Description: Centralized store settings, customer preferences, and audit logs for NexLapTech.

CREATE TABLE IF NOT EXISTS store_settings (
  id TEXT PRIMARY KEY,
  settings JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_preferences (
  customer_id TEXT PRIMARY KEY,
  preferences JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings_audit_log (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  admin_email TEXT NOT NULL,
  admin_name TEXT,
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  changed_fields JSONB
);

-- Enable RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow public read of store settings, admin full access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'store_settings' AND policyname = 'Allow public read store_settings'
  ) THEN
    CREATE POLICY "Allow public read store_settings" ON store_settings FOR SELECT USING (true);
  END IF;
END $$;

