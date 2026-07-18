import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
// MUST use service role key to bypass RLS on `clients` table
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { udid, source, deviceModel } = req.body;
  
  if (!udid) {
    return res.status(400).json({ error: 'udid is required' });
  }

  if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Check if lead already exists for this UDID
    const { data: existingClients } = await supabase
      .from('clients')
      .select('id')
      .like('name', `%${udid.substring(0, 8)}%`);

    if (existingClients && existingClients.length > 0) {
      return res.status(200).json({ success: true, message: 'Lead already exists' });
    }

    const shortUdid = udid.substring(0, 8) + '...';
    const clientName = deviceModel ? `Apple ${deviceModel} (${shortUdid})` : `Устройство (${shortUdid})`;
    const clientSource = source || 'Сайт';

    // Insert into CRM clients
    const { error: insertError } = await supabase.from('clients').insert([{
      name: clientName,
      source: `Bazzar Certs: ${clientSource}`,
      status: 'new',
      created_at: new Date().toISOString()
    }]);

    if (insertError) {
      console.error('Failed to create CRM lead:', insertError);
      return res.status(500).json({ error: 'Database error' });
    }

    return res.status(200).json({ success: true, message: 'Lead created' });

  } catch (err) {
    console.error('CRM Lead Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
