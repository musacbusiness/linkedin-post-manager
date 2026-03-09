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
  const client = getQStashClient()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL not configured')

  const destination = `${appUrl}/api/posts/${postId}/publish`
  const notBefore = Math.floor(new Date(scheduledTime).getTime() / 1000)

  await client.publish({
    url: destination,
    notBefore,
    body: JSON.stringify({ postId }),
    headers: { 'Content-Type': 'application/json' },
  })

  console.log(`[QSTASH] Scheduled post ${postId} for delivery at ${scheduledTime}`)
}
