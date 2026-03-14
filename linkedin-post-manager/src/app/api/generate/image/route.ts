import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'

const DEFAULT_NEGATIVE_PROMPT =
  '(text:1.5), (words:1.5), (letters:1.5), (numbers:1.4), (readable:1.4), (legible:1.4), ' +
  'watermark, signature, logo, label, caption, ' +
  'illustration, digital art, vector art, cartoon, anime, 3D render, CGI, painting, ' +
  'stock photo pose, looking at camera, fake smile, staged handshake, thumbs up, ' +
  'bad anatomy, deformed hands, extra fingers, missing fingers, disfigured, ' +
  'ugly, blurry, low quality, low resolution, pixelated, oversaturated, ' +
  'plastic skin, airbrushed, uncanny valley, ' +
  'cyberpunk neon, fantasy, sci-fi, futuristic hologram, glowing elements'

// POST /api/generate/image - Generate image with Replicate
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { prompt, negativePrompt } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

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

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })

    console.log(`Generating image with model: ${selectedModel} (mode: ${modelMode})`)
    console.log('Prompt:', prompt)

    const output = await replicate.run(
      selectedModel as `${string}/${string}` | `${string}/${string}:${string}`,
      {
        input: {
          prompt,
          negative_prompt: negativePrompt || DEFAULT_NEGATIVE_PROMPT,
          width: 1024,
          height: 1024,
          num_outputs: 1,
        },
      }
    )

    let imageUrl = Array.isArray(output) ? output[0] : output

    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error('Invalid output from Replicate:', output)
      return NextResponse.json(
        { error: 'Failed to generate image' },
        { status: 500 }
      )
    }

    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl
    }

    console.log('Image generated successfully:', imageUrl)

    // Upload the image to Supabase Storage
    try {
      console.log('Uploading image to Supabase Storage...')

      const imageResponse = await fetch(imageUrl)
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image from Replicate: ${imageResponse.statusText}`)
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      console.log('Image fetched from Replicate, size:', imageBuffer.byteLength, 'bytes')

      const timestamp = Date.now()
      const filename = `generated-${timestamp}-${Math.random().toString(36).substring(7)}.png`

      const { data, error } = await supabase.storage
        .from('generated-images')
        .upload(filename, Buffer.from(imageBuffer), {
          contentType: 'image/png',
          upsert: false,
        })

      if (error) {
        console.error('Supabase upload error:', error)
        throw new Error(`Failed to upload to Supabase: ${error.message}`)
      }

      console.log('Image uploaded to Supabase:', data)

      const { data: publicData } = supabase.storage
        .from('generated-images')
        .getPublicUrl(filename)

      return NextResponse.json({ imageUrl: publicData.publicUrl })
    } catch (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError)
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
