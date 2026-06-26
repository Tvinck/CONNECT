import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // The iPhone sends a PKCS#7 signed message in the body
    const buffer = await req.arrayBuffer();
    // Convert the buffer to a string (it will contain some binary garbage, but the XML is in plain text)
    const rawData = new TextDecoder('utf-8', { fatal: false }).decode(buffer);

    // Extract the XML part
    const match = rawData.match(/<key>UDID<\/key>\s*<string>([^<]+)<\/string>/);
    const udid = match ? match[1] : null;

    // Optional: Extract IMEI or other attributes if needed
    const imeiMatch = rawData.match(/<key>IMEI<\/key>\s*<string>([^<]+)<\/string>/);
    const imei = imeiMatch ? imeiMatch[1] : null;
    
    const productMatch = rawData.match(/<key>PRODUCT<\/key>\s*<string>([^<]+)<\/string>/);
    const product = productMatch ? productMatch[1] : null;

    if (!udid) {
      console.error('Failed to extract UDID from payload:', rawData);
      return new NextResponse('Failed to extract UDID', { status: 400 });
    }

    console.log(`Successfully extracted UDID: ${udid}, Product: ${product}`);

    // Bazzar Market URL
    const marketUrl = process.env.NEXT_PUBLIC_MARKET_URL || 'https://bazzar-serts.vercel.app';
    
    // Redirect the user back to the market with their UDID
    // Safari will follow this 301 redirect automatically
    const redirectUrl = `${marketUrl}/auth?udid=${encodeURIComponent(udid)}&model=${encodeURIComponent(product || '')}`;

    return NextResponse.redirect(redirectUrl, 301);

  } catch (error) {
    console.error('Error processing UDID payload:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
