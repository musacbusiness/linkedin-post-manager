import { Client, Receiver } from '@upstash/qstash'

export function getQStashClient() {
  const token = process.env.QSTASH_TOKEN
  if (!token) throw new Error('QSTASH_TOKEN not configured')
  const baseUrl = process.env.QSTASH_URL ?? 'https://qstash.upstash.io'
  return new Client({ token, baseUrl })
}

export function getQStashReceiver() {
  const currentKey = process.env.QSTASH_CURRENT_SIGNING_KEY
  const nextKey = process.env.QSTASH_NEXT_SIGNING_KEY
  if (!currentKey || !nextKey) throw new Error('QStash signing keys not configured')
  return new Receiver({ currentSigningKey: currentKey, nextSigningKey: nextKey })
}

export async function schedulePostDelivery(postId: string, scheduledTime: string) {
  const token = process.env.QSTASH_TOKEN
  const qstashUrl = process.env.QSTASH_URL ?? 'https://qstash.upstash.io'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  console.log(`[QSTASH] token set: ${!!token}, url: ${qstashUrl}, appUrl: ${appUrl}`)

  if (!token) throw new Error('QSTASH_TOKEN not configured')
  if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL not configured')

  const destination = `${appUrl}/api/posts/${postId}/publish`
  const notBefore = Math.floor(new Date(scheduledTime).getTime() / 1000)

  console.log(`[QSTASH] Publishing to ${destination}, notBefore: ${notBefore}`)

  const response = await fetch(`${qstashUrl}/v2/publish/${destination}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Upstash-Not-Before': String(notBefore),
    },
    body: JSON.stringify({ postId }),
  })

  const result = await response.json()
  console.log(`[QSTASH] Response status: ${response.status}, body: ${JSON.stringify(result)}`)

  if (!response.ok) {
    throw new Error(`QStash publish failed: ${response.status} ${JSON.stringify(result)}`)
  }

  console.log(`[QSTASH] Scheduled post ${postId} for delivery at ${scheduledTime}, messageId: ${result.messageId}`)
}
