import { SupabaseClient } from '@supabase/supabase-js'

interface ScheduleResult {
  success: boolean
  scheduledTime?: string
  error?: string
}

/**
 * Convert a local date + hour + minute in a given IANA timezone to a UTC Date.
 * Works without external libraries using the Intl API.
 */
function localToUTC(localDateStr: string, hour: number, minute: number, timezone: string): Date {
  // Treat the local time as if it were UTC first (naive parse)
  const paddedH = String(hour).padStart(2, '0')
  const paddedM = String(minute).padStart(2, '0')
  const naiveUTC = new Date(`${localDateStr}T${paddedH}:${paddedM}:00Z`)

  // Find what local time that UTC instant corresponds to in the target timezone
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(naiveUTC)

  const localH = parseInt(parts.find(p => p.type === 'hour')?.value ?? '0') % 24
  const localM = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0')

  // Adjust so the UTC instant produces the intended local time
  const diffMinutes = (hour * 60 + minute) - (localH * 60 + localM)
  return new Date(naiveUTC.getTime() + diffMinutes * 60_000)
}

/**
 * Get the current date string (YYYY-MM-DD) in a given IANA timezone.
 */
function getLocalDateString(utcNow: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(utcNow)
}

/**
 * Auto-schedule post to random time in next available window.
 *
 * Scheduling windows (in the user's local timezone):
 * - 8:00 AM - 10:00 AM
 * - 12:00 PM - 2:00 PM
 * - 5:00 PM - 8:00 PM
 *
 * Enforces exactly 1 post per window per day.
 * Searches up to 30 days ahead for an available slot.
 */
export async function autoSchedulePost(
  supabase: SupabaseClient,
  postId: string,
  timezone = 'UTC'
): Promise<ScheduleResult> {
  try {
    // Get all scheduled posts for conflict checking
    const { data: allPosts, error: fetchError } = await supabase
      .from('posts')
      .select('scheduled_time')
      .not('scheduled_time', 'is', null)

    if (fetchError) {
      console.error('Error fetching posts:', fetchError)
      return { success: false, error: fetchError.message }
    }

    const scheduledTimes: Date[] = []
    for (const post of allPosts || []) {
      if (post.scheduled_time) {
        try {
          scheduledTimes.push(new Date(post.scheduled_time))
        } catch {
          // skip invalid dates
        }
      }
    }

    // Windows defined in local time: [startHour, endHour]
    const windows = [
      [8, 10],   // 8:00 AM – 10:00 AM
      [12, 14],  // 12:00 PM – 2:00 PM
      [17, 20],  // 5:00 PM – 8:00 PM
    ]

    const now = new Date()
    // Require at least 10 minutes of lead time before posting
    const minScheduleTime = new Date(now.getTime() + 10 * 60_000)
    let scheduledDateTime: Date | null = null

    for (let daysAhead = 0; daysAhead < 30; daysAhead++) {
      // Get the local calendar date daysAhead from today in the user's timezone
      const futureUTC = new Date(now.getTime() + daysAhead * 86_400_000)
      const localDateStr = getLocalDateString(futureUTC, timezone) // 'YYYY-MM-DD'

      for (const [startHour, endHour] of windows) {
        // Compute UTC timestamps for this window's start and end
        const windowStart = localToUTC(localDateStr, startHour, 0, timezone)
        const windowEnd = localToUTC(localDateStr, endHour, 0, timezone)

        // Skip windows that have already ended (or don't have enough time left)
        if (windowEnd <= minScheduleTime) continue

        const windowOccupied = scheduledTimes.some(
          (t) => t >= windowStart && t < windowEnd
        )

        if (!windowOccupied) {
          // Pick a random time within the window, clamped so it's never in the past
          const effectiveStart = Math.max(windowStart.getTime(), minScheduleTime.getTime())
          const windowEndMs = windowEnd.getTime()
          const rangeMs = windowEndMs - effectiveStart
          const randomOffsetMs = Math.floor(Math.random() * rangeMs)
          scheduledDateTime = new Date(effectiveStart + randomOffsetMs)
          break
        }
      }

      if (scheduledDateTime) break
    }

    if (!scheduledDateTime) {
      return { success: false, error: 'No available time slots in next 30 days' }
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({
        status: 'Scheduled',
        scheduled_time: scheduledDateTime.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId)

    if (updateError) {
      console.error('Error updating post:', updateError)
      return { success: false, error: updateError.message }
    }

    console.log(`Scheduled post ${postId} for ${scheduledDateTime.toISOString()} (${timezone})`)
    return { success: true, scheduledTime: scheduledDateTime.toISOString() }
  } catch (error) {
    console.error('Scheduling error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
