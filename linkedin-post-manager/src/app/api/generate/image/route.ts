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

    // Read user's image generation model preference
    const { data: settingsRow } = await supabase
      .from('pipeline_settings')
      .select('image_style')
      .eq('user_id', user.id)
      .maybeSingle()

    const PRODUCTION_MODEL = 'google/nano-banana-pro'
    const TESTING_MODEL = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b'
    const modelMode = settingsRow?.image_style || 'testing'
    const selectedModel = modelMode === 'production' ? PRODUCTION_MODEL : TESTING_MODEL

    // Initialize Replicate client
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })

    console.log(`Generating image with model: ${selectedModel} (mode: ${modelMode})`)
    console.log('Prompt:', prompt)

    const output = await replicate.run(
      selectedModel as `${string}/${string}` | `${string}/${string}:${string}`,
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

    // Upload the image to Supabase Storage
    try {
      console.log('Uploading image to Supabase Storage...')

      // Fetch the image from Replicate
      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image from Replicate: ${imageResponse.statusText}`)
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      console.log('Image fetched from Replicate, size:', imageBuffer.byteLength, 'bytes')

      // Generate unique filename with timestamp
      const timestamp = Date.now()
      const filename = `generated-${timestamp}-${Math.random().toString(36).substring(7)}.png`
      const filepath = filename

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('generated-images')
        .upload(filepath, Buffer.from(imageBuffer), {
          contentType: 'image/png',
          upsert: false,
        })

      if (error) {
        console.error('Supabase upload error:', error)
        throw new Error(`Failed to upload to Supabase: ${error.message}`)
      }

      console.log('Image uploaded to Supabase:', data)

      // Get the public URL
      const { data: publicData } = supabase.storage
        .from('generated-images')
        .getPublicUrl(filepath)

      const supabaseImageUrl = publicData.publicUrl
      console.log('Supabase image URL:', supabaseImageUrl)

      return NextResponse.json({ imageUrl: supabaseImageUrl })
    } catch (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError)
      // Fallback to Replicate URL if Supabase upload fails
      console.log('Falling back to Replicate URL due to upload error')
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
