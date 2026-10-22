import { spawn } from 'node:child_process'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const port = 9235
const baseUrl = 'http://localhost:3000'
const outputDir = '/Users/ayaan/.gemini/antigravity-ide/brain/8a6b5e99-e904-45af-8e13-2444a7a1af36/responsive_tests'

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

const VIEWPORTS = [
  { name: 'phone_small_320x568', width: 320, height: 568 },
  { name: 'phone_std_375x667', width: 375, height: 667 },
  { name: 'phone_large_414x896', width: 414, height: 896 },
  { name: 'phone_landscape_667x375', width: 667, height: 375 },
  { name: 'phone_landscape_844x390', width: 844, height: 390 },
  { name: 'tablet_portrait_768x1024', width: 768, height: 1024 },
  { name: 'tablet_landscape_1024x768', width: 1024, height: 768 },
  { name: 'laptop_1280x800', width: 1280, height: 800 },
  { name: 'desktop_1440x900', width: 1440, height: 900 },
  { name: 'desktop_large_1920x1080', width: 1920, height: 1080 }
]

async function getJson(endpoint) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}${endpoint}`, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } catch (e) { resolve(data) }
      })
    }).on('error', reject)
  })
}

async function run() {
  console.log('--- Launching Headless Chrome for Responsive Viewport Suite ---')
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--window-size=1920,1080',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'about:blank'
  ])

  await new Promise(r => setTimeout(r, 1500))

  try {
    const targets = await getJson('/json/list')
    const pageTarget = targets.find(t => t.type === 'page')
    if (!pageTarget) throw new Error('No page target found')

    const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl)

    await new Promise((resolve) => ws.addEventListener('open', resolve, { once: true }))

    let msgId = 1
    const send = (method, params = {}) => {
      const id = ++msgId
      return new Promise((resolve) => {
        const handler = (event) => {
          const parsed = JSON.parse(event.data.toString())
          if (parsed.id === id) {
            ws.removeEventListener('message', handler)
            resolve(parsed.result)
          }
        }
        ws.addEventListener('message', handler)
        ws.send(JSON.stringify({ id, method, params }))
      })
    }

    await send('Page.enable')
    await send('Runtime.enable')

    console.log('Navigating to', baseUrl)
    await send('Page.navigate', { url: baseUrl })
    await new Promise(r => setTimeout(r, 2000))

    const auditResults = []

    for (const vp of VIEWPORTS) {
      console.log(`\nTesting viewport: ${vp.name} (${vp.width}x${vp.height})`)

      // Set device metrics
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 2,
        mobile: vp.width <= 1024
      })

      // Wait 800ms for CSS and reflow to stabilize
      await new Promise(r => setTimeout(r, 800))

      // Audit DOM metrics
      const evalRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const doc = document.documentElement;
          const body = document.body;
          const hero = document.querySelector('.birthday-hero-overlay');
          const player = document.querySelector('.reference-style-music-player');
          const pill = document.querySelector('.reference-pill-bar');
          const heroRect = hero ? hero.getBoundingClientRect() : null;
          const playerRect = player ? player.getBoundingClientRect() : null;
          const pillRect = pill ? pill.getBoundingClientRect() : null;

          const hasHorizontalOverflow = doc.scrollWidth > window.innerWidth || body.scrollWidth > window.innerWidth;
          const overlap = (heroRect && playerRect) ? !(heroRect.bottom < playerRect.top || heroRect.top > playerRect.bottom || heroRect.right < playerRect.left || heroRect.left > playerRect.right) : false;

          const gap = playerRect && heroRect ? playerRect.top - heroRect.bottom : null;

          // Check if play/pause button is visible and within bounds
          const playBtn = document.querySelector('.btn-play-pause');
          const playRect = playBtn ? playBtn.getBoundingClientRect() : null;
          const isPlayVisible = playRect && playRect.width > 0 && playRect.right <= window.innerWidth && playRect.left >= 0;

          // Check if song title is clipped or ellipsized
          const titleEl = document.querySelector('.player-song-title');
          const titleWidth = titleEl ? titleEl.clientWidth : 0;

          // Check if lantern intersects text
          const lantern1 = document.querySelector('#lantern-gate-top-left');
          const isLantern1Visible = lantern1 ? window.getComputedStyle(lantern1).display !== 'none' : false;

          return {
            windowInnerWidth: window.innerWidth,
            windowInnerHeight: window.innerHeight,
            docScrollWidth: doc.scrollWidth,
            hasHorizontalOverflow,
            overlap,
            gap: gap ? Number(gap.toFixed(1)) : null,
            pillWidth: pillRect ? Math.round(pillRect.width) : 0,
            isPlayVisible,
            titleWidth,
            isLantern1Visible
          };
        })()`,
        returnByValue: true
      })

      const metrics = evalRes?.result?.value
      console.log('Metrics:', metrics)
      auditResults.push({ vp: vp.name, ...metrics })

      // Capture screenshot
      const shotRes = await send('Page.captureScreenshot', { format: 'png' })
      if (shotRes?.data) {
        const filePath = path.join(outputDir, `${vp.name}.png`)
        fs.writeFileSync(filePath, Buffer.from(shotRes.data, 'base64'))
        console.log(`Saved screenshot to ${filePath}`)
      }
    }

    fs.writeFileSync(path.join(outputDir, 'audit_report.json'), JSON.stringify(auditResults, null, 2))
    console.log('\n--- Viewport Audit Complete ---')

    ws.close()
  } catch (err) {
    console.error('Audit error:', err)
  } finally {
    chrome.kill()
  }
}

run()
