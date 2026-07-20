import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Use the canonical URL for the receive endpoint.
  // On Vercel, req.headers.get('host') may return the internal hostname,
  // so we use the production URL explicitly, with localhost fallback for dev.
  const host = req.headers.get('host') || 'localhost:3000';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  
  // Always use the production domain for the callback URL,
  // because iOS will POST to this URL from the device (not from the browser).
  const receiveUrl = isLocal
    ? `http://${host}/api/udid/receive`
    : `https://connect-4va6.vercel.app/api/udid/receive`;

  // Apple OTA Profile Service — correct structure per Apple documentation.
  // IMPORTANT: The XML must have NO leading whitespace before <?xml ...>
  // otherwise iOS will reject it as invalid.
  const mobileConfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <dict>
        <key>URL</key>
        <string>${receiveUrl}</string>
        <key>DeviceAttributes</key>
        <array>
            <string>UDID</string>
            <string>IMEI</string>
            <string>ICCID</string>
            <string>VERSION</string>
            <string>PRODUCT</string>
            <string>SERIAL</string>
            <string>MAC_ADDRESS_EN0</string>
        </array>
    </dict>
    <key>PayloadOrganization</key>
    <string>Bazzar Certs</string>
    <key>PayloadDisplayName</key>
    <string>Bazzar Certs — UDID</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
    <key>PayloadUUID</key>
    <string>9F025114-16CA-4AE1-B0E3-F5E5170B1E6E</string>
    <key>PayloadIdentifier</key>
    <string>com.bazzar.certs.enroll</string>
    <key>PayloadDescription</key>
    <string>Этот профиль нужен для получения UDID вашего устройства. Он будет автоматически удалён после установки.</string>
    <key>PayloadType</key>
    <string>Profile Service</string>
</dict>
</plist>`;

  return new NextResponse(mobileConfig.trim(), {
    status: 200,
    headers: {
      'Content-Type': 'application/x-apple-aspen-config; charset=utf-8',
      'Content-Disposition': 'attachment; filename="bazzar-enroll.mobileconfig"',
    },
  });
}
