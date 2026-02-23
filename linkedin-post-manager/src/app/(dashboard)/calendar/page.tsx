'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePosts } from '@/hooks/use-posts'
import { useRealtimePosts } from '@/hooks/use-realtime-posts'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Enable real-time updates
  useRealtimePosts()

  const { data: posts } = usePosts({ status: 'scheduled' })

  // Get calendar data for current month
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const postsOnDate = posts?.filter((post) => {
        if (!post.scheduled_for) return false
        const postDate = new Date(post.scheduled_for)
        return (
          postDate.getDate() === day &&
          postDate.getMonth() === month &&
          postDate.getFullYear() === year
        )
      }) || []

      days.push({
        date,
        day,
        isToday:
          day === new Date().getDate() &&
          month === new Date().getMonth() &&
          year === new Date().getFullYear(),
        hasPosts: postsOnDate.length > 0,
        postCount: postsOnDate.length,
      })
    }

    return days
  }, [currentDate, posts])

  // Get posts for selected date
  const postsForSelectedDate = useMemo(() => {
    if (!selectedDate || !posts) return []

    return posts.filter((post) => {
      if (!post.scheduled_for) return false
      const postDate = new Date(post.scheduled_for)
      return (
        postDate.getDate() === selectedDate.getDate() &&
        postDate.getMonth() === selectedDate.getMonth() &&
        postDate.getFullYear() === selectedDate.getFullYear()
      )
    }).sort((a, b) => {
      const timeA = new Date(a.scheduled_for!).getTime()
      const timeB = new Date(b.scheduled_for!).getTime()
      return timeA - timeB
    })
  }, [selectedDate, posts])

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Calendar</h1>
        <p className="text-gray-400">View and manage scheduled posts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card hoverable>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex gap-2">
                  <button
                    onClick={previousMonth}
                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-medium text-gray-500 uppercase tracking-wide py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarData.map((dayData, index) => (
                  <button
                    key={index}
                    onClick={() => dayData && setSelectedDate(dayData.date)}
                    disabled={!dayData}
                    className={cn(
                      'aspect-square rounded-lg text-sm font-medium transition-all relative',
                      !dayData && 'invisible',
                      dayData?.isToday &&
                        'bg-purple-accent text-white hover:bg-purple-light',
                      dayData?.hasPosts &&
                        !dayData?.isToday &&
                        'bg-gray-800 text-white border border-purple-accent/50 hover:border-purple-accent',
                      !dayData?.isToday &&
                        !dayData?.hasPosts &&
                        'text-gray-400 hover:bg-gray-800 hover:text-white',
                      selectedDate &&
                        dayData?.date.toDateString() === selectedDate.toDateString() &&
                        'ring-2 ring-purple-accent ring-offset-2 ring-offset-black'
                    )}
                  >
                    {dayData?.day}
                    {dayData?.hasPosts && (
                      <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-accent rounded-full"></span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Posts for Selected Date */}
        <div className="lg:col-span-1">
          <Card hoverable className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate
                  ? `Posts for ${selectedDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}`
                  : 'Select a Date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    Click on a date to view scheduled posts
                  </p>
                </div>
              ) : postsForSelectedDate.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm mb-4">
                    No posts scheduled for this date
                  </p>
                  <Link href="/posts/new">
                    <Button variant="primary" className="w-full">
                      Create Post
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {postsForSelectedDate.map((post) => (
                    <Link
                      key={post.id}
                      href={`/posts/${post.id}`}
                      className="block"
                    >
                      <div className="p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">
                        <div className="flex items-start gap-3">
                          {post.image_url && (
                            <div className="w-12 h-12 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                              <img
                                src={post.image_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate mb-1">
                              {post.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(post.scheduled_for!).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
