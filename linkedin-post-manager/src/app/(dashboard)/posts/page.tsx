'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PostsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Posts</h1>
        <p className="text-gray-400">Manage your LinkedIn posts</p>
      </div>

      <div className="flex gap-4">
        <Link href="/posts/new">
          <Button variant="primary">Create Post</Button>
        </Link>
      </div>

      <Card hoverable>
        <CardHeader>
          <CardTitle>No Posts Yet</CardTitle>
          <CardDescription>Create your first post to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              Posts will appear here once you create them
            </p>
            <Link href="/posts/new">
              <Button variant="primary">Create First Post</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
