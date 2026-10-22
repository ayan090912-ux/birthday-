import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { scanMusicFolder, SUPPORTED_EXTS } from './scripts/scanMusic.js'

function autoMusicPlaylistPlugin(): Plugin {
  let isScanning = false
  let scanTimer: any = null

  const triggerScan = async (server?: any, reason?: string) => {
    if (isScanning) return
    isScanning = true
    try {
      if (reason) console.log(`[auto-music-playlist] ${reason}`)
      const manifest = await scanMusicFolder(process.cwd())
      if (server && server.ws) {
        server.ws.send({
          type: 'custom',
          event: 'music-playlist-updated',
          data: manifest
        })
      }
    } catch (err: any) {
      console.error('[auto-music-playlist] Scan error:', err.message)
    } finally {
      isScanning = false
    }
  }

  const debouncedScan = (server: any, reason: string) => {
    if (scanTimer) clearTimeout(scanTimer)
    scanTimer = setTimeout(() => {
      triggerScan(server, reason)
    }, 250)
  }

  return {
    name: 'vite-plugin-auto-music-playlist',

    // Build time: generate the music manifest for production bundle
    async buildStart() {
      await triggerScan(null, 'Generating playlist manifest for build...')
    },

    // Development time: watch public/music/ for changes
    configureServer(server) {
      // Initial scan on dev server launch
      triggerScan(server, 'Initial scan on server startup...')

      // API endpoint for dynamic playlist fetching
      server.middlewares.use('/api/music-playlist', async (req, res, next) => {
        if (req.method === 'GET') {
          try {
            const manifest = await scanMusicFolder(process.cwd())
            res.setHeader('Content-Type', 'application/json')
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
            res.end(JSON.stringify(manifest))
            return
          } catch (err: any) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: err.message }))
            return
          }
        }
        next()
      })

      // Watch public/music directory
      const musicDir = path.resolve(process.cwd(), 'public', 'music')
      server.watcher.add(musicDir)

      const isAudioFile = (file: string) => {
        const ext = path.extname(file).toLowerCase()
        return SUPPORTED_EXTS.has(ext) && !file.includes('.covers')
      }

      server.watcher.on('add', (file) => {
        if (file.startsWith(musicDir) && isAudioFile(file)) {
          debouncedScan(server, `New audio file detected: ${path.basename(file)}`)
        }
      })

      server.watcher.on('unlink', (file) => {
        if (file.startsWith(musicDir) && isAudioFile(file)) {
          debouncedScan(server, `Audio file removed: ${path.basename(file)}`)
        }
      })

      server.watcher.on('change', (file) => {
        if (file.startsWith(musicDir) && isAudioFile(file)) {
          debouncedScan(server, `Audio file modified: ${path.basename(file)}`)
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), autoMusicPlaylistPlugin()],
  server: {
    port: 3000,
    host: true
  }
})
