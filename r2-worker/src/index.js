/**
 * Cloudflare Worker — R2 upload/download proxy for bazzar-apps bucket.
 * 
 * Routes:
 *   GET    /ipa/{appId}/{filename}           — download IPA (public)
 *   PUT    /ipa/{appId}/{filename}           — upload small file (<95MB, requires X-Upload-Token)
 *   DELETE /ipa/{appId}/{filename}           — delete IPA (requires X-Upload-Token)
 *   POST   /multipart/create                — start multipart upload
 *   PUT    /multipart/part                   — upload a part
 *   POST   /multipart/complete              — complete multipart upload
 *   POST   /multipart/abort                 — abort multipart upload
 */

const CHUNK_MIN = 5 * 1024 * 1024 // R2 minimum part size = 5MB (except last part)

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const path = url.pathname

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Upload-Token',
    }

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    // Auth check helper
    const checkAuth = () => {
      const token = request.headers.get('X-Upload-Token')
      return token && token === env.UPLOAD_SECRET
    }

    try {
      // ── Multipart Upload Routes ──
      
      // POST /multipart/create — start multipart upload
      if (path === '/multipart/create' && request.method === 'POST') {
        if (!checkAuth()) return jsonResp({ error: 'Unauthorized' }, 401, corsHeaders)
        
        const { key } = await request.json()
        if (!key) return jsonResp({ error: 'key required' }, 400, corsHeaders)
        
        const mpu = await env.BUCKET.createMultipartUpload(key, {
          httpMetadata: { contentType: 'application/octet-stream' },
        })
        
        return jsonResp({ uploadId: mpu.uploadId, key }, 200, corsHeaders)
      }

      // PUT /multipart/part — upload a single part
      if (path === '/multipart/part' && request.method === 'PUT') {
        if (!checkAuth()) return jsonResp({ error: 'Unauthorized' }, 401, corsHeaders)
        
        const uploadId = url.searchParams.get('uploadId')
        const partNumber = parseInt(url.searchParams.get('partNumber'))
        const key = url.searchParams.get('key')
        
        if (!uploadId || !partNumber || !key) {
          return jsonResp({ error: 'uploadId, partNumber, key required' }, 400, corsHeaders)
        }
        
        const mpu = env.BUCKET.resumeMultipartUpload(key, uploadId)
        const part = await mpu.uploadPart(partNumber, request.body)
        
        return jsonResp({ partNumber: part.partNumber, etag: part.etag }, 200, corsHeaders)
      }

      // POST /multipart/complete — finalize multipart upload
      if (path === '/multipart/complete' && request.method === 'POST') {
        if (!checkAuth()) return jsonResp({ error: 'Unauthorized' }, 401, corsHeaders)
        
        const { uploadId, key, parts } = await request.json()
        if (!uploadId || !key || !parts?.length) {
          return jsonResp({ error: 'uploadId, key, parts[] required' }, 400, corsHeaders)
        }
        
        const mpu = env.BUCKET.resumeMultipartUpload(key, uploadId)
        await mpu.complete(parts)
        
        return jsonResp({ success: true, key }, 200, corsHeaders)
      }

      // POST /multipart/abort — cancel multipart upload
      if (path === '/multipart/abort' && request.method === 'POST') {
        if (!checkAuth()) return jsonResp({ error: 'Unauthorized' }, 401, corsHeaders)
        
        const { uploadId, key } = await request.json()
        if (!uploadId || !key) {
          return jsonResp({ error: 'uploadId, key required' }, 400, corsHeaders)
        }
        
        const mpu = env.BUCKET.resumeMultipartUpload(key, uploadId)
        await mpu.abort()
        
        return jsonResp({ success: true }, 200, corsHeaders)
      }

      // ── Standard Routes ──
      const key = decodeURIComponent(path.slice(1)) // remove leading /

      if (!key) {
        return jsonResp({ error: 'No key specified' }, 400, corsHeaders)
      }

      // Auth for writes
      if (request.method === 'PUT' || request.method === 'DELETE') {
        if (!checkAuth()) return jsonResp({ error: 'Unauthorized' }, 401, corsHeaders)
      }

      // UPLOAD (small files < 95MB)
      if (request.method === 'PUT') {
        await env.BUCKET.put(key, request.body, {
          httpMetadata: {
            contentType: request.headers.get('Content-Type') || 'application/octet-stream',
          },
        })
        return jsonResp({ success: true, key }, 200, corsHeaders)
      }

      // DOWNLOAD
      if (request.method === 'GET') {
        const obj = await env.BUCKET.get(key)
        if (!obj) {
          return jsonResp({ error: 'Not found' }, 404, corsHeaders)
        }

        const headers = new Headers(corsHeaders)
        headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/octet-stream')
        if (obj.size) headers.set('Content-Length', obj.size.toString())
        headers.set('Cache-Control', 'public, max-age=86400')
        
        const filename = key.split('/').pop() || 'file'
        headers.set('Content-Disposition', `attachment; filename="${filename}"`)

        return new Response(obj.body, { headers })
      }

      // HEAD (check file exists)
      if (request.method === 'HEAD') {
        const obj = await env.BUCKET.head(key)
        if (!obj) {
          return new Response(null, { status: 404, headers: corsHeaders })
        }
        const headers = new Headers(corsHeaders)
        headers.set('Content-Length', (obj.size || 0).toString())
        headers.set('Content-Type', obj.httpMetadata?.contentType || 'application/octet-stream')
        return new Response(null, { status: 200, headers })
      }

      // DELETE
      if (request.method === 'DELETE') {
        await env.BUCKET.delete(key)
        return jsonResp({ success: true }, 200, corsHeaders)
      }

      return new Response('Method not allowed', { status: 405, headers: corsHeaders })
    } catch (err) {
      return jsonResp({ error: err.message }, 500, corsHeaders)
    }
  },
}

function jsonResp(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })
}
