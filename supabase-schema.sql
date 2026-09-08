-- ============================================
-- AD SPARKLING CLEANING — SQL Schema
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

-- 4. TABLA DE GASTOS OPERATIVOS
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category TEXT NOT NULL, -- 'insumos', 'gasolina', 'salario_asistente', 'equipo', 'otro'
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE COTIZACIONES (Opcional para historial)
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  size_sqft INTEGER NOT NULL,
  frequency TEXT NOT NULL,
  base_price INTEGER NOT NULL,
  addons TEXT[] DEFAULT '{}',
  total_price INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
