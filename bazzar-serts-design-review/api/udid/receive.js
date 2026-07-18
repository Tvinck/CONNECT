export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    // Read the raw body
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    const rawData = buffer.toString('utf-8');

    // Extract the XML part using regex
    const match = rawData.match(/<key>UDID<\/key>\s*<string>([^<]+)<\/string>/);
    const udid = match ? match[1] : null;

    const productMatch = rawData.match(/<key>PRODUCT<\/key>\s*<string>([^<]+)<\/string>/);
    const product = productMatch ? productMatch[1] : null;

    if (!udid) {
      console.error('Failed to extract UDID from payload:', rawData);
      return res.status(400).send('Failed to extract UDID');
    }

    // Get host dynamically to redirect back to the app itself
    const host = req.headers.host || 'bazzar-serts.shop';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const marketUrl = `${protocol}://${host}`;
    
    const redirectUrl = `${marketUrl}/auth?udid=${encodeURIComponent(udid)}&model=${encodeURIComponent(product || '')}`;

    // 301 Redirect to the Auth page
    res.writeHead(302, { Location: redirectUrl });
    res.end();

  } catch (error) {
    console.error('Error processing UDID payload:', error);
    res.status(500).send('Internal Server Error');
  }
}
