import { spawn } from 'node:child_process'
import http from 'node:http'
import fs from 'node:fs'

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const port = 9223
const urlToTest = 'https://main.d14jgamp8ms913.amplifyapp.com'
const outputPath = '/Users/ayaan/.gemini/antigravity-ide/brain/8a6b5e99-e904-45af-8e13-2444a7a1af36/live_site_rendered.png'

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

async function main() {
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--window-size=1440,900',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ])

  await new Promise(r => setTimeout(r, 1500))

  try {
    const targets = await getJson('/json/list')
    const pageTarget = targets.find(t => t.type === 'page')
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('No page target found: ' + JSON.stringify(targets.map(t => ({ type: t.type, title: t.title }))))
    }
    const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl)

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }))
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }))
      ws.send(JSON.stringify({ id: 3, method: 'Page.navigate', params: { url: urlToTest } }))
    })

    ws.addEventListener('message', async (event) => {
      const parsed = JSON.parse(event.data.toString())
      if (parsed.method === 'Page.loadEventFired') {
        console.log('Page loaded! Waiting 3.5s for fonts, images, and animations to settle...')
        await new Promise(r => setTimeout(r, 3500))

        ws.send(JSON.stringify({
          id: 20,
          method: 'Page.captureScreenshot',
          params: { format: 'png' }
        }))
      } else if (parsed.id === 20) {
        const base64Data = parsed.result?.data
        if (base64Data) {
          fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'))
          console.log(`Saved screenshot (${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB) to: ${outputPath}`)
        }
        ws.close()
        chrome.kill()
      }
    })

    await new Promise(r => setTimeout(r, 12000))
  } catch (err) {
    console.error('Error taking screenshot:', err)
  } finally {
    try { chrome.kill() } catch {}
  }
}

main()
