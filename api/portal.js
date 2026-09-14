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

  if (req.method === 'GET') {
    const phone = req.query.phone;
    if (!phone) return res.status(400).json({ error: 'Falta el número de teléfono' });
    
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');

    try {
      const { data: clients, error: clientErr } = await supabase
        .from('clients')
        .select('id, name, address, next_visit, last_visit, frequency, base_price')
        .ilike('phone', '%' + cleanPhone.slice(-10) + '%');
      
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

      // Obtener contrato activo y plan
      const { data: contracts } = await supabase
        .from('contracts')
        .select('*')
        .eq('client_id', client.id)
        .eq('status', 'activo')
        .order('created_at', { ascending: false })
        .limit(1);
      
      const activeContract = contracts && contracts[0] || null;
      let plan = null;
      if (activeContract) {
        const { data: planData } = await supabase.from('plans').select('*').eq('id', activeContract.plan_id).single();
        plan = planData;
      }

      return res.status(200).json({
        found: true,
        client: {
           id: client.id,
           name: client.name,
           address: client.address,
           next_visit: client.next_visit,
           last_visit: client.last_visit,
           frequency: client.frequency,
           base_price: client.base_price
        },
        history: appointments || [],
        contract: activeContract,
        plan
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { action, phone, contract_id, pdf_base64 } = req.body;
      if (action !== 'acceptContract') return res.status(400).json({ error: 'Invalid action' });
      
      const cleanPhone = String(phone).replace(/[^0-9]/g, '');
      const { data: clients, error: clientErr } = await supabase
        .from('clients')
        .select('id')
        .ilike('phone', '%' + cleanPhone.slice(-10) + '%');
      
      if (clientErr || !clients || clients.length === 0) {
        return res.status(403).json({ error: 'Cliente no encontrado' });
      }
      
      const clientId = clients[0].id;

      // Verificar que el contrato pertenezca al cliente
      const { data: contracts } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contract_id)
        .eq('client_id', clientId);
        
      if (!contracts || contracts.length === 0) {
        return res.status(403).json({ error: 'Contrato inválido' });
      }
      
      const pdfBuffer = Buffer.from(pdf_base64.replace(/^data:application\/pdf;base64,/, ""), 'base64');
      const filePath = `${clientId}/${contract_id}.pdf`;
      
      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });
        
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('contracts')
        .update({ 
          accepted: true, 
          accepted_at: new Date().toISOString(),
          pdf_url: filePath
        })
        .eq('id', contract_id);
        
      if (updateError) throw updateError;
      
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
