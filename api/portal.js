import { createClient } from '@supabase/supabase-js';

function normalizePhone(rawPhone) {
  if (!rawPhone) return null;
  let digits = String(rawPhone).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    digits = digits.slice(1);
  }
  if (digits.length !== 10) {
    return null;
  }
  return digits;
}

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

  if (req.method === 'GET') {
    const cleanPhone = normalizePhone(req.query.phone);
    if (!cleanPhone) {
      // Exige exactamente 10 dígitos sin consultar la base de datos
      return res.status(200).json({ found: false });
    }

    try {
      const last4 = cleanPhone.slice(-4);
      const { data: candidates, error: clientErr } = await supabase
        .from('clients')
        .select('id, name, address, next_visit, last_visit, frequency, base_price, phone')
        .ilike('phone', `%${last4}%`);
      
      if (clientErr) {
        console.error('Portal clients query error:', clientErr);
        return res.status(500).json({ error: 'Error del servidor' });
      }

      const matchedClients = (candidates || []).filter(c => normalizePhone(c.phone) === cleanPhone);

      // Si no hay exactamente 1 coincidencia exacta, responde found: false
      if (matchedClients.length !== 1) {
        return res.status(200).json({ found: false });
      }

      const client = matchedClients[0];
      
      // Obtener historial de citas
      const { data: appointments, error: apptErr } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', client.id)
        .order('date', { ascending: false });

      if (apptErr) console.error('Portal appts query error:', apptErr);

      // Obtener contrato activo y plan
      const { data: contracts, error: contractErr } = await supabase
        .from('contracts')
        .select('*')
        .eq('client_id', client.id)
        .eq('status', 'activo')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (contractErr) console.error('Portal contracts query error:', contractErr);

      const activeContract = contracts && contracts[0] || null;
      let plan = null;
      if (activeContract && activeContract.plan_id) {
        const { data: planData, error: planErr } = await supabase
          .from('plans')
          .select('*')
          .eq('id', activeContract.plan_id)
          .single();
        if (planErr) console.error('Portal plan query error:', planErr);
        plan = planData || null;
      }

      const today = new Date().toISOString().split('T')[0];
      const todayCleaningInProgress = appointments?.some(a => a.date === today && a.status === 'en_progreso') || false;

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
        plan,
        todayCleaningInProgress
      });
    } catch (err) {
      console.error('Portal GET unhandled error:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { action, phone, contract_id, pdf_base64 } = req.body || {};
      if (action !== 'acceptContract') return res.status(400).json({ error: 'Acción inválida' });
      if (!contract_id || typeof contract_id !== 'string') return res.status(400).json({ error: 'Falta contrato' });

      const cleanPhone = normalizePhone(phone);
      if (!cleanPhone) {
        return res.status(403).json({ error: 'Cliente no encontrado' });
      }

      const last4 = cleanPhone.slice(-4);
      const { data: candidates, error: clientErr } = await supabase
        .from('clients')
        .select('id, phone')
        .ilike('phone', `%${last4}%`);
      
      if (clientErr) {
        console.error('Portal POST client query error:', clientErr);
        return res.status(500).json({ error: 'Error del servidor' });
      }

      const matchedClients = (candidates || []).filter(c => normalizePhone(c.phone) === cleanPhone);
      if (matchedClients.length !== 1) {
        return res.status(403).json({ error: 'Cliente no encontrado' });
      }
      
      const clientId = matchedClients[0].id;

      // Verificar que el contrato pertenezca al cliente
      const { data: contracts, error: contractErr } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contract_id)
        .eq('client_id', clientId);
        
      if (contractErr || !contracts || contracts.length === 0) {
        return res.status(403).json({ error: 'Contrato inválido' });
      }

      const contract = contracts[0];

      // Si ya está aceptado, no sobrescribir ni subir de nuevo
      if (contract.accepted) {
        return res.status(409).json({ error: 'El contrato ya ha sido aceptado previamente' });
      }
      
      if (!pdf_base64 || typeof pdf_base64 !== 'string') {
        return res.status(400).json({ error: 'Falta archivo PDF' });
      }

      const cleanBase64 = pdf_base64.replace(/^data:application\/pdf;base64,/, '').trim();
      let pdfBuffer;
      try {
        pdfBuffer = Buffer.from(cleanBase64, 'base64');
      } catch (e) {
        return res.status(400).json({ error: 'Codificación base64 inválida' });
      }

      if (!pdfBuffer || pdfBuffer.length === 0 || pdfBuffer.length > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'El archivo debe ser menor a 5 MB' });
      }

      if (!pdfBuffer.subarray(0, 4).toString('utf8').startsWith('%PDF')) {
        return res.status(400).json({ error: 'El archivo debe ser un PDF válido' });
      }

      const filePath = `${clientId}/${contract_id}.pdf`;
      
      // Subida sin upsert:true para no sobrescribir
      const { error: uploadError } = await supabase.storage
        .from('contracts')
        .upload(filePath, pdfBuffer, { contentType: 'application/pdf', upsert: false });
        
      if (uploadError) {
        console.error('Portal storage upload error:', uploadError);
        return res.status(500).json({ error: 'Error al almacenar el contrato' });
      }

      const { error: updateError } = await supabase
        .from('contracts')
        .update({ 
          accepted: true, 
          accepted_at: new Date().toISOString(),
          pdf_url: filePath
        })
        .eq('id', contract_id);
        
      if (updateError) {
        console.error('Portal contract update error:', updateError);
        return res.status(500).json({ error: 'Error al actualizar el contrato' });
      }
      
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Portal POST unhandled error:', err);
      return res.status(500).json({ error: 'Error del servidor' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
