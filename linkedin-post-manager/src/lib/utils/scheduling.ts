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
 * - 5:00 PM - 8:00 PM
 *
 * Enforces exactly 1 post per window per day.
 * Searches up to 30 days ahead for available slot.
 * Naturally fills vacated slots (freed windows become earliest candidates).
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
      [17, 20],  // 5:00 PM - 8:00 PM
    ]

    const now = new Date()
    let scheduledDateTime: Date | null = null

    // Look ahead up to 30 days to find an available slot
    for (let daysAhead = 1; daysAhead < 30; daysAhead++) {
      const checkDate = new Date(now)
      checkDate.setDate(now.getDate() + daysAhead)
      checkDate.setHours(0, 0, 0, 0)  // Reset to midnight

      // Try each window for this day
      for (const [startHour, endHour] of windows) {
        const windowStart = new Date(checkDate)
        windowStart.setHours(startHour, 0, 0, 0)
        const windowEnd = new Date(checkDate)
        windowEnd.setHours(endHour, 0, 0, 0)

        // Check if this window already has a post scheduled
        const windowOccupied = scheduledTimes.some(
          (t) => t >= windowStart && t < windowEnd
        )

        if (!windowOccupied) {
          // Pick a random time within the window
          const randomHour = startHour + Math.floor(Math.random() * (endHour - startHour))
          const randomMinute = Math.floor(Math.random() * 60)

          scheduledDateTime = new Date(checkDate)
          scheduledDateTime.setHours(randomHour, randomMinute, 0, 0)
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
