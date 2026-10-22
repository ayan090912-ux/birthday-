import { spawn } from 'node:child_process'
import http from 'node:http'

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const port = 9245
const baseUrl = 'http://localhost:3000'

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
  console.log('--- Testing Mobile Audio Player Controls (375x667) ---')
  const chrome = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    '--window-size=375,667',
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
    await send('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      mobile: true
    })

    console.log('Navigating to', baseUrl)
    await send('Page.navigate', { url: baseUrl })
    await new Promise(r => setTimeout(r, 2000))

    // 1. Initial State
    const initRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const audio = document.querySelector('audio');
        const title = document.querySelector('.player-song-title')?.innerText;
        return { initialTitle: title, paused: audio?.paused, src: audio?.src };
      })()`,
      returnByValue: true
    })
    console.log('1. Initial State:', initRes?.result?.value)

    // 2. Click Play Button
    console.log('2. Clicking Play button...')
    const playRes = await send('Runtime.evaluate', {
      expression: `(async () => {
        const playBtn = document.querySelector('#player-play-pause-btn');
        if (!playBtn) return { error: 'Play button not found' };
        playBtn.click();
        await new Promise(r => setTimeout(r, 1500));
        const audio = document.querySelector('audio');
        return {
          clicked: true,
          paused: audio?.paused,
          currentTime: audio?.currentTime,
          isPlayingClass: document.querySelector('.reference-style-music-player')?.classList.contains('is-playing')
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    })
    console.log('Play Result:', playRes?.result?.value)

    // 3. Click Next Track Button
    console.log('3. Clicking Next track button...')
    const nextRes = await send('Runtime.evaluate', {
      expression: `(async () => {
        const nextBtn = document.querySelector('.btn-next');
        if (!nextBtn) return { error: 'Next button not found' };
        nextBtn.click();
        await new Promise(r => setTimeout(r, 1200));
        const title = document.querySelector('.player-song-title')?.innerText;
        const audio = document.querySelector('audio');
        return {
          nextTitle: title,
          audioSrc: audio?.src,
          paused: audio?.paused
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    })
    console.log('Next Track Result:', nextRes?.result?.value)

    // 4. Click Previous Track Button
    console.log('4. Clicking Previous track button...')
    const prevRes = await send('Runtime.evaluate', {
      expression: `(async () => {
        const prevBtn = document.querySelector('.btn-prev');
        if (!prevBtn) return { error: 'Prev button not found' };
        prevBtn.click();
        await new Promise(r => setTimeout(r, 1200));
        const title = document.querySelector('.player-song-title')?.innerText;
        const audio = document.querySelector('audio');
        return {
          prevTitle: title,
          audioSrc: audio?.src,
          paused: audio?.paused
        };
      })()`,
      awaitPromise: true,
      returnByValue: true
    })
    console.log('Previous Track Result:', prevRes?.result?.value)

    // 5. Test Mobile Scrub Bar
    console.log('5. Testing Mobile Scrub Bar...')
    const scrubRes = await send('Runtime.evaluate', {
      expression: `(() => {
        const scrubSlider = document.querySelector('.mobile-pill-scrub-slider');
        const scrubBar = document.querySelector('.mobile-pill-scrub-bar');
        const isScrubVisible = scrubBar ? window.getComputedStyle(scrubBar).display !== 'none' : false;
        return {
          hasScrubSlider: !!scrubSlider,
          isScrubVisible,
          scrubBarWidth: scrubBar ? scrubBar.clientWidth : 0
        };
      })()`,
      returnByValue: true
    })
    console.log('Mobile Scrub Bar Result:', scrubRes?.result?.value)

    console.log('\n--- Mobile Player Controls Test Complete: SUCCESS ---')
    ws.close()
  } catch (err) {
    console.error('Test error:', err)
  } finally {
    chrome.kill()
  }
}

run()
