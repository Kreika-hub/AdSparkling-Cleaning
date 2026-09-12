import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const phone = req.query.phone;
  if (!phone) {
    return res.status(400).json({ error: 'Falta el número de teléfono' });
  }
  
  const cleanPhone = String(phone).replace(/[^0-9]/g, '');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { data: clients, error: clientErr } = await supabase
      .from('clients')
      .select('id, name, address, next_visit, plan_freq, plan_price, zone')
      .eq('phone', cleanPhone);
    
    if (clientErr) throw clientErr;

    if (!clients || clients.length === 0) {
      return res.status(200).json({ found: false });
    }

    const client = clients[0];
    
    // Obtener historial de citas
    const { data: appointments } = await supabase
      .from('appointments')
      .select('*')
      .eq('client_id', client.id)
      .order('date', { ascending: false });

    return res.status(200).json({
      found: true,
      client: {
         id: client.id,
         name: client.name,
         next_visit: client.next_visit,
         plan_freq: client.plan_freq,
         plan_price: client.plan_price,
         zone: client.zone || client.address
      },
      history: appointments || []
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
