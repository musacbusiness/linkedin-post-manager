import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

// POST /api/generate/image - Generate image with Replicate
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prompt } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Check if Replicate API token is configured
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'Replicate API token not configured' },
        { status: 500 }
      )
    }

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })

    // Generate image using Stable Diffusion
    console.log('Generating image with prompt:', prompt)

    const output = await replicate.run(
      'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      {
        input: {
          prompt: prompt,
          negative_prompt: 'ugly, blurry, poor quality, distorted',
          width: 1024,
          height: 1024,
          num_outputs: 1,
        },
      }
    )

    // Get the generated image URL
    let imageUrl = Array.isArray(output) ? output[0] : output

    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error('Invalid output from Replicate:', output)
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      )
    }

    // Fix protocol-relative URLs from Replicate
    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl
    }

    console.log('Image generated successfully:', imageUrl)

    // Return the Replicate URL directly
    // Replicate URLs are persistent CDN URLs that don't expire immediately
    // This is simpler than uploading to Supabase and avoids reliability issues
    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate image',
      },
      { status: 500 }
    )
  }
}
