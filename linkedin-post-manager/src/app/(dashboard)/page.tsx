'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Calendar, CheckCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  // Placeholder stats - will be replaced with real data in Phase 2
  const stats = [
    {
      title: 'Total Posts',
      value: '127',
      description: '+12 this month',
      icon: FileText,
      color: 'purple',
    },
    {
      title: 'Scheduled',
      value: '8',
      description: 'Next 7 days',
      icon: Calendar,
      color: 'blue',
    },
    {
      title: 'Posted',
      value: '94',
      description: '+18 this month',
      icon: CheckCircle,
      color: 'green',
    },
    {
      title: 'Engagement Rate',
      value: '4.2%',
      description: 'Average per post',
      icon: TrendingUp,
      color: 'amber',
    },
  ]

  const colorMap = {
    purple: 'bg-purple-accent/10 text-purple-accent',
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    amber: 'bg-amber-500/10 text-amber-400',
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Welcome to LinkedIn Post Manager</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          const colorClass = colorMap[stat.color as keyof typeof colorMap]
          return (
            <Card key={stat.title} hoverable>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${colorClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                    {stat.title}
                  </span>
                </div>

                <div>
                  <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                  <p className="text-sm text-gray-400">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Post Card */}
        <Card hoverable className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Create Post</CardTitle>
            <CardDescription>Write and publish a new post</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/posts/new" className="block">
              <Button variant="primary" className="w-full">
                New Post
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Generate Post Card */}
        <Card hoverable className="lg:col-span-1">
          <CardHeader>
            <CardTitle>AI Generate</CardTitle>
            <CardDescription>Use AI to create posts</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="secondary" className="w-full">
              Generate
            </Button>
          </CardContent>
        </Card>

        {/* View Calendar Card */}
        <Card hoverable className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
            <CardDescription>View scheduled posts</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/calendar" className="block">
              <Button variant="secondary" className="w-full">
                View Calendar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Posts Section */}
      <Card hoverable>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>Your latest LinkedIn posts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No posts yet</p>
            <Link href="/posts">
              <Button variant="primary">View All Posts</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
