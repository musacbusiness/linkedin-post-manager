import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { compositeAnchor } from '@/lib/image/composite'
import type { AnchorConfig } from '@/types/anchor'

// POST /api/generate/image
// Body: { prompt, negativePrompt?, anchorConfig? }
// If anchorConfig is provided, composites a visual anchor onto the SD base image.
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
    const { prompt, negativePrompt, anchorConfig } = body as {
      prompt: string
      negativePrompt?: string
      anchorConfig?: AnchorConfig
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: 'Replicate API token not configured' }, { status: 500 })
    }

    // Read user's model preference
    const { data: settingsRow } = await supabase
      .from('pipeline_settings')
      .select('image_style')
      .eq('user_id', user.id)
      .maybeSingle()

    const PRODUCTION_MODEL = 'google/nano-banana-pro'
    const TESTING_MODEL = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b'
    const modelMode = settingsRow?.image_style || 'testing'
    const selectedModel = modelMode === 'production' ? PRODUCTION_MODEL : TESTING_MODEL

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN })

    console.log(`[Image] Generating base with model: ${selectedModel} (${modelMode})`)
    console.log('[Image] Prompt:', prompt.substring(0, 120))
    if (anchorConfig) console.log('[Image] Anchor type:', anchorConfig.type)

    const sdNegativePrompt = negativePrompt ||
      '(text:1.6),(words:1.6),(letters:1.6),(numbers:1.5),(readable:1.5),(legible:1.5), any content on screen, any interface on screen, illustration, digital art, vector, cartoon, anime, 3D render, stock photo pose, looking at camera, fake smile, staged, bad anatomy, deformed hands, blurry, low quality, oversaturated, dark moody, cyberpunk, neon, fantasy, sci-fi, hologram'

    const output = await replicate.run(
      selectedModel as `${string}/${string}` | `${string}/${string}:${string}`,
      {
        input: {
          prompt,
          negative_prompt: sdNegativePrompt,
          width: 1024,
          height: 1024,
          num_outputs: 1,
        },
      }
    )

    let replicateUrl = Array.isArray(output) ? output[0] : output
    if (!replicateUrl || typeof replicateUrl !== 'string') {
      return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
    }
    if (replicateUrl.startsWith('//')) replicateUrl = 'https:' + replicateUrl

    console.log('[Image] Base generated:', replicateUrl)

    // Fetch raw base image
    const imageResponse = await fetch(replicateUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch base image: ${imageResponse.statusText}`)
    }
    let imageBuffer: Buffer | Uint8Array = Buffer.from(await imageResponse.arrayBuffer())
    console.log('[Image] Base image fetched, size:', imageBuffer.byteLength, 'bytes')

    // Stage 2: composite visual anchor if provided
    if (anchorConfig) {
      try {
        console.log('[Image] Compositing anchor:', anchorConfig.type)
        imageBuffer = await compositeAnchor(imageBuffer, anchorConfig)
        console.log('[Image] Anchor composited, final size:', imageBuffer.byteLength, 'bytes')
      } catch (compositeErr) {
        console.error('[Image] Composite failed, using base image:', compositeErr)
        // Graceful degradation — upload base image without overlay
      }
    }

    // Upload final image to Supabase Storage
    try {
      const timestamp = Date.now()
      const filename = `generated-${timestamp}-${Math.random().toString(36).substring(7)}.jpg`

      const { data, error } = await supabase.storage
        .from('generated-images')
        .upload(filename, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: false,
        })

      if (error) throw new Error(`Supabase upload failed: ${error.message}`)
      console.log('[Image] Uploaded to Supabase:', data)

      const { data: publicData } = supabase.storage
        .from('generated-images')
        .getPublicUrl(filename)

      return NextResponse.json({ imageUrl: publicData.publicUrl })
    } catch (uploadError) {
      console.error('[Image] Upload failed, falling back to Replicate URL:', uploadError)
      return NextResponse.json({ imageUrl: replicateUrl })
    }
  } catch (error) {
    console.error('[Image] Generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate image' },
      { status: 500 }
    )
  }
}
