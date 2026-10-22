import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const SUPPORTED_EXTS = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'])

/**
 * Clean a filename into a readable song title
 */
export function cleanFilename(filename) {
  const ext = path.extname(filename)
  let base = path.basename(filename, ext)
  // Remove common downloader tags
  base = base.replace(/_spotdown\.org/gi, '')
  base = base.replace(/\s*-\s*spotdown\.org/gi, '')
  base = base.replace(/[\(\[\{].*?(official|audio|video|lyrics|remastered|version).*?[\)\]\}]/gi, '')
  // Replace underscores and clean spaces
  base = base.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim()
  return base || 'Untitled Track'
}

/**
 * Scan public/music/ and generate music-manifest.json
 */
export async function scanMusicFolder(projectRoot = process.cwd()) {
  const mm = await import('music-metadata')
  const musicDir = path.join(projectRoot, 'public', 'music')
  const coversDir = path.join(musicDir, '.covers')
  const manifestPath = path.join(projectRoot, 'public', 'music-manifest.json')

  if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir, { recursive: true })
  }
  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true })
  }

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

  // Sort files alphabetically for stable playlist ordering
  audioFiles.sort((a, b) => a.localeCompare(undefined, { numeric: true, sensitivity: 'base' }))

  const tracks = []

  for (let i = 0; i < audioFiles.length; i++) {
    const filename = audioFiles[i]
    const fullPath = path.join(musicDir, filename)
    const ext = path.extname(filename).toLowerCase()
    const safeId = `track-${i + 1}-${filename.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`

    let title = cleanFilename(filename)
    let artist = ''
    let duration = 0
    let thumbnailUrl = '/shrine-clean.jpg'

    try {
      const metadata = await mm.parseFile(fullPath)
      if (metadata.common) {
        if (metadata.common.title && metadata.common.title.trim()) {
          title = metadata.common.title.trim()
        }
        if (metadata.common.artist && metadata.common.artist.trim()) {
          artist = metadata.common.artist.trim()
        }
        // Extract embedded album artwork if available
        if (metadata.common.picture && metadata.common.picture.length > 0) {
          const pic = metadata.common.picture[0]
          const coverFilename = `${safeId}.jpg`
          const coverPath = path.join(coversDir, coverFilename)
          if (!fs.existsSync(coverPath)) {
            try {
              fs.writeFileSync(coverPath, pic.data)
            } catch (err) {
              console.warn(`[music-scan] Could not write cover for ${filename}:`, err.message)
            }
          }
          thumbnailUrl = `/music/.covers/${coverFilename}`
        }
      }
      if (metadata.format && metadata.format.duration) {
        duration = Math.round(metadata.format.duration)
      }
    } catch (err) {
      console.warn(`[music-scan] Metadata parse error for ${filename}, using filename fallback:`, err.message)
    }

    const S3_BASE_URL = 'https://anshika-birthday-music-vault.s3.ap-south-1.amazonaws.com'
    const s3Url = `${S3_BASE_URL}/music/${encodeURIComponent(filename).replace(/%20/g, ' ')}`
    const localUrl = `/music/${encodeURIComponent(filename).replace(/%20/g, ' ')}`

    tracks.push({
      id: safeId,
      title,
      artist: artist || 'Curated for Anshika',
      url: s3Url,
      localUrl,
      duration,
      thumbnailUrl: thumbnailUrl.startsWith('/music/.covers/') ? `${S3_BASE_URL}${thumbnailUrl}` : thumbnailUrl,
      filename,
      format: ext.replace('.', '').toUpperCase()
    })
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    totalTracks: tracks.length,
    tracks
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
  console.log(`[music-scan] Generated manifest with ${tracks.length} songs at ${manifestPath}`)

  return manifest
}

// Standalone execution support
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  scanMusicFolder().then(manifest => {
    console.log(`Successfully scanned ${manifest.totalTracks} audio tracks.`)
  }).catch(err => {
    console.error('Scan error:', err)
    process.exit(1)
  })
}
