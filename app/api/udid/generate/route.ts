import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Get the host dynamically so it works locally and in production
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  
  // The URL where the iPhone will POST the device info
  const receiveUrl = `${protocol}://${host}/api/udid/receive`;

  // Apple OTA Profile Service — correct structure per Apple documentation.
  // Top-level payload is "Configuration", PayloadContent is an array containing
  // a single "Profile Service" dict with the URL and DeviceAttributes.
  const mobileConfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
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
            <key>PayloadOrganization</key>
            <string>Bazzar Certs</string>
            <key>PayloadDisplayName</key>
            <string>Bazzar Certs UDID</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>PayloadUUID</key>
            <string>A40E6B5E-8FA1-4270-8C3B-3E1D5E900E50</string>
            <key>PayloadIdentifier</key>
            <string>com.bazzar.certs.udid-service</string>
            <key>PayloadDescription</key>
            <string>Этот временный профиль используется для получения UDID вашего устройства. Он будет автоматически удалён.</string>
            <key>PayloadType</key>
            <string>Profile Service</string>
        </dict>
    </array>
    <key>PayloadOrganization</key>
    <string>Bazzar Certs</string>
    <key>PayloadDisplayName</key>
    <string>Регистрация устройства Bazzar Certs</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
    <key>PayloadUUID</key>
    <string>9F025114-16CA-4AE1-B0E3-F5E5170B1E6E</string>
    <key>PayloadIdentifier</key>
    <string>com.bazzar.certs.enroll</string>
    <key>PayloadDescription</key>
    <string>Установите этот профиль для автоматического получения UDID устройства.</string>
    <key>PayloadType</key>
    <string>Configuration</string>
</dict>
</plist>`;

  return new NextResponse(mobileConfig, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-apple-aspen-config; charset=utf-8',
      'Content-Disposition': 'attachment; filename="bazzar-enroll.mobileconfig"',
    },
  });
}
