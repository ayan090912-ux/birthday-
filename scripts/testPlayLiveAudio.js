import { spawn } from 'node:child_process'
import http from 'node:http'

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const port = 9224
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
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--autoplay-policy=no-user-gesture-required',
    'about:blank'
  ])

  await new Promise(r => setTimeout(r, 1500))

  try {
    const targets = await getJson('/json/list')
    const pageTarget = targets[0]
    const ws = new globalThis.WebSocket(pageTarget.webSocketDebuggerUrl)

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }))
      ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }))
      ws.send(JSON.stringify({ id: 3, method: 'Page.navigate', params: { url: urlToTest } }))
    })

    ws.addEventListener('message', async (event) => {
      const parsed = JSON.parse(event.data.toString())
      if (parsed.method === 'Page.loadEventFired') {
        console.log('Page loaded! Waiting 2s before clicking Play...')
        await new Promise(r => setTimeout(r, 2000))

        // Click play button
        ws.send(JSON.stringify({
          id: 10,
          method: 'Runtime.evaluate',
          params: {
            expression: `(async () => {
              const playBtn = document.querySelector('.btn-play-pause');
              if (!playBtn) return { error: 'Play button not found' };
              playBtn.click();
              await new Promise(r => setTimeout(r, 2000));
              const audio = document.querySelector('audio');
              return {
                paused: audio?.paused,
                currentTime: audio?.currentTime,
                duration: audio?.duration,
                src: audio?.src,
                readyState: audio?.readyState
              };
            })()`,
            awaitPromise: true,
            returnByValue: true
          }
        }))
      } else if (parsed.id === 10) {
        console.log('Audio Playback Test Result:', JSON.stringify(parsed.result?.result?.value, null, 2))
        ws.close()
        chrome.kill()
      }
    })

    await new Promise(r => setTimeout(r, 10000))
  } catch (err) {
    console.error('Test error:', err)
  } finally {
    try { chrome.kill() } catch {}
  }
}

main()
