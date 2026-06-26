import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Get the host dynamically so it works locally and in production
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  
  // The URL where the iPhone will POST the device info
  const receiveUrl = `${protocol}://${host}/api/udid/receive`;

  // The XML Payload for Apple OTA Profile Delivery
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
        </array>
    </dict>
    <key>PayloadOrganization</key>
    <string>Bazzar Market</string>
    <key>PayloadDisplayName</key>
    <string>Регистрация устройства в Bazzar Market</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
    <key>PayloadUUID</key>
    <string>9F025114-16CA-4AE1-B0E3-F5E5170B1E6E</string>
    <key>PayloadIdentifier</key>
    <string>com.bazzar.market.profile-service</string>
    <key>PayloadDescription</key>
    <string>Установите этот профиль, чтобы система могла автоматически получить ваш UDID и авторизовать вас.</string>
    <key>PayloadType</key>
    <string>Profile Service</string>
</dict>
</plist>`;

  // Must return the correct content type for iOS to recognize it as a configuration profile
  return new NextResponse(mobileConfig, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-apple-aspen-config',
      'Content-Disposition': 'attachment; filename="bazzar-market-enroll.mobileconfig"',
    },
  });
}
