/**
 * Cloudflare R2 client — S3-compatible object storage.
 * Used for IPA files, icons, and other assets.
 * 
 * Env vars:
 *  R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const accountId = process.env.R2_ACCOUNT_ID!
const accessKeyId = process.env.R2_ACCESS_KEY_ID!
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!
const bucket = process.env.R2_BUCKET || 'bazzar-apps'

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
  forcePathStyle: true, // R2 requires path-style: endpoint/bucket/key (not bucket.endpoint/key)
})

/** Generate a presigned URL for uploading a file to R2. */
export async function getUploadUrl(key: string, contentType: string, expiresIn = 3600): Promise<string> {
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType })
  return getSignedUrl(r2, command, { expiresIn })
}

/** Generate a presigned URL for downloading a file from R2. */
export async function getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key })
  return getSignedUrl(r2, command, { expiresIn })
}

/** Upload a buffer directly to R2. */
export async function uploadFile(key: string, body: Buffer | Uint8Array, contentType: string) {
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType })
  return r2.send(command)
}

/** Delete a file from R2. */
export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({ Bucket: bucket, Key: key })
  return r2.send(command)
}

/** List files in R2 with optional prefix. */
export async function listFiles(prefix?: string, maxKeys = 100) {
  const command = new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, MaxKeys: maxKeys })
  const result = await r2.send(command)
  return (result.Contents || []).map(obj => ({
    key: obj.Key!,
    size: obj.Size || 0,
    lastModified: obj.LastModified?.toISOString(),
  }))
}
