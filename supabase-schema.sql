-- ============================================
-- AD SPARKLING CLEANING — SQL Schema (Business OS)
-- Tablas para el funcionamiento completo de la plataforma
-- ============================================

-- 1. TABLA DE LEADS / PROSPECTOS
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  size_sqft INTEGER,
  frequency TEXT, -- '10', '15', '30', 'deep'
  notes TEXT,
  status TEXT DEFAULT 'nuevo', -- 'nuevo', 'contactado', 'agendado', 'descartado'
  source TEXT, -- 'facebook', 'google', 'referral', 'website', 'repeat_customer'
  referral_code TEXT, -- Código del cliente que lo invitó
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE CLIENTES
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  size_sqft INTEGER,
  frequency TEXT, -- '10', '15', '30', 'deep'
  base_price INTEGER,
  last_visit DATE,
  next_visit DATE,
  status TEXT DEFAULT 'activo', -- 'activo', 'pausado', 'inactivo'
  notes TEXT,
  lifetime_value NUMERIC(10,2) DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  satisfaction_score NUMERIC(3,1),
  referral_source TEXT,
  referral_code TEXT UNIQUE, -- El código propio de este cliente para invitar
  referred_by TEXT, -- Quién lo invitó (código)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE CITAS / VISITAS
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  addons TEXT[] DEFAULT '{}',
  notes TEXT,
  status TEXT DEFAULT 'pendiente', -- 'pendiente', 'completada', 'cancelada'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE EQUIPO (TEAM MEMBERS)
CREATE TABLE IF NOT EXISTS team_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'cleaner', -- 'cleaner', 'supervisor', 'admin'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ASIGNACIÓN DE CITAS AL EQUIPO
CREATE TABLE IF NOT EXISTS appointment_assignments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE CASCADE,
  team_member_id TEXT REFERENCES team_members(id) ON DELETE CASCADE,
  minutes_worked INTEGER,
  quality_score INTEGER, -- 1 a 5
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA DE GASTOS OPERATIVOS
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA DE COTIZACIONES (Historial)
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  size_sqft INTEGER NOT NULL,
  frequency TEXT NOT NULL,
  base_price INTEGER NOT NULL,
  addons TEXT[] DEFAULT '{}',
  total_price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SCRIPT DE MIGRACIÓN (Ejecutar solo si ya tienes las tablas antiguas)
-- ============================================
/*
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS referral_code TEXT;

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS lifetime_value NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_visits INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS satisfaction_score NUMERIC(3,1),
ADD COLUMN IF NOT EXISTS referral_source TEXT,
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS referred_by TEXT;
*/
