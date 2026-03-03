'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Sparkles } from 'lucide-react'

export default function CreatePostMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleManualCreate = () => {
    setIsOpen(false)
    router.push('/posts/new')
  }

  const handleAIGenerate = () => {
    setIsOpen(false)
    router.push('/posts/generate')
  }

  return (
    <>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        <Plus className="w-5 h-5 mr-2" />
        Create Post
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create a Post</DialogTitle>
            <DialogDescription>Choose how to create your post</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 py-4">
            {/* Manual Creation Option */}
            <button
              onClick={handleManualCreate}
              className="p-4 border border-gray-700 rounded-lg hover:bg-gray-900 hover:border-purple-accent transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-purple-accent/10">
                  <Plus className="w-5 h-5 text-purple-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Create Manually</h4>
                  <p className="text-xs text-gray-400 mt-1">Write your post content directly</p>
                </div>
              </div>
            </button>

            {/* AI Generation Option */}
            <button
              onClick={handleAIGenerate}
              className="p-4 border border-gray-700 rounded-lg hover:bg-gray-900 hover:border-purple-accent transition-all text-left group"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-800 rounded-lg group-hover:bg-purple-accent/10">
                  <Sparkles className="w-5 h-5 text-purple-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Generate with AI</h4>
                  <p className="text-xs text-gray-400 mt-1">Use AI to generate a post</p>
                </div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
