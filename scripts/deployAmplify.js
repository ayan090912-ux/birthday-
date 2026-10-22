import { AmplifyClient, CreateDeploymentCommand, StartDeploymentCommand, GetJobCommand, ListJobsCommand, StopJobCommand } from '@aws-sdk/client-amplify'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

function getCreds() {
  const iniPath = path.join(os.homedir(), '.aws', 'credentials')
  const content = fs.readFileSync(iniPath, 'utf8')
  let id = '', secret = ''
  for (const line of content.split('\n')) {
    if (line.includes('aws_access_key_id') && !id) id = line.split('=')[1].trim()
    if (line.includes('aws_secret_access_key') && !secret) secret = line.split('=')[1].trim()
  }
  return { accessKeyId: id, secretAccessKey: secret }
}

export async function deployToAmplify(appId = 'd14jgamp8ms913', branchName = 'main') {
  console.log('🌸 [amplify-deploy] Starting AWS Amplify Deployment...')
  const credentials = getCreds()
  const region = 'ap-south-1'
  const client = new AmplifyClient({ region, credentials })
  const projectRoot = process.cwd()
  const distDir = path.join(projectRoot, 'dist')
  const zipPath = path.join(os.tmpdir(), `amplify-dist-${Date.now()}.zip`)

  // 1. Build the project
  console.log('🌸 [amplify-deploy] Building production bundle (npm run build)...')
  execSync('npm run build', { cwd: projectRoot, stdio: 'inherit' })

  if (!fs.existsSync(distDir)) {
    throw new Error('dist directory not found after build!')
  }

  // 2. Zip the contents of dist (excluding redundant 240MB local MP3 copies since audio streams from S3)
  console.log(`🌸 [amplify-deploy] Compressing build artifacts into ${zipPath}...`)
  execSync(`cd "${distDir}" && zip -r "${zipPath}" . -x "music/*.mp3"`, { stdio: 'ignore' })
  const zipSizeMb = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2)
  console.log(`🌸 [amplify-deploy] Compressed bundle size: ${zipSizeMb} MB`)

  // 3. Clean up any pending jobs before starting a new deployment
  console.log('🌸 [amplify-deploy] Checking for and clearing pending deployment slots...')
  try {
    const jobs = await client.send(new ListJobsCommand({ appId, branchName, maxResults: 10 }))
    for (const j of jobs.jobSummaries || []) {
      if (j.status === 'PENDING' || j.status === 'RUNNING') {
        try {
          await client.send(new StopJobCommand({ appId, branchName, jobId: j.jobId }))
          console.log(`🌸 [amplify-deploy] Stopped pending job #${j.jobId}`)
        } catch {}
      }
    }
  } catch {}

  // 4. Create Deployment in Amplify
  console.log('🌸 [amplify-deploy] Requesting Amplify deployment slot...')
  const deployRes = await client.send(new CreateDeploymentCommand({
    appId,
    branchName
  }))

  const { jobId, zipUploadUrl } = deployRes
  console.log(`🌸 [amplify-deploy] Created deployment job #${jobId}`)

  // 4. Upload zip to S3 presigned URL
  console.log('🌸 [amplify-deploy] Uploading bundle to AWS Amplify...')
  const zipBuffer = fs.readFileSync(zipPath)
  const uploadRes = await fetch(zipUploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/zip',
      'Content-Length': zipBuffer.length.toString()
    },
    body: zipBuffer
  })

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text()
    throw new Error(`Failed to upload zip: ${uploadRes.status} ${uploadRes.statusText} - ${errorText}`)
  }
  console.log('🌸 [amplify-deploy] Bundle upload successful.')

  // 5. Start the deployment
  console.log('🌸 [amplify-deploy] Starting Amplify release...')
  await client.send(new StartDeploymentCommand({
    appId,
    branchName,
    jobId
  }))

  // 6. Monitor deployment progress
  console.log('🌸 [amplify-deploy] Waiting for deployment to finalize...')
  let isDone = false
  let status = 'PENDING'
  let attempts = 0

  while (!isDone && attempts < 60) {
    await new Promise(r => setTimeout(r, 4000))
    attempts++
    const jobRes = await client.send(new GetJobCommand({
      appId,
      branchName,
      jobId
    }))

    status = jobRes.job?.summary?.status || 'UNKNOWN'
    console.log(`[amplify-deploy] Status check #${attempts}: ${status}`)

    if (status === 'SUCCEED') {
      isDone = true
      break
    } else if (status === 'FAILED' || status === 'CANCELLED') {
      throw new Error(`Amplify deployment failed with status: ${status}`)
    }
  }

  // Cleanup temp zip
  try { fs.unlinkSync(zipPath) } catch {}

  const liveUrl = `https://${branchName}.${appId}.amplifyapp.com`
  console.log('\n======================================================')
  console.log('🎉 [amplify-deploy] DEPLOYMENT COMPLETE!')
  console.log(`🌐 Live URL: ${liveUrl}`)
  console.log(`📦 App ID: ${appId}`)
  console.log(`🌿 Branch: ${branchName}`)
  console.log(`📍 Region: ${region}`)
  console.log('======================================================\n')

  return { liveUrl, appId, branchName, region, status }
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isMain) {
  deployToAmplify().catch(err => {
    console.error('Deployment failed:', err)
    process.exit(1)
  })
}
