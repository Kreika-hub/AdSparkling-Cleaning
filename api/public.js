import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS restringido por variable de entorno
  const origin = req.headers.origin;
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
  if (allowedOriginsEnv && origin) {
    const allowedList = allowedOriginsEnv.split(',').map(o => o.trim()).filter(Boolean);
    if (allowedList.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'server misconfigured' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (req.method === 'POST') {
    const body = req.body || {};

    // 1. Campo trampa (honeypot): si viene lleno, es un bot -> responder 200 sin guardar
    if (body.website) {
      return res.status(200).json({ success: true });
    }

    // 2. Validación de campos obligatorios y límites
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const phone = rawPhone.replace(/[^\d+()\s-]/g, '');

    if (!name || name.length < 2 || name.length > 100) {
      return res.status(400).json({ error: 'Nombre inválido (máx 100 caracteres)' });
    }
    if (!phone || phone.length < 7 || phone.length > 20) {
      return res.status(400).json({ error: 'Teléfono inválido (debe tener entre 7 y 20 caracteres)' });
    }

    const address = typeof body.address === 'string' && body.address.trim() ? body.address.trim().slice(0, 300) : null;
    const size_sqft = (body.size_sqft && !isNaN(parseInt(body.size_sqft, 10)) && parseInt(body.size_sqft, 10) > 0 && parseInt(body.size_sqft, 10) < 100000)
      ? parseInt(body.size_sqft, 10)
      : null;
    const frequency = typeof body.frequency === 'string' && body.frequency.trim() ? body.frequency.trim().slice(0, 50) : null;

    let notes = typeof body.notes === 'string' ? body.notes.trim() : '';
    if (body.service_type && typeof body.service_type === 'string' && !notes.includes(body.service_type)) {
      notes = `[Servicio: ${body.service_type.trim()}] ${notes}`.trim();
    }
    notes = notes ? notes.slice(0, 1000) : null;

    const source = typeof body.source === 'string' && body.source.trim() ? body.source.trim().slice(0, 50) : 'website';
    const referral_code = typeof body.referral_code === 'string' && body.referral_code.trim() ? body.referral_code.trim().slice(0, 50) : null;

    // Solo columnas oficiales de la tabla leads en supabase-schema.sql
    // Forzando status='nuevo', ignorando id y created_at del cliente
    const leadRecord = {
      name,
      phone,
      address,
      size_sqft,
      frequency,
      notes,
      status: 'nuevo',
      source,
      referral_code
    };

    try {
      const { error } = await supabase.from('leads').insert([leadRecord]);
      if (error) {
        console.error('Error insertando lead en Supabase:', error);
        return res.status(500).json({ error: 'Error al registrar solicitud' });
      }
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Public POST unhandled error:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
  }

  if (req.method === 'GET') {
    try {
      // Solo las columnas que muestra la landing (rating, comment, photo_url, client_name)
      // Sin client_phone ni datos sensibles
      const { data, error } = await supabase
        .from('reviews')
        .select('rating, comment, photo_url, client_name')
        .eq('status', 'publicada');

      if (error) {
        console.error('Error obteniendo reseñas:', error);
        return res.status(500).json({ error: 'Error al obtener testimonios' });
      }
      return res.status(200).json({ data: data || [] });
    } catch (err) {
      console.error('Public GET unhandled error:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
