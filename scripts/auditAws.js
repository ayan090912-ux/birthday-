import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'
import { AmplifyClient, ListAppsCommand } from '@aws-sdk/client-amplify'
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3'
import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2'
import { CloudFormationClient, ListStacksCommand } from '@aws-sdk/client-cloudformation'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

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

async function audit() {
  const credentials = getCreds()
  const region = 'ap-south-1'

  console.log('=== 1. CALLER IDENTITY ===')
  const sts = new STSClient({ region, credentials })
  try {
    const caller = await sts.send(new GetCallerIdentityCommand({}))
    console.log('Account ID:', caller.Account)
    console.log('ARN:', caller.Arn)
  } catch (err) {
    console.error('STS Error:', err.message)
  }

  console.log('\n=== 2. S3 BUCKETS ===')
  const s3 = new S3Client({ region, credentials })
  try {
    const buckets = await s3.send(new ListBucketsCommand({}))
    console.log('Buckets:', buckets.Buckets?.map(b => b.Name))
  } catch (err) {
    console.error('S3 Error:', err.message)
  }

  console.log('\n=== 3. EC2 INSTANCES (ap-south-1) ===')
  const ec2 = new EC2Client({ region, credentials })
  try {
    const instances = await ec2.send(new DescribeInstancesCommand({}))
    const reservations = instances.Reservations || []
    const allInstances = reservations.flatMap(r => r.Instances || [])
    console.log(`Found ${allInstances.length} EC2 instances:`)
    for (const inst of allInstances) {
      const nameTag = inst.Tags?.find(t => t.Key === 'Name')?.Value || 'NoName'
      console.log(` - ID: ${inst.InstanceId}, State: ${inst.State?.Name}, Name: ${nameTag}, Type: ${inst.InstanceType}`)
    }
  } catch (err) {
    console.error('EC2 Error:', err.message)
  }

  console.log('\n=== 4. CLOUDFORMATION STACKS (ap-south-1) ===')
  const cf = new CloudFormationClient({ region, credentials })
  try {
    const stacks = await cf.send(new ListStacksCommand({
      StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE', 'ROLLBACK_COMPLETE', 'CREATE_IN_PROGRESS']
    }))
    console.log(`Found ${stacks.StackSummaries?.length || 0} active stacks:`)
    for (const s of stacks.StackSummaries || []) {
      console.log(` - Stack: ${s.StackName}, Status: ${s.StackStatus}`)
    }
  } catch (err) {
    console.error('CloudFormation Error:', err.message)
  }

  console.log('\n=== 5. AMPLIFY APPS (ap-south-1) ===')
  const amp = new AmplifyClient({ region, credentials })
  try {
    const apps = await amp.send(new ListAppsCommand({ maxResults: 50 }))
    console.log(`Found ${apps.apps?.length || 0} Amplify apps:`)
    for (const a of apps.apps || []) {
      console.log(` - AppId: ${a.appId}, Name: ${a.name}, Domain: ${a.defaultDomain}`)
    }
  } catch (err) {
    console.error('Amplify Error:', err.message)
  }
}

audit()
