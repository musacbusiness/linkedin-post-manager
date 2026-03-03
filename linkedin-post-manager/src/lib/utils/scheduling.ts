import { SupabaseClient } from '@supabase/supabase-js'

interface ScheduleResult {
  success: boolean
  scheduledTime?: string
  error?: string
}

/**
 * Auto-schedule post to random time in next available window
 *
 * Scheduling windows (user's local timezone):
 * - 8:00 AM - 10:00 AM
 * - 12:00 PM - 2:00 PM
 * - 5:00 PM - 7:00 PM
 *
 * Ensures 30-minute buffer between posts
 * Searches up to 30 days ahead for available slot
 */
export async function autoSchedulePost(
  supabase: SupabaseClient,
  postId: string
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

    // Extract scheduled times
    const scheduledTimes: Date[] = []
    for (const post of allPosts || []) {
      if (post.scheduled_time) {
        try {
          scheduledTimes.push(new Date(post.scheduled_time))
        } catch {
          // Skip invalid dates
        }
      }
    }

    // Define 3 daily time windows (start_hour, end_hour)
    const windows = [
      [8, 10],   // 8:00 AM - 10:00 AM
      [12, 14],  // 12:00 PM - 2:00 PM
      [17, 19],  // 5:00 PM - 7:00 PM
    ]

    const now = new Date()
    let scheduledDateTime: Date | null = null

    // Look ahead up to 30 days to find an available slot
    for (let daysAhead = 1; daysAhead < 30; daysAhead++) {  // Start from tomorrow (daysAhead = 1)
      const checkDate = new Date(now)
      checkDate.setDate(now.getDate() + daysAhead)
      checkDate.setHours(0, 0, 0, 0)  // Reset to midnight

      // Try each window for this day
      for (const [startHour, endHour] of windows) {
        // Random time within window - pick random hour within range, then random minute
        // For window [8, 10]: picks hour 8, 9 with any minute (up to 59)
        const randomHour = startHour + Math.floor(Math.random() * (endHour - startHour))
        const randomMinute = Math.floor(Math.random() * 60)

        const candidateTime = new Date(checkDate)
        candidateTime.setHours(randomHour, randomMinute, 0, 0)

        // Skip past times
        if (candidateTime <= now) {
          continue
        }

        // Check if slot is available (no post within 30 minutes)
        let slotAvailable = true
        for (const existingTime of scheduledTimes) {
          const timeDiff = Math.abs(candidateTime.getTime() - existingTime.getTime())
          if (timeDiff < 1800000) {  // 30 minutes in milliseconds
            slotAvailable = false
            break
          }
        }

        if (slotAvailable) {
          scheduledDateTime = candidateTime
          break
        }
      }

      if (scheduledDateTime) {
        break
      }
    }

    if (!scheduledDateTime) {
      return {
        success: false,
        error: 'No available time slots in next 30 days'
      }
    }

    // Update post with scheduled time and scheduled status
    const { error: updateError } = await supabase
      .from('posts')
      .update({
        status: 'Scheduled',
        scheduled_time: scheduledDateTime.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)

    if (updateError) {
      console.error('Error updating post:', updateError)
      return { success: false, error: updateError.message }
    }

    console.log(`Scheduled post ${postId} for ${scheduledDateTime.toISOString()}`)

    return {
      success: true,
      scheduledTime: scheduledDateTime.toISOString()
    }
  } catch (error) {
    console.error('Scheduling error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
