import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import ZAI from 'z-ai-web-dev-sdk'

export const runtime = 'nodejs'
// Long-running VLM call
export const maxDuration = 60

interface GenerateBody {
  imageUrl: string
  brandVoice?: string
  extraContext?: string
}

const HKDRINKS_SYSTEM_PROMPT = `You are the in-house social media copywriter for "HKDrinks", a Hong Kong based community page celebrating Hong Kong's drink culture — from yuenyeung (coffee-tea mix) and silk-stocking milk tea to craft cocktails, bubble tea, artisan coffee, herbal teas and cocktails found across Hong Kong's dai pai dongs, cha chaan tengs, specialty coffee shops, and cocktail bars.

Your job: given an uploaded image of a drink or drink scene, write a Facebook & Instagram caption that:
1. Is warm, friendly, and culturally-rooted to Hong Kong ( Cantonese-English flavour welcomed where natural — e.g. "Siu yeh time" ).
2. Highlights what's actually visible in the image (drink type, glassware, garnishes, setting, time-of-day cues, brand labels if any).
3. Includes sensory and tasting cues that match the drink (e.g. "rich velvety milk tea with that signature stocking-filtered silkiness").
4. Uses 2-4 relevant emojis that match the drink and vibe — not generic.
5. Ends with 5-10 relevant hashtags — a mix of Hong Kong lifestyle (#hkfoodie, #hkdrinks, #cha Chaan Teng) and the specific drink category.

Format your reply EXACTLY as:
---
CAPTION:
<the caption, 1-3 short paragraphs, with emojis inline>

HASHTAGS:
#hashtag1 #hashtag2 ...
---

Do not add any other preamble or commentary.`

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateBody

    if (!body?.imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required.' },
        { status: 400 }
      )
    }

    // Resolve to absolute file path on disk
    const publicPath = path.join(process.cwd(), 'public')
    const absPath = path.join(publicPath, body.imageUrl)

    let base64: string
    let mimeType: string
    try {
      const buf = await fs.readFile(absPath)
      const ext = path.extname(absPath).toLowerCase()
      mimeType =
        ext === '.png'
          ? 'image/png'
          : ext === '.webp'
            ? 'image/webp'
            : ext === '.gif'
              ? 'image/gif'
              : 'image/jpeg'
      base64 = `data:${mimeType};base64,${buf.toString('base64')}`
    } catch (err) {
      console.error('[generate-caption] could not read image', err)
      return NextResponse.json(
        { error: 'Image not found on server. Please re-upload.' },
        { status: 404 }
      )
    }

    const zai = await ZAI.create()

    const userText = [
      'Please write a caption for the attached image.',
      body.brandVoice
        ? `Brand voice guidance: ${body.brandVoice}`
        : '',
      body.extraContext ? `Additional context: ${body.extraContext}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    const completion = await zai.chat.completions.createVision({
      model: 'glm-4.5v',
      messages: [
        { role: 'system', content: HKDRINKS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: userText },
            { type: 'image_url', image_url: { url: base64 } },
          ],
        },
      ],
    })

    const raw = completion?.choices?.[0]?.message?.content ?? ''

    // Parse out caption + hashtags from the structured reply
    let caption = raw
    let hashtags = ''

    const captionMatch = raw.match(
      /CAPTION:\s*([\s\S]*?)(?:\n\s*HASHTAGS:|$)/i
    )
    const hashtagMatch = raw.match(/HASHTAGS:\s*([\s\S]*?)$/i)

    if (captionMatch) caption = captionMatch[1].trim()
    if (hashtagMatch) hashtags = hashtagMatch[1].trim()

    // Fallbacks if model didn't follow format
    if (!caption) caption = raw.trim()

    return NextResponse.json({
      caption,
      hashtags,
      raw,
    })
  } catch (err) {
    console.error('[generate-caption] error', err)
    return NextResponse.json(
      {
        error:
          'Caption generation failed. The image may be too large or the model is busy — please try again.',
      },
      { status: 500 }
    )
  }
}
