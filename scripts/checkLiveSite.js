import { spawn } from 'node:child_process'
import http from 'node:http'

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const port = 9222
const urlToTest = 'https://main.d14jgamp8ms913.amplifyapp.com'

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
  console.log('Launching headless Chrome with debugging on port', port)
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'about:blank'
  ])

  // Wait for Chrome to listen
  await new Promise(r => setTimeout(r, 1500))

  try {
    const version = await getJson('/json/version')
    console.log('Connected to Chrome:', version['User-Agent']?.split(' ')[0])

    const targets = await getJson('/json/list')
    const pageTarget = targets[0]
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('No page target found')
    }

    const WebSocket = globalThis.WebSocket
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl)

    ws.addEventListener('open', () => {
      // Enable Page, Runtime, Network
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }))
      ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }))
      ws.send(JSON.stringify({ id: 3, method: 'Network.enable' }))

      // Navigate to URL
      ws.send(JSON.stringify({ id: 4, method: 'Page.navigate', params: { url: urlToTest } }))
    })

    ws.addEventListener('message', async (event) => {
      const parsed = JSON.parse(event.data.toString())
      if (parsed.method === 'Runtime.consoleAPICalled') {
        const text = parsed.params.args.map(a => a.value || a.description).join(' ')
        console.log(`[BROWSER CONSOLE ${parsed.params.type.toUpperCase()}]`, text)
      } else if (parsed.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER RUNTIME ERROR]', parsed.params.exceptionDetails.text, parsed.params.exceptionDetails.exception?.description)
      } else if (parsed.method === 'Network.responseReceived') {
        const res = parsed.params.response
        if (res.status >= 400) {
          console.error(`[BROWSER HTTP ${res.status}] ${res.url}`)
        }
      } else if (parsed.method === 'Page.loadEventFired') {
        console.log('Page loaded completely!')
        // Evaluate DOM and real rendered elements
        ws.send(JSON.stringify({
          id: 10,
          method: 'Runtime.evaluate',
          params: {
            expression: `({
              rootChildren: document.getElementById('root')?.children.length,
              headline: document.getElementById('main-birthday-headline')?.innerText,
              subtitle: document.getElementById('birthday-personal-message')?.innerText,
              playerTitle: document.querySelector('.player-song-title')?.innerText,
              trackCount: document.querySelector('.spotify-label')?.innerText,
              audioSrc: document.querySelector('audio')?.src,
              sceneryImages: Array.from(document.querySelectorAll('img')).map(i => ({ src: i.src, complete: i.complete, width: i.naturalWidth }))
            })`,
            returnByValue: true
          }
        }))
      } else if (parsed.id === 10) {
        console.log('DOM Evaluation Result:', JSON.stringify(parsed.result?.result?.value, null, 2))
      }
    })

    // Wait 5 seconds to collect logs
    await new Promise(r => setTimeout(r, 6000))
    ws.close()
  } catch (err) {
    console.error('Error during check:', err)
  } finally {
    chrome.kill()
  }
}

main()
