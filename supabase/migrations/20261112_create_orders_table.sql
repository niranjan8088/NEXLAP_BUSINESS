-- ====================================================================
-- SUPABASE MIGRATION: Orders Table Definition & Security Policies
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  order_number TEXT,
  user_id TEXT,
  customer_name TEXT,
  email TEXT,
  phone TEXT,
  shipping_address JSONB DEFAULT '{}'::jsonb,
  delivery_option TEXT DEFAULT 'standard',
  payment_method TEXT DEFAULT 'COD',
  payment_status TEXT DEFAULT 'Pending (COD)',
  status TEXT DEFAULT 'Confirmed',
  order_timeline JSONB DEFAULT '[]'::jsonb,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  applied_offer_id TEXT,
  applied_offer_code TEXT,
  applied_offer_name TEXT,
  applied_offer_type TEXT,
  applied_offer_value NUMERIC,
  applied_offer_discount NUMERIC,
  applied_offer_subtotal_basis NUMERIC,
  applied_offer_timestamp TIMESTAMPTZ,
  protection_plan JSONB,
  protection_plan_id TEXT,
  protection_plan_price NUMERIC,
  gst_amount NUMERIC DEFAULT 0,
  cgst_amount NUMERIC DEFAULT 0,
  sgst_amount NUMERIC DEFAULT 0,
  shipping_fee NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  gst_details JSONB,
  courier TEXT,
  tracking_carrier TEXT,
  tracking_number TEXT,
  tracking_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all read orders" ON public.orders;
CREATE POLICY "Allow all read orders" ON public.orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all insert orders" ON public.orders;
CREATE POLICY "Allow all insert orders" ON public.orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update orders" ON public.orders;
CREATE POLICY "Allow all update orders" ON public.orders FOR UPDATE USING (true);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

