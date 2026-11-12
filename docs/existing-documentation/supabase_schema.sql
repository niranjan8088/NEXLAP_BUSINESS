-- ====================================================================
-- NEXLAPTECH — PRODUCTION SUPABASE POSTGRESQL SCHEMA
-- Target Database: Supabase PostgreSQL
-- Realtime Tables: Enabled via supabase_realtime publication
-- ====================================================================

-- 1. PROFILES TABLE (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'reseller', 'user')),
  reseller_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'reseller')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT,
  brand TEXT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  discount NUMERIC DEFAULT 0,
  stock INT DEFAULT 10,
  cost_price NUMERIC,
  condition TEXT DEFAULT 'new' CHECK (condition IN ('new', 'refurbished', 'premium_used')),
  status TEXT DEFAULT 'show' CHECK (status IN ('show', 'hidden', 'deleted')),
  featured BOOLEAN DEFAULT FALSE,
  latest BOOLEAN DEFAULT FALSE,
  image TEXT,
  images TEXT[],
  specs JSONB,
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  description TEXT,
  warranty TEXT DEFAULT '1 Year NexLapTech Warranty',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_normalized_unique
  ON public.products (UPPER(BTRIM(sku)))
  WHERE sku IS NOT NULL AND BTRIM(sku) <> '';

-- 2.1 PRODUCT CARE & PROTECTION PLANS
CREATE TABLE IF NOT EXISTS public.product_protection_plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  duration TEXT NOT NULL DEFAULT 'Year',
  accent TEXT NOT NULL DEFAULT 'purple' CHECK (accent IN ('purple', 'blue')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 CUSTOMER OFFERS
CREATE TABLE IF NOT EXISTS public.offers (
  id TEXT PRIMARY KEY,
  offer_name TEXT NOT NULL,
  offer_code TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(12, 2) NOT NULL CHECK (discount_value > 0),
  eligible_products JSONB NOT NULL DEFAULT '["all"]'::jsonb,
  minimum_purchase NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (minimum_purchase >= 0),
  maximum_discount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (maximum_discount >= 0),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  usage_limit INTEGER NOT NULL DEFAULT 100 CHECK (usage_limit > 0),
  per_customer_limit INTEGER NOT NULL DEFAULT 1 CHECK (per_customer_limit > 0),
  usage_count INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  used_by JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT offers_expiry_after_start CHECK (expiry_date >= start_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS offers_code_normalized_unique
  ON public.offers (UPPER(BTRIM(offer_code)));

-- 3. SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  duration TEXT DEFAULT '2-4 Hours',
  status TEXT DEFAULT 'enabled' CHECK (status IN ('enabled', 'disabled')),
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY DEFAULT ('b-' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  "bookingId" TEXT UNIQUE NOT NULL,
  "customerName" TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  city TEXT DEFAULT 'Bengaluru',
  state TEXT DEFAULT 'Karnataka',
  pincode TEXT DEFAULT '560001',
  "productId" TEXT,
  "productName" TEXT NOT NULL,
  "productCategory" TEXT DEFAULT 'other',
  configuration TEXT DEFAULT 'Standard',
  budget TEXT DEFAULT 'N/A',
  message TEXT,
  "bookingType" TEXT DEFAULT 'product',
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'pending', 'contacted', 'quoted', 'approved', 'confirmed', 'in_progress', 'completed', 'rejected', 'cancelled')),
  "assignedTo" TEXT,
  technician TEXT,
  notes TEXT,
  "replyMessage" TEXT,
  "replyDate" TIMESTAMPTZ,
  "replyBy" TEXT,
  quantity INT DEFAULT 1,
  "preferredContact" TEXT DEFAULT 'WhatsApp',
  "preferredDate" DATE DEFAULT CURRENT_DATE,
  "preferredTime" TEXT DEFAULT '10:30 AM',
  device TEXT DEFAULT 'Web Client',
  browser TEXT DEFAULT 'Chrome / Web',
  ip TEXT,
  timeline JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  customer_name TEXT,
  service_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY DEFAULT ('rev-' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  customer_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  city TEXT DEFAULT 'Tumkur',
  service_used TEXT,
  product_purchased TEXT,
  overall_experience TEXT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  review_message TEXT NOT NULL,
  recommend BOOLEAN DEFAULT TRUE,
  image_urls TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verified BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  source TEXT DEFAULT 'public_form',
  likes_count INT DEFAULT 0,
  helpful_count INT DEFAULT 0,
  admin_reply TEXT,
  admin_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INTERNSHIPS TABLE
CREATE TABLE IF NOT EXISTS public.internships (
  id TEXT PRIMARY KEY DEFAULT ('int-' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  student_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  college TEXT NOT NULL,
  domain TEXT NOT NULL,
  resume_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TRAINING ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS public.training (
  id TEXT PRIMARY KEY DEFAULT ('tr-' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  course_title TEXT NOT NULL,
  student_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  batch TEXT DEFAULT 'Upcoming Batch',
  trainer TEXT DEFAULT 'Niranjan M.',
  attendance_status TEXT DEFAULT 'enrolled',
  certificate_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'enrolled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CONTACT ENQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.contacts (
  id TEXT PRIMARY KEY DEFAULT ('ct-' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'archived')),
  admin_reply TEXT,
  admin_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. LAPTOP ENQUIRIES TABLE
CREATE TABLE IF NOT EXISTS public.laptop_enquiries (
  id TEXT PRIMARY KEY DEFAULT ('lp-' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  budget TEXT NOT NULL,
  laptop_type TEXT NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY DEFAULT ('n-' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
  type TEXT DEFAULT 'general',
  meta JSONB,
  customer_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
  id TEXT PRIMARY KEY DEFAULT ('c-' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  "registrationId" TEXT UNIQUE NOT NULL,
  "certificateId" TEXT UNIQUE NOT NULL,
  "studentName" TEXT NOT NULL,
  "photoUrl" TEXT,
  "courseTitle" TEXT NOT NULL,
  "trainingType" TEXT DEFAULT 'Professional Training',
  "internshipType" TEXT DEFAULT 'N/A',
  "projectTitle" TEXT,
  "completionDate" DATE NOT NULL,
  status TEXT DEFAULT 'verified' CHECK (status IN ('verified', 'revoked', 'pending')),
  "phoneNumber" TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY DEFAULT ('cust-' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  "customerId" TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  address TEXT,
  city TEXT DEFAULT 'Bengaluru',
  "totalBookings" INT DEFAULT 0,
  "reviewsCount" INT DEFAULT 0,
  "certificatesCount" INT DEFAULT 0,
  "productsPurchased" TEXT,
  "servicesTaken" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. GALLERY TABLE
CREATE TABLE IF NOT EXISTS public.gallery (
  id TEXT PRIMARY KEY DEFAULT ('gal-' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT DEFAULT 'store',
  visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. CMS CONTENT TABLE
CREATE TABLE IF NOT EXISTS public.cms_content (
  id TEXT PRIMARY KEY DEFAULT 'main',
  hero JSONB NOT NULL,
  seo JSONB NOT NULL,
  footer JSONB NOT NULL,
  contact_info JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY DEFAULT ('act-' || EXTRACT(EPOCH FROM NOW())::BIGINT),
  user_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  action TEXT NOT NULL,
  details TEXT,
  ip TEXT DEFAULT '127.0.0.1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. ORDERS TABLE
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

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all read orders" ON public.orders;
CREATE POLICY "Allow all read orders" ON public.orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert orders" ON public.orders;
CREATE POLICY "Allow all insert orders" ON public.orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update orders" ON public.orders;
CREATE POLICY "Allow all update orders" ON public.orders FOR UPDATE USING (true);
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(phone);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ====================================================================
-- REALTIME PUBLICATION SETUP
-- ====================================================================
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
  public.bookings, 
  public.reviews, 
  public.contacts, 
  public.laptop_enquiries, 
  public.internships, 
  public.training, 
  public.notifications, 
  public.products, 
  public.services, 
  public.certificates, 
  public.customers,
  public.orders;

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Products RLS: Anyone can view active products; only authenticated admins can write
CREATE POLICY "Public Read Active Products" ON public.products FOR SELECT USING (status = 'show');
CREATE POLICY "Admin All Products Access" ON public.products FOR ALL USING (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role');

-- Reviews RLS: Public can view approved reviews; users can submit pending reviews
CREATE POLICY "Public Read Approved Reviews" ON public.reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Public Insert Pending Reviews" ON public.reviews FOR INSERT WITH CHECK (status = 'pending');
CREATE POLICY "Admin All Reviews Access" ON public.reviews FOR ALL USING (auth.role() = 'service_role');

-- Bookings RLS: Customers can insert bookings & view own bookings by phone/ID; Admins full access
CREATE POLICY "Customer Insert Bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin All Bookings Access" ON public.bookings FOR ALL USING (auth.role() = 'service_role');

-- Certificates RLS: Public verification of active certificates
CREATE POLICY "Public Verify Active Certificates" ON public.certificates FOR SELECT USING (status = 'verified');
CREATE POLICY "Admin All Certificates Access" ON public.certificates FOR ALL USING (auth.role() = 'service_role');
