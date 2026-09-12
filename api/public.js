import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  if (req.method === 'POST') {
    try {
      const result = await supabase.from('leads').insert([req.body]);
      if (result.error) throw result.error;
      return res.status(200).json({ success: true, data: result.data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  } 
  
  if (req.method === 'GET') {
    try {
      const result = await supabase.from('reviews').select('*').eq('status', 'publicada');
      if (result.error) throw result.error;
      return res.status(200).json({ data: result.data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
