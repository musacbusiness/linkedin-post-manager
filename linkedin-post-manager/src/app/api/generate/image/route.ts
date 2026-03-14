import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Replicate from 'replicate'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'

const execFileAsync = promisify(execFile)

// POST /api/generate/image - Generate image with Replicate + optional compositing
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
    const { prompt, anchorConfig } = body

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

    console.log(`Generating base image with model: ${selectedModel}`)
    console.log('Prompt:', prompt)

    const output = await replicate.run(
      selectedModel as `${string}/${string}` | `${string}/${string}:${string}`,
      {
        input: {
          prompt,
          negative_prompt: '(content on screen:1.5), (interface on screen:1.5), (text on screen:1.6), (graphics on screen:1.4), (dashboard on screen:1.4), (loading screen:1.3), (gradient on screen:1.3), ugly, blurry, poor quality, distorted',
          width: 1024,
          height: 1024,
          num_outputs: 1,
        },
      }
    )

    let imageUrl = Array.isArray(output) ? output[0] : output

    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error('Invalid output from Replicate:', output)
      return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 })
    }

    if (imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl
    }

    console.log('Base image generated:', imageUrl)

    // Fetch the image buffer from Replicate
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from Replicate: ${imageResponse.statusText}`)
    }
    const imageBuffer = await imageResponse.arrayBuffer()

    let finalBuffer: Buffer = Buffer.from(imageBuffer)
    let finalContentType = 'image/png'

    // ── Run Python compositing pipeline if anchorConfig is provided ───────────
    if (anchorConfig && typeof anchorConfig === 'object') {
      const ts = Date.now()
      const baseImagePath = path.join(tmpdir(), `base-${ts}.png`)
      const outputImagePath = path.join(tmpdir(), `composited-${ts}.png`)

      try {
        // Write base image to temp file
        await writeFile(baseImagePath, Buffer.from(imageBuffer))

        // Locate the Python script relative to the project root
        const scriptPath = path.join(process.cwd(), 'scripts', 'image_pipeline.py')
        const anchorJson = JSON.stringify(anchorConfig)

        console.log('Running image pipeline:', scriptPath)
        console.log('Anchor config type:', anchorConfig.type)

        const { stdout, stderr } = await execFileAsync(
          'python3',
          [scriptPath, '--anchor_config', anchorJson, '--base_image', baseImagePath, '--output', outputImagePath],
          { timeout: 120_000 }
        )

        if (stderr) console.log('[python pipeline stderr]', stderr)
        if (stdout) {
          try {
            const result = JSON.parse(stdout.trim().split('\n').pop() || '{}')
            if (result.error) {
              console.error('Pipeline error:', result.error)
            } else {
              console.log('Pipeline result:', result)
              finalBuffer = await readFile(outputImagePath)
              finalContentType = 'image/png'
            }
          } catch {
            console.error('Could not parse pipeline output:', stdout)
          }
        }
      } catch (err) {
        console.error('Python pipeline failed, using raw base image:', err)
        // Fall through — use the raw Replicate image
      } finally {
        // Clean up temp files
        await unlink(baseImagePath).catch(() => {})
        await unlink(outputImagePath).catch(() => {})
      }
    }

    // ── Upload to Supabase Storage ─────────────────────────────────────────────
    try {
      const timestamp = Date.now()
      const filename = `generated-${timestamp}-${Math.random().toString(36).substring(7)}.png`

      const { data, error } = await supabase.storage
        .from('generated-images')
        .upload(filename, finalBuffer, {
          contentType: finalContentType,
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
      console.error('Supabase upload failed, falling back to Replicate URL:', uploadError)
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
