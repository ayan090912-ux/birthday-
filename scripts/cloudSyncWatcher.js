import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import * as mm from 'music-metadata'

export const SUPPORTED_EXTS = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'])

const MIME_MAP = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac'
}

/**
 * Clean filename into a human-readable title
 */
export function cleanFilename(filename) {
  const ext = path.extname(filename)
  let base = path.basename(filename, ext)
  base = base.replace(/_spotdown\.org/gi, '')
  base = base.replace(/\s*-\s*spotdown\.org/gi, '')
  base = base.replace(/[\(\[\{].*?(official|audio|video|lyrics|remastered|version).*?[\)\]\}]/gi, '')
  base = base.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim()
  return base || 'Untitled Track'
}

/**
 * Load AWS Credentials from environment or ~/.aws/credentials
 */
export function getAwsCredentials() {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    return {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'ap-south-1',
      bucket: process.env.AWS_S3_BUCKET || 'anshika-birthday-music-vault'
    }
  }

  const iniPath = path.join(os.homedir(), '.aws', 'credentials')
  if (fs.existsSync(iniPath)) {
    const content = fs.readFileSync(iniPath, 'utf8')
    let id = '', secret = ''
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith('aws_access_key_id') && !id) {
        id = trimmed.split('=')[1]?.trim()
      }
      if (trimmed.startsWith('aws_secret_access_key') && !secret) {
        secret = trimmed.split('=')[1]?.trim()
      }
    }
    if (id && secret) {
      return {
        accessKeyId: id,
        secretAccessKey: secret,
        region: process.env.AWS_REGION || 'ap-south-1',
        bucket: process.env.AWS_S3_BUCKET || 'anshika-birthday-music-vault'
      }
    }
  }

  throw new Error('Could not find AWS credentials in environment or ~/.aws/credentials')
}

/**
 * Calculate MD5 hash of a local file
 */
function getFileMd5(filePath) {
  const buffer = fs.readFileSync(filePath)
  return crypto.createHash('md5').update(buffer).digest('hex')
}

/**
 * Load sync state from .sync-state.json
 */
function loadSyncState(projectRoot) {
  const statePath = path.join(projectRoot, '.sync-state.json')
  if (fs.existsSync(statePath)) {
    try {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'))
    } catch {
      return { syncedFiles: {} }
    }
  }
  return { syncedFiles: {} }
}

/**
 * Save sync state to .sync-state.json
 */
function saveSyncState(projectRoot, state) {
  const statePath = path.join(projectRoot, '.sync-state.json')
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8')
}

/**
 * Retry helper with exponential backoff
 */
async function withRetry(fn, retries = 3, delayMs = 1000) {
  let attempt = 0
  while (attempt < retries) {
    try {
      return await fn()
    } catch (err) {
      attempt++
      if (attempt >= retries) throw err
      console.warn(`[cloud-sync] Upload attempt ${attempt} failed: ${err.message}. Retrying in ${delayMs * attempt}ms...`)
      await new Promise(r => setTimeout(r, delayMs * attempt))
    }
  }
}

/**
 * Main Sync Engine
 */
export async function syncMusicToCloud(projectRoot = process.cwd(), options = {}) {
  const { verbose = true } = options
  const creds = getAwsCredentials()
  const s3 = new S3Client({
    region: creds.region,
    credentials: {
      accessKeyId: creds.accessKeyId,
      secretAccessKey: creds.secretAccessKey
    }
  })

  const musicDir = path.join(projectRoot, 'public', 'music')
  const coversDir = path.join(musicDir, '.covers')
  const localManifestPath = path.join(projectRoot, 'public', 'music-manifest.json')

  if (!fs.existsSync(musicDir)) fs.mkdirSync(musicDir, { recursive: true })
  if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true })

  const state = loadSyncState(projectRoot)
  if (!state.syncedFiles) state.syncedFiles = {}
  state.bucket = creds.bucket
  state.region = creds.region

  const s3BaseUrl = `https://${creds.bucket}.s3.${creds.region}.amazonaws.com`

  // 1. Discover all local audio files
  const allEntries = fs.readdirSync(musicDir)
  const audioFiles = allEntries.filter(entry => {
    if (entry.startsWith('.')) return false
    const fullPath = path.join(musicDir, entry)
    try {
      if (!fs.statSync(fullPath).isFile()) return false
    } catch {
      return false
    }
    const ext = path.extname(entry).toLowerCase()
    return SUPPORTED_EXTS.has(ext)
  })

  // Sort alphabetically
  audioFiles.sort((a, b) => a.localeCompare(undefined, { numeric: true, sensitivity: 'base' }))

  const tracks = []
  let uploadCount = 0

  for (let i = 0; i < audioFiles.length; i++) {
    const filename = audioFiles[i]
    const fullPath = path.join(musicDir, filename)
    const ext = path.extname(filename).toLowerCase()
    const mimeType = MIME_MAP[ext] || 'audio/mpeg'
    const safeId = `track-${i + 1}-${filename.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`
    const md5Hash = getFileMd5(fullPath)

    let trackInfo = state.syncedFiles[filename]
    const needsUpload = !trackInfo || trackInfo.hash !== md5Hash

    let title = cleanFilename(filename)
    let artist = 'Curated for Anshika'
    let duration = 0
    let coverFilename = null

    try {
      const metadata = await mm.parseFile(fullPath)
      if (metadata.common) {
        if (metadata.common.title && metadata.common.title.trim()) {
          title = metadata.common.title.trim()
        }
        if (metadata.common.artist && metadata.common.artist.trim()) {
          artist = metadata.common.artist.trim()
        }
        if (metadata.common.picture && metadata.common.picture.length > 0) {
          const pic = metadata.common.picture[0]
          coverFilename = `${safeId}.jpg`
          const localCoverPath = path.join(coversDir, coverFilename)
          if (!fs.existsSync(localCoverPath)) {
            fs.writeFileSync(localCoverPath, pic.data)
          }

          // Upload cover image to S3 if not yet uploaded
          const s3CoverKey = `music/.covers/${coverFilename}`
          try {
            await s3.send(new HeadObjectCommand({ Bucket: creds.bucket, Key: s3CoverKey }))
          } catch {
            await withRetry(async () => {
              await s3.send(new PutObjectCommand({
                Bucket: creds.bucket,
                Key: s3CoverKey,
                Body: pic.data,
                ContentType: 'image/jpeg',
                CacheControl: 'public, max-age=31536000, immutable'
              }))
            })
          }
        }
      }
      if (metadata.format && metadata.format.duration) {
        duration = Math.round(metadata.format.duration)
      }
    } catch (err) {
      if (verbose) console.warn(`[cloud-sync] Metadata error for ${filename}:`, err.message)
    }

    const s3AudioKey = `music/${filename}`
    const remoteAudioUrl = `${s3BaseUrl}/${encodeURI(s3AudioKey)}`
    const remoteCoverUrl = coverFilename 
      ? `${s3BaseUrl}/music/.covers/${coverFilename}`
      : '/shrine-clean.jpg'

    if (needsUpload) {
      if (verbose) console.log(`[cloud-sync] Uploading ${filename} to S3 (${(fs.statSync(fullPath).size / 1024 / 1024).toFixed(2)} MB)...`)
      
      const fileStream = fs.createReadStream(fullPath)
      await withRetry(async () => {
        await s3.send(new PutObjectCommand({
          Bucket: creds.bucket,
          Key: s3AudioKey,
          Body: fs.readFileSync(fullPath),
          ContentType: mimeType,
          CacheControl: 'public, max-age=31536000, immutable'
        }))
      })

      uploadCount++
      state.syncedFiles[filename] = {
        hash: md5Hash,
        s3Key: s3AudioKey,
        url: remoteAudioUrl,
        coverUrl: remoteCoverUrl,
        title,
        artist,
        duration,
        uploadedAt: new Date().toISOString()
      }
      saveSyncState(projectRoot, state)
      if (verbose) console.log(`[cloud-sync] Successfully uploaded ${filename}`)
    }

    tracks.push({
      id: safeId,
      title,
      artist,
      url: remoteAudioUrl,
      localUrl: `/music/${encodeURIComponent(filename).replace(/%20/g, ' ')}`,
      duration,
      thumbnailUrl: remoteCoverUrl,
      filename,
      format: ext.replace('.', '').toUpperCase()
    })
  }

  // 2. Clean up removed files from state
  const currentFilenames = new Set(audioFiles)
  for (const storedFile of Object.keys(state.syncedFiles)) {
    if (!currentFilenames.has(storedFile)) {
      if (verbose) console.log(`[cloud-sync] File removed locally: ${storedFile}. Removing from manifest.`)
      delete state.syncedFiles[storedFile]
    }
  }

  // 3. Generate production manifest
  const manifest = {
    generatedAt: new Date().toISOString(),
    totalTracks: tracks.length,
    bucket: creds.bucket,
    region: creds.region,
    baseUrl: s3BaseUrl,
    tracks
  }

  // Write local copy
  fs.writeFileSync(localManifestPath, JSON.stringify(manifest, null, 2), 'utf8')

  // Upload manifest to S3 root
  if (verbose) console.log(`[cloud-sync] Updating remote music-manifest.json on S3 (${tracks.length} tracks)...`)
  await withRetry(async () => {
    await s3.send(new PutObjectCommand({
      Bucket: creds.bucket,
      Key: 'music-manifest.json',
      Body: JSON.stringify(manifest, null, 2),
      ContentType: 'application/json',
      CacheControl: 'no-cache, no-store, must-revalidate'
    }))
  })

  state.lastSyncedAt = new Date().toISOString()
  saveSyncState(projectRoot, state)

  if (verbose) {
    console.log(`[cloud-sync] Sync complete! ${uploadCount} uploaded, ${tracks.length} total tracks in cloud playlist.`)
    console.log(`[cloud-sync] Live Cloud Manifest URL: ${s3BaseUrl}/music-manifest.json`)
  }

  return manifest
}

/**
 * Continuous Watcher Mode
 */
export async function startWatcher(projectRoot = process.cwd()) {
  console.log('🌸 [cloud-sync-watcher] Starting Anshika Birthday Cloud Music Sync Service...')
  
  // Initial sync catchup on launch
  try {
    await syncMusicToCloud(projectRoot, { verbose: true })
  } catch (err) {
    console.error('[cloud-sync-watcher] Initial sync error:', err.message)
  }

  const musicDir = path.join(projectRoot, 'public', 'music')
  let isSyncing = false
  let debounceTimer = null

  const triggerSync = (filename, eventType) => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(async () => {
      if (isSyncing) return
      isSyncing = true
      try {
        console.log(`[cloud-sync-watcher] File ${eventType}: ${filename}. Triggering cloud sync...`)
        // Wait a small delay to make sure file writing is completed
        await new Promise(r => setTimeout(r, 600))
        await syncMusicToCloud(projectRoot, { verbose: true })
      } catch (err) {
        console.error('[cloud-sync-watcher] Watcher sync error:', err.message)
      } finally {
        isSyncing = false
      }
    }, 800)
  }

  fs.watch(musicDir, (eventType, filename) => {
    if (!filename || filename.startsWith('.') || filename.includes('.covers')) return
    const ext = path.extname(filename).toLowerCase()
    if (SUPPORTED_EXTS.has(ext)) {
      triggerSync(filename, eventType)
    }
  })

  console.log(`🌸 [cloud-sync-watcher] Watching ${musicDir} for changes. Ready!`)
}

// Execution entry point
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  const isWatch = process.argv.includes('--watch')
  if (isWatch) {
    startWatcher()
  } else {
    syncMusicToCloud().then(() => {
      console.log('Single sync run finished.')
    }).catch(err => {
      console.error('Sync failed:', err)
      process.exit(1)
    })
  }
}
