/**
 * Cloudflare Worker — R2 upload/download proxy for bazzar-apps bucket.
 * 
 * Routes:
 *   PUT  /ipa/{appId}/{filename}  — upload IPA (requires X-Upload-Token header)
 *   GET  /ipa/{appId}/{filename}  — download IPA (public)
 *   DELETE /ipa/{appId}/{filename} — delete IPA (requires X-Upload-Token)
 * 
 * Environment bindings (set in wrangler.toml):
 *   BUCKET — R2 bucket binding (bazzar-apps)
 *   UPLOAD_SECRET — secret token for upload auth
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const key = decodeURIComponent(url.pathname.slice(1)) // remove leading /

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Upload-Token',
    }

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (!key) {
      return new Response(JSON.stringify({ error: 'No key specified' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Auth check for writes
    if (request.method === 'PUT' || request.method === 'DELETE') {
      const token = request.headers.get('X-Upload-Token')
      if (!token || token !== env.UPLOAD_SECRET) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }
    }

    try {
      // UPLOAD
      if (request.method === 'PUT') {
        await env.BUCKET.put(key, request.body, {
          httpMetadata: {
            contentType: request.headers.get('Content-Type') || 'application/octet-stream',
          },
        })
        return new Response(JSON.stringify({ success: true, key }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      // DOWNLOAD
      if (request.method === 'GET') {
        const obj = await env.BUCKET.get(key)
        if (!obj) {
          return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          })
        }

        const headers = new Headers(corsHeaders)
        headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/octet-stream')
        if (obj.size) headers.set('Content-Length', obj.size.toString())
        headers.set('Cache-Control', 'public, max-age=86400') // 24h cache
        
        // Set filename for download
        const filename = key.split('/').pop() || 'file'
        headers.set('Content-Disposition', `attachment; filename="${filename}"`)

        return new Response(obj.body, { headers })
      }

      // DELETE
      if (request.method === 'DELETE') {
        await env.BUCKET.delete(key)
        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      return new Response('Method not allowed', { status: 405, headers: corsHeaders })
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }
  },
}
