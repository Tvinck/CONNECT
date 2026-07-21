import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') || 'localhost:3000';
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

  // Always use the production domain for the callback URL,
  // because iOS will POST to this URL from the device (not from the browser).
  const receiveUrl = isLocal
    ? `http://${host}/api/udid/receive`
    : `https://connect-4va6.vercel.app/api/udid/receive`;

  // Apple OTA Profile Service enrollment profile.
  // CRITICAL: Do NOT request IMEI/ICCID — iOS 15+ rejects profiles that request these.
  // Use array.join('\n') to guarantee LF-only line endings (no CRLF).
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    '<dict>',
    '  <key>PayloadContent</key>',
    '  <dict>',
    '    <key>URL</key>',
    `    <string>${receiveUrl}</string>`,
    '    <key>DeviceAttributes</key>',
    '    <array>',
    '      <string>UDID</string>',
    '      <string>VERSION</string>',
    '      <string>PRODUCT</string>',
    '    </array>',
    '  </dict>',
    '  <key>PayloadOrganization</key>',
    '  <string>Bazzar Certs</string>',
    '  <key>PayloadDisplayName</key>',
    '  <string>Bazzar Certs</string>',
    '  <key>PayloadVersion</key>',
    '  <integer>1</integer>',
    '  <key>PayloadUUID</key>',
    '  <string>9F025114-16CA-4AE1-B0E3-F5E5170B1E6E</string>',
    '  <key>PayloadIdentifier</key>',
    '  <string>com.bazzar.certs.enroll</string>',
    '  <key>PayloadDescription</key>',
    '  <string>This temporary profile is used to find the UDID of your device. It can be removed after installation.</string>',
    '  <key>PayloadType</key>',
    '  <string>Profile Service</string>',
    '</dict>',
    '</plist>',
  ].join('\n');

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/x-apple-aspen-config; charset=utf-8',
      'Content-Disposition': 'attachment; filename="bazzar-enroll.mobileconfig"',
    },
  });
}
