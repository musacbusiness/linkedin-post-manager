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
    const imageUrl = Array.isArray(output) ? output[0] : output

    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error('Invalid output from Replicate:', output)
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      )
    }

    console.log('Image generated successfully:', imageUrl)

    // Upload to Supabase Storage
    try {
      // Download the image from Replicate
      const imageResponse = await fetch(imageUrl)
      const imageBlob = await imageResponse.blob()
      const imageBuffer = await imageBlob.arrayBuffer()

      // Generate unique filename
      const filename = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.png`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filename, imageBuffer, {
          contentType: 'image/png',
          upsert: false,
        })

      if (uploadError) {
        console.error('Supabase upload error:', uploadError)
        // Fall back to returning the Replicate URL if upload fails
        return NextResponse.json({ imageUrl })
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(uploadData.path)

      return NextResponse.json({ imageUrl: publicUrlData.publicUrl })
    } catch (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError)
      // Fall back to returning the Replicate URL
      return NextResponse.json({ imageUrl })
    }
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
