import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req, res) {
  // Configuración de CORS
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, password, token, table, method, payload } = req.body;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (action === 'login') {
    if (password === ADMIN_PASSWORD) {
      const expires = Date.now() + 12 * 60 * 60 * 1000; // Válido por 12 horas
      const data = `${expires}`;
      const signature = crypto.createHmac('sha256', ADMIN_SECRET).update(data).digest('hex');
      const newToken = `${data}.${signature}`;
      return res.status(200).json({ token: newToken });
    }
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  if (action === 'query') {
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
    
    const [expires, signature] = token.split('.');
    if (Date.now() > parseInt(expires, 10)) {
      return res.status(401).json({ error: 'Token expirado' });
    }
    
    const expectedSig = crypto.createHmac('sha256', ADMIN_SECRET).update(expires).digest('hex');
    if (signature !== expectedSig) {
      return res.status(401).json({ error: 'Firma de token inválida' });
    }

    const allowedTables = ['leads', 'clients', 'appointments', 'expenses', 'quotes', 'plans', 'contracts', 'surcharges', 'gallery'];
    if (!allowedTables.includes(table)) return res.status(403).json({ error: 'Tabla no permitida' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let result;

    try {
      if (method === 'select') {
        result = await supabase.from(table).select('*');
      } else if (method === 'insert') {
        result = await supabase.from(table).insert(payload);
      } else if (method === 'update') {
        result = await supabase.from(table).update(payload.data).eq('id', payload.id);
      } else if (method === 'upsert') {
        result = await supabase.from(table).upsert(payload);
      } else if (method === 'delete') {
        result = await supabase.from(table).delete().eq('id', payload.id);
      } else {
        return res.status(400).json({ error: 'Método inválido' });
      }

      if (result.error) throw result.error;
      return res.status(200).json({ data: result.data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: 'Acción inválida' });
}
