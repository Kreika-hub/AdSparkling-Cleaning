-- ============================================
-- AD SPARKLING CLEANING — Master SQL Schema
-- ============================================

-- Limpieza limpia para evitar conflictos entre tipos UUID y TEXT de versiones previas
DROP TABLE IF EXISTS appointment_assignments CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS quotes CASCADE;
DROP TABLE IF EXISTS plans CASCADE;

-- 1. TABLA DE LEADS / PROSPECTOS
CREATE TABLE leads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  size_sqft INTEGER,
  frequency TEXT,
  notes TEXT,
  status TEXT DEFAULT 'nuevo',
  source TEXT,
  referral_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE CLIENTES
CREATE TABLE clients (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  size_sqft INTEGER,
  frequency TEXT,
  base_price NUMERIC(10,2),
  last_visit DATE,
  next_visit DATE,
  status TEXT DEFAULT 'activo',
  notes TEXT,
  lifetime_value NUMERIC(10,2) DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  satisfaction_score NUMERIC(3,1),
  referral_source TEXT,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE CITAS / VISITAS
CREATE TABLE appointments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  addons TEXT[] DEFAULT '{}',
  notes TEXT,
  status TEXT DEFAULT 'pendiente',
  duration_minutes INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  accumulated_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE EQUIPO (TEAM MEMBERS)
CREATE TABLE team_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'cleaner',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ASIGNACIÓN DE CITAS AL EQUIPO
CREATE TABLE appointment_assignments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE CASCADE,
  team_member_id TEXT REFERENCES team_members(id) ON DELETE CASCADE,
  minutes_worked INTEGER,
  quality_score INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA DE GASTOS OPERATIVOS
CREATE TABLE expenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA DE COTIZACIONES (Historial)
CREATE TABLE quotes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  size_sqft INTEGER NOT NULL,
  frequency TEXT NOT NULL,
  base_price INTEGER NOT NULL,
  addons TEXT[] DEFAULT '{}',
  total_price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA DE PLANES Y MEMBRESÍAS
CREATE TABLE plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  frequency TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  included TEXT[] DEFAULT '{}',
  excluded TEXT[] DEFAULT '{}',
  terms TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLA DE CONTRATOS DE CLIENTES
CREATE TABLE contracts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  plan_id TEXT,
  accepted BOOLEAN DEFAULT false,
  accepted_at TIMESTAMPTZ,
  terms_snapshot TEXT,
  pdf_url TEXT,
  signature_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLA DE RESEÑAS Y MODERACIÓN
CREATE TABLE reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT,
  client_name TEXT,
  client_phone TEXT,
  rating INTEGER DEFAULT 5,
  comment TEXT,
  photos TEXT[] DEFAULT '{}',
  photo_url TEXT,
  status TEXT DEFAULT 'pendiente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
