/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control',        value: 'on' },
  { key: 'X-Frame-Options',               value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options',        value: 'nosniff' },
  { key: 'Referrer-Policy',               value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',            value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",   // unsafe-eval needed by Next.js dev
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      "img-src 'self' data: blob: https://*.supabase.co https://*.suno.ai https://*.suno.co https://www.google.com https://*.gstatic.com https://*.steamstatic.com https://*.akamaihd.net",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.suno.ai https://*.suno.co wss://*.suno.ai https://*.workers.dev",
      "media-src 'self' https://*.suno.ai https://*.suno.co https://*.supabase.co https://catbox.moe https://*.catbox.moe blob: data:",

      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig = {
  // Strip console.* in production bundles (keep error/warn for observability).
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'community.akamai.steamstatic.com' },
      { protocol: 'https', hostname: 'community.cloudflare.steamstatic.com' },
      { protocol: 'https', hostname: '*.steamstatic.com' },
      { protocol: 'https', hostname: '*.akamaihd.net' },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Per-icon/function imports instead of pulling whole libraries into each chunk.
    optimizePackageImports: ['lucide-react', 'date-fns'],
    serverComponentsExternalPackages: ['ioredis', 'ssh2', 'sqlite3', 'fluent-ffmpeg', '@ffmpeg-installer/ffmpeg', '@higgsfield/cli'],
    outputFileTracingIncludes: {
      '/api/**/*': ['./node_modules/@higgsfield/cli/**/*']
    }
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ]
      }
    ]
  },
}

module.exports = nextConfig
