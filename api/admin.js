import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [expiresStr, signature] = parts;
  const expires = parseInt(expiresStr, 10);
  if (isNaN(expires) || String(expires) !== expiresStr) return false;
  if (Date.now() > expires) return false;

  const expectedSig = crypto.createHmac('sha256', secret).update(expiresStr).digest('hex');
  const bufA = crypto.createHash('sha256').update(signature).digest();
  const bufB = crypto.createHash('sha256').update(expectedSig).digest();
  return crypto.timingSafeEqual(bufA, bufB);
}

function isPlainObject(obj) {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

function isValidInsertPayload(val) {
  if (Array.isArray(val)) {
    return val.length > 0 && val.every(isPlainObject);
  }
  return isPlainObject(val);
}

export default async function handler(req, res) {
  // CORS restringido por variable de entorno
  const origin = req.headers.origin;
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  if (allowedOriginsEnv && origin) {
    const allowedList = allowedOriginsEnv.split(',').map(o => o.trim()).filter(Boolean);
    if (allowedList.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!ADMIN_PASSWORD || !ADMIN_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'server misconfigured' });
  }

  const { action, password, token, table, method, payload } = req.body || {};

  if (action === 'login') {
    if (!safeCompare(password, ADMIN_PASSWORD)) {
      await new Promise(resolve => setTimeout(resolve, 700));
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const expires = Date.now() + 12 * 60 * 60 * 1000; // Válido por 12 horas
    const data = `${expires}`;
    const signature = crypto.createHmac('sha256', ADMIN_SECRET).update(data).digest('hex');
    const newToken = `${data}.${signature}`;
    return res.status(200).json({ token: newToken });
  }

  if (action === 'query') {
    if (!verifyToken(token, ADMIN_SECRET)) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    const allowedTables = ['leads', 'clients', 'appointments', 'expenses', 'quotes', 'plans', 'contracts', 'surcharges', 'gallery', 'team_members', 'reviews', 'push_subscriptions'];
    if (!allowedTables.includes(table)) return res.status(403).json({ error: 'Tabla no permitida' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let result;

    try {
      if (method === 'select') {
        result = await supabase.from(table).select('*');
      } else if (method === 'insert') {
        if (!isValidInsertPayload(payload)) {
          return res.status(400).json({ error: 'Payload inválido' });
        }
        result = await supabase.from(table).insert(payload);
      } else if (method === 'update') {
        if (!isPlainObject(payload) || !payload.id || !isPlainObject(payload.data)) {
          return res.status(400).json({ error: 'Payload inválido' });
        }
        result = await supabase.from(table).update(payload.data).eq('id', payload.id);
      } else if (method === 'upsert') {
        if (!isValidInsertPayload(payload)) {
          return res.status(400).json({ error: 'Payload inválido' });
        }
        result = await supabase.from(table).upsert(payload);
      } else if (method === 'delete') {
        if (!isPlainObject(payload) || !payload.id) {
          return res.status(400).json({ error: 'Payload inválido' });
        }
        result = await supabase.from(table).delete().eq('id', payload.id);
      } else {
        return res.status(400).json({ error: 'Método inválido' });
      }

      if (result.error) throw result.error;
      return res.status(200).json({ data: result.data });
    } catch (err) {
      console.error('Admin Query Error:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
  }

  if (action === 'signedUrl') {
    if (!verifyToken(token, ADMIN_SECRET)) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    const { path } = req.body || {};
    if (!path || typeof path !== 'string') return res.status(400).json({ error: 'Falta path' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    try {
      const { data, error } = await supabase.storage.from('contracts').createSignedUrl(path, 300);
      if (error) throw error;
      return res.status(200).json({ url: data.signedUrl });
    } catch (err) {
      console.error('Admin SignedUrl Error:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
  }

  return res.status(400).json({ error: 'Acción inválida' });
}
