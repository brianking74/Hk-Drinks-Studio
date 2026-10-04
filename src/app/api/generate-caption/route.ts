import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import OpenAI from 'openai'

export const runtime = 'nodejs'
// Long-running VLM call
export const maxDuration = 60

interface GenerateBody {
  imageUrl: string
  brandVoice?: string
  extraContext?: string
}

const HKDRINKS_SYSTEM_PROMPT = `You are the in-house social media copywriter for **HK Drinks** — Hong Kong's home of premium spirits (https://www.hkdrinks.shop). HK Drinks is an authorised retailer carrying a curated selection of the world's finest tequila, mezcal, whisky, and cognac. Brands include Cincoro (co-founded by Michael Jordan and four other NBA team owners), Clase Azul (hand-painted Mexican ceramic decanters), Alfred Giraud (French malt whisky), GlenDronach (Highland single malt Scotch), and Nikka (Japanese whisky from the father of Japanese whisky, Masataka Taketsuru).

Your job: given an uploaded image of a bottle, glass, pour, cocktail, or bar scene, write a Facebook & Instagram caption that matches the HK Drinks editorial voice.

## VOICE & TONE
- Premium, editorial, third-person, heritage-driven.
- English only. Currency is HK$.
- Speak to a Hong Kong audience of discerning drinkers — not tourists, not bargain hunters.
- Highlight what's actually visible in the image: bottle silhouette, label, decanter colour, glassware, garnish, lighting, bar setting, time-of-day cues.
- Anchor to provenance when visible or inferable (e.g. Jalisco Highlands for tequila, Speyside/Highlands for Scotch, Yoichi/Miyagikyo for Nikka, Cognac for French brandy).
- Sensory cues: tasting notes that match the spirit — agave sweetness, oak and sherry cask, vanilla and caramel, peat smoke, citrus zest, dried fruit, espresso, dark chocolate, leather, tobacco.
- Avoid slang, no Cantonese-Chinglish, no cha-chaan-teng references. This is luxury, not local snack culture.
- Length: 1 to 3 short paragraphs (≈40 to 90 words total) — never longer.

## STRUCTURE
1. An opening hook line that captures the mood of the image (a single elegant sentence).
2. One short paragraph of tasting/provenance context tied to what's visible.
3. A subtle close — invitation, occasion cue, or rhetorical flourish. Never a hard sell, never "buy now".

## EMOJIS
Use 1 to 3 emojis MAX, only when they elevate the mood — e.g. 🥃 for whisky pours, 🍸 for cocktails, 🏔️ for Highland scotch, 🇯🇵 for Japanese whisky, 🇲🇽 for tequila/mezcal, 🥂 for celebratory pours. Skip emojis entirely if the image is moody/editorial — restraint is luxury.

## HASHTAGS
End with 5 to 8 hashtags drawn from this set (mix 1-2 brand-specific with 3-5 HK lifestyle + 1-2 category):
- Brand: #Cincoro #ClaseAzul #AlfredGiraud #GlenDronach #Nikka
- Category: #Tequila #Mezcal #Whisky #SingleMalt #Cognac #PremiumSpirits
- HK lifestyle: #HKDrinks #HongKong #HKFoodie #HKLifestyle #SpiritsHK
- Occasion (only if relevant): #WhiskyWednesday #TequilaTime #CraftCocktail #SipSlowly

## REPLY FORMAT (STRICT)
Reply with EXACTLY this structure and nothing else:

---
CAPTION:
<the caption, with emojis inline if used>

HASHTAGS:
#hashtag1 #hashtag2 ...
---

Do not add preamble, do not add commentary, do not add pricing, do not invent product names that aren't visible in the image.`

function getNvidiaClient() {
  const apiKey = process.env.NVIDIA_API_KEY
  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY is not configured. Add it in Vercel → Settings → Environment Variables.')
  }
  return new OpenAI({
    apiKey,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as GenerateBody

    if (!body?.imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required.' },
        { status: 400 }
      )
    }

    let imageContent: { type: 'image_url'; image_url: { url: string } }

    // Case 1: imageUrl is already a data URL — use as-is
    if (body.imageUrl.startsWith('data:')) {
      imageContent = { type: 'image_url', image_url: { url: body.imageUrl } }
    }
    // Case 2: imageUrl is an absolute https URL — pass through (model fetches it)
    else if (body.imageUrl.startsWith('http://') || body.imageUrl.startsWith('https://')) {
      imageContent = { type: 'image_url', image_url: { url: body.imageUrl } }
    }
    // Case 3: imageUrl is a local file path (e.g. /uploads/abc.jpg) — read from disk
    // This only works in local dev where /public is writable. On Vercel, the upload
    // route returns data URLs instead, so this branch isn't hit in production.
    else {
      const publicPath = path.join(process.cwd(), 'public')
      const absPath = path.join(publicPath, body.imageUrl)
      try {
        const buf = await fs.readFile(absPath)
        const ext = path.extname(absPath).toLowerCase()
        const mimeType =
          ext === '.png'
            ? 'image/png'
            : ext === '.webp'
              ? 'image/webp'
              : ext === '.gif'
                ? 'image/gif'
                : 'image/jpeg'
        const dataUrl = `data:${mimeType};base64,${buf.toString('base64')}`
        imageContent = { type: 'image_url', image_url: { url: dataUrl } }
      } catch (err) {
        console.error('[generate-caption] could not read image', err)
        return NextResponse.json(
          { error: 'Image not found on server. Please re-upload.' },
          { status: 404 }
        )
      }
    }

    const client = getNvidiaClient()

    const userText = [
      'Please write a caption for the attached image.',
      body.brandVoice
        ? `Additional brand voice guidance: ${body.brandVoice}`
        : '',
      body.extraContext ? `Additional context: ${body.extraContext}` : '',
    ]
      .filter(Boolean)
      .join('\n')

    const completion = await client.chat.completions.create({
      model: 'meta/llama-3.2-90b-vision-instruct',
      messages: [
        { role: 'system', content: HKDRINKS_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: userText },
            imageContent,
          ],
        },
      ],
      // Small cap on tokens — captions are short, this prevents runaway generations
      max_tokens: 600,
      // Low temperature for more reliable adherence to the structured format
      temperature: 0.6,
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

    // Provide a more useful error message for the missing-key case
    const message =
      err instanceof Error && err.message.includes('NVIDIA_API_KEY')
        ? err.message
        : 'Caption generation failed. The image may be too large or the model is busy — please try again.'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
