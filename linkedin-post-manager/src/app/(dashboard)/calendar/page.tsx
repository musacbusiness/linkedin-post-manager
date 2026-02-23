'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CalendarPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Calendar</h1>
        <p className="text-gray-400">View and manage scheduled posts</p>
      </div>

      <Card hoverable>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>Calendar view is coming in Phase 4</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-400">
              The calendar view will be available in the next update
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
