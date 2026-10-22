import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const projectRoot = process.cwd()
const homeDir = os.homedir()
const launchAgentsDir = path.join(homeDir, 'Library', 'LaunchAgents')
const plistLabel = 'com.anshika.musicsync'
const plistPath = path.join(launchAgentsDir, `${plistLabel}.plist`)
const nodeBinary = process.execPath
const scriptPath = path.join(projectRoot, 'scripts', 'cloudSyncWatcher.js')
const logDir = path.join(homeDir, 'Library', 'Logs')
const stdoutLog = path.join(logDir, 'anshika-musicsync.log')
const stderrLog = path.join(logDir, 'anshika-musicsync.err.log')

const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${plistLabel}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodeBinary}</string>
        <string>${scriptPath}</string>
        <string>--watch</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${projectRoot}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${stdoutLog}</string>
    <key>StandardErrorPath</key>
    <string>${stderrLog}</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:${path.dirname(nodeBinary)}</string>
    </dict>
</dict>
</plist>
`

export function installService() {
  if (!fs.existsSync(launchAgentsDir)) {
    fs.mkdirSync(launchAgentsDir, { recursive: true })
  }

  // Unload previous version if loaded
  try {
    execSync(`launchctl unload "${plistPath}" 2>/dev/null`)
  } catch {}

  fs.writeFileSync(plistPath, plistContent, 'utf8')
  console.log(`[LaunchAgent] Wrote plist configuration to: ${plistPath}`)

  try {
    execSync(`launchctl load -w "${plistPath}"`)
    console.log(`[LaunchAgent] Successfully installed and started background service: ${plistLabel}`)
    console.log(`[LaunchAgent] Logs are written to: ${stdoutLog}`)
    console.log(`\nTo check status: launchctl list | grep ${plistLabel}`)
    console.log(`To uninstall: npm run uninstall-service\n`)
  } catch (err) {
    console.error(`[LaunchAgent] Could not load with launchctl:`, err.message)
  }
}

export function uninstallService() {
  try {
    execSync(`launchctl unload -w "${plistPath}" 2>/dev/null`)
    if (fs.existsSync(plistPath)) fs.unlinkSync(plistPath)
    console.log(`[LaunchAgent] Successfully stopped and removed ${plistLabel}`)
  } catch (err) {
    console.error(`[LaunchAgent] Uninstall error:`, err.message)
  }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  if (process.argv.includes('--uninstall')) {
    uninstallService()
  } else {
    installService()
  }
}
