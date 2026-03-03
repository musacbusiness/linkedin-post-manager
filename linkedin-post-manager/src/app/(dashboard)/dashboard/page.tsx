'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Calendar, CheckCircle, TrendingUp, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { usePosts } from '@/hooks/use-posts'
import { useMemo } from 'react'
import NextImage from 'next/image'

export default function DashboardPage() {
  const { data: posts = [], isLoading } = usePosts({})

  // Calculate stats from real data
  const stats = useMemo(() => {
    const totalPosts = posts.length
    const scheduledPosts = posts.filter(p => p.status === 'scheduled').length
    const postedPosts = posts.filter(p => p.status === 'posted').length

    return [
      {
        title: 'Total Posts',
        value: totalPosts.toString(),
        description: `${posts.filter(p => {
          const createdDate = new Date(p.created_at)
          const now = new Date()
          const thisMonth = now.getFullYear() === createdDate.getFullYear() &&
                            now.getMonth() === createdDate.getMonth()
          return thisMonth
        }).length} this month`,
        icon: FileText,
        color: 'purple',
      },
      {
        title: 'Scheduled',
        value: scheduledPosts.toString(),
        description: 'Awaiting posting',
        icon: Calendar,
        color: 'blue',
      },
      {
        title: 'Posted',
        value: postedPosts.toString(),
        description: `${posts.filter(p => {
          if (p.status !== 'posted') return false
          const postedDate = p.posted_at ? new Date(p.posted_at) : null
          if (!postedDate) return false
          const now = new Date()
          const thisMonth = now.getFullYear() === postedDate.getFullYear() &&
                            now.getMonth() === postedDate.getMonth()
          return thisMonth
        }).length} this month`,
        icon: CheckCircle,
        color: 'green',
      },
      {
        title: 'Pending Review',
        value: posts.filter(p => p.status === 'pending_review').length.toString(),
        description: 'Awaiting approval',
        icon: TrendingUp,
        color: 'amber',
      },
    ]
  }, [posts])

  // Get recent posts (last 5)
  const recentPosts = useMemo(() => {
    return posts
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }, [posts])

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
        {isLoading ? (
          // Loading skeletons
          [0, 1, 2, 3].map((i) => (
            <Card key={i} hoverable>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-lg bg-gray-800 animate-pulse">
                    <div className="w-6 h-6 bg-gray-700 rounded" />
                  </div>
                  <div className="h-4 bg-gray-800 rounded w-16 animate-pulse" />
                </div>
                <div>
                  <div className="h-8 bg-gray-800 rounded w-12 mb-2 animate-pulse" />
                  <div className="h-4 bg-gray-800 rounded w-24 animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          stats.map((stat) => {
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
          })
        )}
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
            <Link href="/posts/generate" className="block">
              <Button variant="secondary" className="w-full">
                Generate
              </Button>
            </Link>
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-purple-accent animate-spin" />
            </div>
          ) : recentPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No posts yet</p>
              <Link href="/posts">
                <Button variant="primary">View All Posts</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-4 p-4 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-colors">
                  {/* Thumbnail */}
                  {post.image_url && (
                    <div className="flex-shrink-0 w-20 h-20 rounded overflow-hidden bg-gray-800">
                      <NextImage
                        src={post.image_url}
                        alt={post.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  )}

                  {/* Post Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-white truncate">{post.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2 mt-1">{post.post_content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded ${
                          post.status === 'pending_review'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : post.status === 'approved'
                            ? 'bg-green-500/20 text-green-400'
                            : post.status === 'scheduled'
                            ? 'bg-blue-500/20 text-blue-400'
                            : post.status === 'posted'
                            ? 'bg-purple-accent/20 text-purple-light'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {post.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Edit Link */}
                  <Link href={`/posts/${post.id}`} className="flex-shrink-0">
                    <Button variant="secondary" size="sm">
                      Edit
                    </Button>
                  </Link>
                </div>
              ))}
              <Link href="/posts" className="block mt-4">
                <Button variant="secondary" className="w-full">
                  View All Posts
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
