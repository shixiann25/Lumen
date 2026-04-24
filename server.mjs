import dotenv from 'dotenv'
if (process.env.NODE_ENV !== 'production') dotenv.config()
import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'

console.log('[startup] NODE_ENV:', process.env.NODE_ENV)
console.log('[startup] PORT:', process.env.PORT)
console.log('[startup] RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT)
console.log('[startup] RAILWAY_SERVICE_NAME:', process.env.RAILWAY_SERVICE_NAME)
console.log('[startup] ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY)
console.log('[startup] TEST_VAR:', process.env.TEST_VAR)
console.log('[startup] total env vars:', Object.keys(process.env).length)

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Serve static frontend in production
if (isProd) {
  const distPath = join(__dirname, 'dist')
  app.use(express.static(distPath))
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 80000 })

// --- EXIF simulation for gallery photos ---
const EXIF_PRESETS = {
  portrait: {
    apertures: ['1.2', '1.4', '1.8', '2.0', '2.8'],
    shutters: ['1/125s', '1/250s', '1/500s', '1/1000s'],
    isos: ['100', '200', '400', '640', '800'],
    focals: [50, 85, 100, 135],
    cameras: ['Sony A7III', 'Canon EOS R5', 'Nikon Z6II', 'Fujifilm X-T5', 'Sony A7IV'],
  },
  landscape: {
    apertures: ['5.6', '8', '11', '16'],
    shutters: ['1/60s', '1/125s', '1/250s', '2s', '8s', '30s'],
    isos: ['100', '100', '200'],
    focals: [14, 16, 24, 35],
    cameras: ['Sony A7R V', 'Canon EOS R5', 'Nikon Z7II', 'Fujifilm GFX 100S'],
  },
  street: {
    apertures: ['2.8', '4', '5.6', '8'],
    shutters: ['1/250s', '1/500s', '1/1000s'],
    isos: ['400', '800', '1600', '3200'],
    focals: [28, 35, 50],
    cameras: ['Fujifilm X100V', 'Leica M11', 'Ricoh GR IIIx', 'Sony A6700'],
  },
  still: {
    apertures: ['1.8', '2.8', '4', '5.6'],
    shutters: ['1/60s', '1/100s', '1/200s', '1/250s'],
    isos: ['100', '200', '400'],
    focals: [50, 85, 100],
    cameras: ['Canon EOS R6 II', 'Nikon Z5II', 'Sony A7C II', 'Fujifilm X-T4'],
  },
}

const CATEGORY_TAGS = {
  portrait: ['人像', '大光圈', '虚化'],
  landscape: ['风景', '大景深', '自然'],
  street: ['街头', '纪实', '抓拍'],
  still: ['静物', '美食', '微距'],
}

function generateExif(category) {
  const preset = EXIF_PRESETS[category] || EXIF_PRESETS.portrait
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
  return {
    aperture: pick(preset.apertures),
    shutterSpeed: pick(preset.shutters),
    iso: pick(preset.isos),
    focalLength: pick(preset.focals),
    camera: pick(preset.cameras),
  }
}

// --- Gallery endpoint (Unsplash) ---
const UNSPLASH_QUERIES = {
  portrait: [
    'portrait woman natural light outdoor smiling',
    'portrait man candid street documentary',
    'elderly person portrait face wisdom',
    'child kid portrait playful natural light',
    'young woman golden hour backlit warm',
    'man portrait urban street candid',
  ],
  landscape: [
    'landscape golden hour sunrise mountain',
    'ocean beach seascape dramatic sky',
    'forest misty morning light nature',
    'rural countryside farm scenic wide',
    'city skyline dusk architecture',
  ],
  street: [
    'street candid people city color',
    'market crowd documentary urban',
    'rainy street city reflection night',
    'alley pedestrian urban life',
    'street food vendor asia travel',
  ],
  still: [
    'coffee cup cafe morning light',
    'food table natural light minimal',
    'flowers bouquet soft light close',
    'kitchen ingredients cooking natural',
    'book desk minimal lifestyle',
  ],
}

const UNSPLASH_ORIENTATION = {
  portrait: 'portrait',
  landscape: 'landscape',
  street: 'squarish',
  still: 'squarish',
}

function mapPhoto(photo, category) {
  return {
    id: photo.id,
    thumb: photo.urls.small,
    full: photo.urls.regular,
    title: photo.alt_description || photo.description || '摄影作品',
    photographer: photo.user.name,
    photographerLink: `${photo.user.links.html}?utm_source=lumen&utm_medium=referral`,
    color: photo.color,
    category,
    tags: CATEGORY_TAGS[category] || [],
    exif: generateExif(category),
  }
}

async function fetchUnsplashPhotos(query, orientation, perPage, accessKey) {
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&page=1&orientation=${orientation}&content_filter=high&order_by=relevant`
  const response = await fetch(url, { headers: { Authorization: `Client-ID ${accessKey}` } })
  if (!response.ok) throw new Error(`Unsplash error ${response.status}`)
  const data = await response.json()
  return data.results
}

app.get('/api/gallery', async (req, res) => {
  const { category = 'portrait', page = 1 } = req.query
  const accessKey = process.env.UNSPLASH_ACCESS_KEY

  if (!accessKey || accessKey === 'your_unsplash_key_here') {
    return res.status(503).json({ error: 'UNSPLASH_ACCESS_KEY_MISSING' })
  }

  try {
    // Featured: fetch 3 photos from each of the 4 categories, shuffle and return 12
    if (category === 'featured') {
      const cats = ['portrait', 'landscape', 'street', 'still']
      const results = await Promise.all(cats.map(async (cat) => {
        const catQueries = UNSPLASH_QUERIES[cat]
        const query = catQueries[Math.floor(Math.random() * catQueries.length)]
        const orientation = UNSPLASH_ORIENTATION[cat] || 'squarish'
        const photos = await fetchUnsplashPhotos(query, orientation, 5, accessKey)
        return photos.slice(0, 3).map(p => mapPhoto(p, cat))
      }))
      const photos = results.flat().sort(() => Math.random() - 0.5)
      return res.json({ photos, total: photos.length, totalPages: 1, page: 1 })
    }

    // Other categories: rotate through queries per page
    const queries = UNSPLASH_QUERIES[category] || UNSPLASH_QUERIES.portrait
    const queryIndex = (Number(page) - 1) % queries.length
    const query = queries[queryIndex]
    const orientation = UNSPLASH_ORIENTATION[category] || 'squarish'

    const results = await fetchUnsplashPhotos(query, orientation, 12, accessKey)
    const photos = results.map(p => mapPhoto(p, category))

    res.json({ photos, total: photos.length * queries.length, totalPages: queries.length, page: Number(page) })
  } catch (err) {
    console.error('Unsplash error:', err)
    res.status(500).json({ error: err.message })
  }
})

// --- AI analyze endpoint ---
function buildExifText(exif, lang = 'zh') {
  if (lang === 'en') {
    if (!exif) return '(No EXIF data available — may be a screenshot or processed image)'
    const wb = exif.whiteBalance !== undefined
      ? (exif.whiteBalance === 0 ? 'Auto (AWB)' : 'Manual')
      : (exif.whiteBalanceMode || 'Unknown')
    return `
EXIF Data:
- Aperture: ${exif.aperture ? `f/${exif.aperture}` : 'Unknown'}
- Shutter Speed: ${exif.shutterSpeed || exif.exposureTime || 'Unknown'}
- ISO: ${exif.iso || 'Unknown'}
- Focal Length: ${exif.focalLength ? `${exif.focalLength}mm` : 'Unknown'}
- White Balance: ${wb}
- Exposure Mode: ${exif.exposureMode === 0 ? 'Auto Exposure' : exif.exposureMode === 1 ? 'Manual Exposure' : (exif.exposureProgram || 'Unknown')}
- Date/Time: ${exif.dateTime || 'Unknown'}
- Camera: ${exif.make ? `${exif.make} ${exif.model || ''}` : (exif.camera || 'Unknown')}
`.trim()
  }
  if (!exif) return '（未能读取到 EXIF 数据，可能是截图或经过处理的图片）'
  const wb = exif.whiteBalance !== undefined
    ? (exif.whiteBalance === 0 ? '自动（AWB）' : '手动')
    : (exif.whiteBalanceMode || '未知')
  return `
EXIF 参数信息：
- 光圈：${exif.aperture ? `f/${exif.aperture}` : '未知'}
- 快门速度：${exif.shutterSpeed || exif.exposureTime || '未知'}
- ISO：${exif.iso || '未知'}
- 焦段：${exif.focalLength ? `${exif.focalLength}mm` : '未知'}
- 白平衡：${wb}
- 曝光模式：${exif.exposureMode === 0 ? '自动曝光' : exif.exposureMode === 1 ? '手动曝光' : (exif.exposureProgram || '未知')}
- 拍摄时间：${exif.dateTime || '未知'}
- 相机型号：${exif.make ? `${exif.make} ${exif.model || ''}` : (exif.camera || '未知')}
`.trim()
}

const FOCUS_LABEL = {
  exposure: '曝光参数',
  light: '用光分析',
  composition: '构图',
  focal: '焦段选择',
  manual: '手动模式',
  portrait: '人像用光',
}

const FOCUS_LABEL_EN = {
  exposure: 'exposure settings',
  light: 'lighting analysis',
  composition: 'composition',
  focal: 'focal length choice',
  manual: 'manual mode',
  portrait: 'portrait lighting',
}

const ANALYZE_PROMPT = (exifText, hasPortrait, userContext = {}, lang = 'zh') => {
  const { device, focusAreas = [], focusNote = '' } = userContext

  if (lang === 'en') {
    const deviceLine = device
      ? `The user's camera/device: ${device}`
      : 'No device info provided — infer from EXIF camera model or give general advice.'
    const focusLine = focusAreas.length > 0
      ? `The user wants to focus on: ${focusAreas.map(f => FOCUS_LABEL_EN[f] || f).join(', ')} — please give more detailed analysis in those sections.`
      : ''
    const focusNoteLine = focusNote
      ? `User's additional note: "${focusNote}" — please address this specifically in your analysis.`
      : ''
    return `You are a friendly, experienced photographer helping a beginner understand their photo. They want to understand how camera settings relate to the final image.

${deviceLine}
${focusLine}
${focusNoteLine}

${exifText}

Based on the EXIF data and the image itself, provide an encouraging, easy-to-understand analysis covering:

1. **Settings Explanation**: For this specific photo, explain how the key settings (aperture, shutter speed, ISO, white balance) affected the result. Be concrete — refer to what's actually in the image, don't just explain theory.${focusAreas.includes('exposure') ? ' The user is especially interested in exposure settings — explain how the parameters work together.' : ''}

2. **Manual Mode Tips**: If the EXIF shows auto exposure was used, explain how to shoot this same scene in manual mode (M) — give specific aperture/shutter/ISO values and the reasoning behind each choice.${focusAreas.includes('manual') ? ' The user wants to learn manual mode — explain the logic behind each setting choice clearly.' : ''}

3. **Lighting & Intent Analysis**: Analyze the light direction and quality (front light, side light, backlight, diffused). Evaluate the existing lighting.${hasPortrait || focusAreas.includes('portrait') ? ' There is a person in the frame or the user cares about portrait lighting — focus on how the natural light falls on the face, whether there is good shadow and dimension, and how to adjust position next time.' : ' Analyze what the photographer was trying to express and highlight compositional and lighting strengths.'}${focusAreas.includes('light') ? ' The user is especially interested in lighting — explain this light\'s characteristics and how to seek out or create similar light.' : ''}

4. **Improvement Suggestions**: Give 1-2 of the most impactful, immediately actionable improvements for next time. Be specific.${focusAreas.includes('composition') ? ' The user cares about composition — specifically analyze what worked and what to adjust in framing or angle next time.' : ''}

5. **Lens Advice**: ${device ? `Given the user's ${device}, ` : ''}evaluate how well the current focal length worked for this scene.${focusAreas.includes('focal') ? ' The user is especially interested in focal length — explain which focal lengths suit this scene and their different effects.' : ' If a different focal length would make a meaningful difference, give a specific recommendation.'}

Tone: warm, conversational, like a photographer friend looking at photos together. Avoid jargon overload. 2-4 sentences per section.

Reply in English. Return strictly as JSON (no double quotes inside field values):
{
  "paramExplanation": "settings explanation...",
  "manualModeTip": "manual mode tips...",
  "intentAnalysis": "lighting and intent analysis...",
  "improvement": "improvement suggestions...",
  "lensTip": "lens advice...",
  "overallFeel": "one sentence summing up this photo (under 10 words)"
}`
  }

  const deviceLine = device
    ? `用户使用的设备：${device}`
    : '用户未提供设备信息，请根据 EXIF 中的相机型号推断，或给出通用建议。'
  const focusLine = focusAreas.length > 0
    ? `用户希望重点了解：${focusAreas.map(f => FOCUS_LABEL[f] || f).join('、')}——请在对应部分给出更详细的分析。`
    : ''
  const focusNoteLine = focusNote
    ? `用户补充说明：${focusNote}——请在分析中特别回应这个问题。`
    : ''

  return `你是一位友善、有经验的摄影师朋友，正在帮一位摄影新手看他们拍的照片。这位新手正在学习摄影，希望理解参数与画面的关系。

${deviceLine}
${focusLine}
${focusNoteLine}

${exifText}

请结合上面的 EXIF 参数和图片画面内容，用通俗易懂、鼓励性的语言，从以下角度做解读：

1. **参数解释**：针对这张具体照片，解释关键参数（光圈、快门、ISO、白平衡）是如何影响画面效果的。要结合实际画面说，不要只讲理论。${focusAreas.includes('exposure') ? '用户特别想了解曝光参数，请多花笔墨解释参数间的配合关系。' : ''}

2. **手动模式建议**：如果 EXIF 显示用的是自动曝光模式，给出这张照片如果改用手动模式（M 档）该怎么设置——具体说光圈/快门/ISO 各设多少合适，以及为什么。${focusAreas.includes('manual') ? '用户特别想学手动模式，请把每个参数的选择逻辑说清楚。' : ''}

3. **拍摄意图与用光分析**：分析画面的光线来源和方向（是顺光、侧光、逆光还是散射光），评价现有光线效果。${hasPortrait || focusAreas.includes('portrait') ? '画面有人物或用户关注人像用光，重点分析自然光是如何打在人脸上的，有没有形成好看的阴影和立体感，以及下次可以如何调整站位来利用好自然光。' : '分析摄影师想表达什么，构图和用光上有哪些亮点。'}${focusAreas.includes('light') ? '用户特别想了解用光，请详细说明这种光线的特点和如何主动寻找/营造类似光线。' : ''}

4. **改进建议**：给出 1-2 条最重要的、下次马上可以操作的改进建议，要具体可执行。${focusAreas.includes('composition') ? '用户关注构图，请专门分析构图上的得失，以及下次如何调整取景角度或位置。' : ''}

5. **镜头建议**：${device ? `结合用户使用的 ${device}，` : ''}评价当前焦段在这个场景下的表现。${focusAreas.includes('focal') ? '用户特别想了解焦段选择，请详细说明这个场景适合哪些焦段以及各自的效果区别。' : '如果换用别的焦段效果会明显更好，给出具体推荐和大概价格区间。'}

语言风格：口语化、温暖，像摄影师朋友在边看照片边聊天，避免堆砌术语。每个部分 2-4 句话，不要太长。

请用中文回复，严格以 JSON 格式返回，不要在字段值内使用双引号，结构如下：
{
  "paramExplanation": "参数解释内容...",
  "manualModeTip": "手动模式建议内容...",
  "intentAnalysis": "拍摄意图与用光分析内容...",
  "improvement": "改进建议内容...",
  "lensTip": "镜头建议内容...",
  "overallFeel": "用一句话总结这张照片的整体感觉（10字以内）"
}`
}

const GALLERY_PROMPT = (exifText, lang = 'zh') => {
  if (lang === 'en') {
    return `You are an experienced photographer analyzing a reference photo to help photography enthusiasts understand the technique and learning value.

${exifText}

Based on the EXIF data and the image, analyze from these four angles:

1. **Exposure Breakdown**: How do aperture, shutter speed, and ISO work together, and what visual effect does each produce (e.g. background blur, motion freeze or blur, noise control)? Be concrete — refer to what's actually in the image.

2. **Light Analysis**: The direction (front/side/back/diffused), quality (hard/soft), and time of day of the light, and how it shapes the subject's texture, outline, or mood.

3. **Composition Breakdown**: Which compositional techniques are used (rule of thirds, leading lines, negative space, framing, etc.), how the focal length affects perspective and depth of field, and how the visual weight is arranged.

4. **Style & Learning Value**: The overall visual style and emotion of the photo, and one specific, concrete takeaway for photography learners — explain why it's worth learning and how to apply it next time.

Tone: clear and professional, like a photography teacher critiquing work. 2-3 sentences per section.

Reply in English. Return strictly as JSON (no double quotes inside field values):
{
  "exposure": "exposure breakdown...",
  "light": "light analysis...",
  "composition": "composition breakdown...",
  "style": "style and learning value...",
  "overallFeel": "one sentence summing up this photo (under 10 words)"
}`
  }

  return `你是一位经验丰富的摄影师，正在解读一张参考照片，帮助摄影爱好者理解这张照片的拍摄手法和学习价值。

${exifText}

请结合 EXIF 参数和图片画面内容，从以下四个角度进行分析：

1. **曝光解读**：光圈、快门、ISO 三者如何配合，分别产生了什么画面效果（如虚化程度、运动凝固或拖影、噪点控制）。结合具体画面说，不要只讲理论。

2. **光线分析**：光线的方向（顺光/侧光/逆光/散射光）、光质（硬光/柔光）和拍摄时段，以及这种光线如何塑造了主体的质感、轮廓或氛围。

3. **构图解读**：使用了哪些构图手法（三分法、引导线、留白、框架构图等），焦段对透视关系和景深的影响，以及整体视觉重心的安排。

4. **风格与学习价值**：这张照片整体的视觉风格和情绪，以及对摄影学习者最值得借鉴的一个具体点——说清楚为什么值得学、下次可以怎么应用。

语言风格：专业清晰，像摄影老师在讲评作品。每个部分 2-3 句话，不要冗长。

请用中文回复，严格以 JSON 格式返回，不要在字段值内使用双引号，结构如下：
{
  "exposure": "曝光解读内容...",
  "light": "光线分析内容...",
  "composition": "构图解读内容...",
  "style": "风格与学习价值内容...",
  "overallFeel": "用一句话总结这张照片的整体感觉（10字以内）"
}`
}

app.post('/api/analyze', async (req, res) => {
  const { imageBase64, imageUrl, mediaType, exif, hasPortrait, mode, userContext, lang = 'zh' } = req.body

  if (!imageBase64 && !imageUrl) {
    return res.status(400).json({ error: '缺少图片数据' })
  }

  // Usage log
  const camera = exif?.make ? `${exif.make} ${exif.model || ''}`.trim() : 'unknown'
  console.log(`[analyze] ${new Date().toISOString()} mode=${mode || 'upload'} lang=${lang} camera=${camera}`)

  const imageSource = imageUrl
    ? { type: 'url', url: imageUrl }
    : { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 }

  const prompt = mode === 'gallery'
    ? GALLERY_PROMPT(buildExifText(exif, lang), lang)
    : ANALYZE_PROMPT(buildExifText(exif, lang), hasPortrait, userContext, lang)

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: imageSource },
            { type: 'text', text: prompt },
          ],
        },
      ],
    })

    const text = message.content[0].text
    console.log('Claude raw response:', text.slice(0, 300))

    // Strip markdown code fences if present
    const stripped = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()
    const jsonMatch = stripped.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('No JSON found in response:', text)
      return res.status(500).json({ error: 'AI 返回格式异常，请重试' })
    }

    let result
    try {
      result = JSON.parse(jsonMatch[0])
    } catch {
      // Sanitize and retry: escape unescaped control characters
      try {
        const sanitized = jsonMatch[0].replace(/[\u0000-\u001F\u007F]/g, ' ')
        result = JSON.parse(sanitized)
      } catch {
        // Last resort: extract each field with regex
        const extract = (key) => {
          const m = text.match(new RegExp(`"${key}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's'))
          return m ? m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : ''
        }
        result = {
          paramExplanation: extract('paramExplanation'),
          manualModeTip: extract('manualModeTip'),
          intentAnalysis: extract('intentAnalysis'),
          improvement: extract('improvement'),
          lensTip: extract('lensTip'),
          overallFeel: extract('overallFeel'),
        }
        if (!result.paramExplanation) {
          console.error('All parsing failed. Raw text:', text)
          return res.status(500).json({ error: 'AI 返回格式异常，请重试' })
        }
      }
    }
    res.json(result)
  } catch (err) {
    console.error('Claude API error:', err)
    const status = err.status || 500
    let message = 'AI 分析失败，请稍后重试'
    if (status === 401) message = 'API 密钥无效，请在 .env 文件中设置正确的 ANTHROPIC_API_KEY'
    else if (status === 429) message = '请求过于频繁，请稍后重试'
    else if (err.message) message = err.message
    res.status(status).json({ error: message })
  }
})

// --- AI chat endpoint ---
app.post('/api/chat', async (req, res) => {
  const { messages, imageBase64, imageUrl, mediaType, exif, analysis, lang = 'zh' } = req.body
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: '缺少对话内容' })
  }

  const imageSource = imageUrl
    ? { type: 'url', url: imageUrl }
    : imageBase64
      ? { type: 'base64', media_type: mediaType || 'image/jpeg', data: imageBase64 }
      : null

  const exifText = buildExifText(exif, lang)
  const analysisContext = analysis
    ? lang === 'en'
      ? `
Previous AI analysis:
- Settings: ${analysis.paramExplanation || ''}
- Manual mode tips: ${analysis.manualModeTip || ''}
- Lighting analysis: ${analysis.intentAnalysis || ''}
- Improvement suggestions: ${analysis.improvement || ''}
- Lens advice: ${analysis.lensTip || ''}
- Overall feel: ${analysis.overallFeel || ''}`.trim()
      : `
已有的 AI 初步解读：
- 参数解释：${analysis.paramExplanation || ''}
- 手动模式建议：${analysis.manualModeTip || ''}
- 用光分析：${analysis.intentAnalysis || ''}
- 改进建议：${analysis.improvement || ''}
- 镜头建议：${analysis.lensTip || ''}
- 整体感受：${analysis.overallFeel || ''}`.trim()
    : ''

  const systemPrompt = lang === 'en'
    ? `You are Lumen's AI photography mentor, chatting with a beginner photographer.

Photo context:
${exifText}
${analysisContext}

User background: photography beginner, mostly uses auto mode, learning manual mode, has a 35mm f/2 prime lens, interested in natural light portraits.

Answer the user's questions based on the photo context above. Tone: friendly, conversational, encouraging — like a photographer friend chatting. Keep answers concise, 2-5 sentences is ideal; slightly longer for specific technical questions. Reply in English.`
    : `你是「追光 Lumen」的 AI 摄影导师，正在和一位摄影初学者进行对话。

关于这张照片的背景信息：
${exifText}
${analysisContext}

用户背景：摄影新手，目前主要用自动模式，正在学习手动模式，只有一支 35mm f/2 定焦镜头，对自然光人像感兴趣。

请根据上述照片背景信息回答用户的问题。语言风格：友善、口语化、鼓励性，像摄影师朋友在聊天，避免堆砌术语。回答简洁，2-5句话为佳，特别具体的技术问题可以稍长。用中文回复。`

  // Build Claude messages — inject image into first user message if available
  const claudeMessages = messages.map((m, i) => {
    if (i === 0 && m.role === 'user' && imageSource) {
      return {
        role: 'user',
        content: [
          { type: 'image', source: imageSource },
          { type: 'text', text: m.content },
        ],
      }
    }
    return { role: m.role, content: m.content }
  })

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages,
    })
    res.json({ reply: response.content[0].text })
  } catch (err) {
    console.error('Chat API error:', err)
    res.status(err.status || 500).json({ error: err.message || 'AI 回复失败，请稍后重试' })
  }
})

app.get('/api/health', (_, res) => res.json({ ok: true }))

// SPA fallback — must be after all API routes
if (isProd) {
  const indexPath = join(__dirname, 'dist', 'index.html')
  app.get('/{*path}', (_, res) => {
    if (fs.existsSync(indexPath)) res.sendFile(indexPath)
    else res.status(404).send('Not found')
  })
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
