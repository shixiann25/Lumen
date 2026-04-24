import { useState } from 'react'
import PhotoChat from './PhotoChat'
import { useLang } from '../contexts/LangContext'

function formatWhiteBalance(exif, t) {
  if (exif.whiteBalance === 0) return t('result.params.wb.auto')
  if (exif.whiteBalance === 1) return t('result.params.wb.manual')
  if (exif.whiteBalanceMode) return exif.whiteBalanceMode
  return null
}

export default function AnalysisResult({ image, exif, analysis, onReset, hideReset, imageBase64, imageUrl, mediaType }) {
  const { t, lang } = useLang()

  const PARAM_INFO = {
    aperture:     { label: t('result.params.aperture'), icon: '◉', format: v => `f/${v}`, tip: t('result.params.aperture.tip') },
    shutterSpeed: { label: t('result.params.shutter'),  icon: '◷', format: v => v,        tip: t('result.params.shutter.tip') },
    iso:          { label: t('result.params.iso'),      icon: '◑', format: v => `${v}`,   tip: t('result.params.iso.tip') },
    focalLength:  { label: t('result.params.focal'),    icon: '◎', format: v => `${v}mm`, tip: t('result.params.focal.tip') },
  }

  const wb = exif ? formatWhiteBalance(exif, t) : null

  return (
    <div className="space-y-8">
      {/* Image */}
      <div className="relative rounded-2xl overflow-hidden bg-[#1A1714] aspect-[4/3]">
        <img src={image} alt="uploaded" className="w-full h-full object-contain" />
        {analysis?.overallFeel && (
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80">
            <p className="text-[#B8965A] text-xs tracking-widest uppercase mb-1">Overall</p>
            <p className="text-white font-display text-lg font-semibold">{analysis.overallFeel}</p>
          </div>
        )}
      </div>

      {/* EXIF */}
      {exif ? (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[#A89C91] text-xs tracking-[0.2em] uppercase">{t('result.params.title')}</p>
            <div className="flex-1 h-px bg-[#E5DED5]" />
            {exif.exposureMode === 1 && (
              <span className="text-xs bg-[#1A1714] text-white px-2.5 py-1 rounded-full">{t('result.params.expo.manual')}</span>
            )}
            {exif.exposureMode === 0 && (
              <span className="text-xs border border-[#E5DED5] text-[#A89C91] px-2.5 py-1 rounded-full">{t('result.params.expo.auto')}</span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(PARAM_INFO).map(([key, info]) => {
              const val = key === 'shutterSpeed' ? (exif.shutterSpeed || exif.exposureTime) : exif[key]
              if (!val) return null
              return <ParamCard key={key} info={info} value={val} />
            })}
            {wb && (
              <ParamCard
                info={{ label: t('result.params.wb'), icon: '◈', format: v => v, tip: t('result.params.wb.tip') }}
                value={wb}
              />
            )}
          </div>
          {exif.make && (
            <p className="text-[#A89C91] text-xs mt-3">◎ {exif.make} {exif.model}</p>
          )}
        </div>
      ) : (
        <div className="border border-[#E5DED5] rounded-xl p-4 text-sm text-[#6B6158] bg-[#FBF4E8]">
          {t('result.no.exif')}
        </div>
      )}

      {/* AI Analysis */}
      {analysis && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[#A89C91] text-xs tracking-[0.2em] uppercase">{t('result.ai.title')}</p>
            <div className="flex-1 h-px bg-[#E5DED5]" />
          </div>
          <AnalysisCard icon="◉" label={t('result.ai.param')} content={analysis.paramExplanation} accent="#EBF3FA" />
          {analysis.manualModeTip && (
            <AnalysisCard icon="◈" label={t('result.ai.manual')} content={analysis.manualModeTip} accent="#F0EBFA" />
          )}
          <AnalysisCard icon="◐" label={t('result.ai.light')} content={analysis.intentAnalysis} accent="#EAFAF0" />
          <AnalysisCard icon="◑" label={t('result.ai.improve')} content={analysis.improvement} accent="#FBF4E8" />
          {analysis.lensTip && (
            <AnalysisCard icon="◎" label={t('result.ai.lens')} content={analysis.lensTip} accent="#FAF0F0" />
          )}
        </div>
      )}

      {/* Interactive chat */}
      {analysis && (
        <PhotoChat
          imageBase64={imageBase64}
          imageUrl={imageUrl}
          mediaType={mediaType}
          exif={exif}
          analysis={analysis}
        />
      )}

      {/* Share */}
      {analysis && <ShareButton t={t} lang={lang} image={image} analysis={analysis} exif={exif} />}

      {!hideReset && onReset && (
        <button
          onClick={onReset}
          className="w-full py-4 rounded-xl border border-dashed border-[#E5DED5] text-[#A89C91] hover:border-[#B8965A] hover:text-[#B8965A] transition-colors text-sm"
        >
          {t('result.reset')}
        </button>
      )}
    </div>
  )
}

const W = 1080
const PAD = 88
const TEXT_W = W - PAD * 2

// Draw wrapped text, return final Y
function canvasWrapText(ctx, text, x, y, maxWidth, lineHeight) {
  if (!text) return y
  const chars = text.split('')
  let line = ''
  let curY = y
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY)
      line = ch
      curY += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, curY)
  return curY + lineHeight
}

// Measure how tall wrapped text will be without drawing
function measureWrapHeight(ctx, text, maxWidth, lineHeight) {
  if (!text) return 0
  const chars = text.split('')
  let line = ''
  let lines = 1
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      lines++
      line = ch
    } else {
      line = test
    }
  }
  return lines * lineHeight
}

async function generateShareCard({ image, analysis, exif, lang }) {
  // Load photo first
  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = image
  })

  // Measure content height with offscreen ctx
  const probe = document.createElement('canvas')
  probe.width = W
  const pCtx = probe.getContext('2d')

  const feel = analysis.overallFeel || ''
  const light = analysis.intentAnalysis || ''
  const improve = analysis.improvement || ''

  pCtx.font = `bold 58px serif`
  const feelH = measureWrapHeight(pCtx, feel, TEXT_W, 80)

  pCtx.font = `32px sans-serif`
  const lightH = light ? measureWrapHeight(pCtx, light, TEXT_W, 54) : 0
  const improveH = improve ? measureWrapHeight(pCtx, improve, TEXT_W, 54) : 0

  const pillH = exif ? 72 : 0
  const CONTENT_H = 80 + feelH + 56 + (light ? 44 + 48 + lightH + 56 : 0) + (improve ? 44 + 48 + improveH + 56 : 0) + pillH + 100 + 72
  const PHOTO_H = Math.round(Math.max(W * 0.7, W)) // square-ish photo section
  const H = PHOTO_H + Math.max(CONTENT_H, 480)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // ── Photo (cover-fill) ──
  const imgAspect = img.width / img.height
  const targetAspect = W / PHOTO_H
  let sx, sy, sw, sh
  if (imgAspect > targetAspect) {
    sh = img.height; sw = sh * targetAspect; sx = (img.width - sw) / 2; sy = 0
  } else {
    sw = img.width; sh = sw / targetAspect; sx = 0; sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, PHOTO_H)

  // Photo bottom gradient
  const pg = ctx.createLinearGradient(0, PHOTO_H * 0.55, 0, PHOTO_H)
  pg.addColorStop(0, 'rgba(26,23,20,0)')
  pg.addColorStop(1, 'rgba(26,23,20,0.55)')
  ctx.fillStyle = pg
  ctx.fillRect(0, 0, W, PHOTO_H)

  // ── Dark content panel ──
  ctx.fillStyle = '#1A1714'
  ctx.fillRect(0, PHOTO_H, W, H - PHOTO_H)

  // Gold accent bar
  ctx.fillStyle = '#B8965A'
  ctx.fillRect(PAD, PHOTO_H + 56, 40, 3)

  let y = PHOTO_H + 96

  // Overall feel
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `bold 58px serif`
  ctx.textAlign = 'left'
  y = canvasWrapText(ctx, feel, PAD, y, TEXT_W, 80)
  y += 56

  // Section helper
  const drawSection = (label, text) => {
    // Divider
    ctx.fillStyle = 'rgba(255,255,255,0.1)'
    ctx.fillRect(PAD, y, TEXT_W, 1)
    y += 44

    // Label
    ctx.fillStyle = '#B8965A'
    ctx.font = `600 24px sans-serif`
    ctx.letterSpacing = '2px'
    ctx.fillText(label, PAD, y)
    ctx.letterSpacing = '0px'
    y += 48

    // Body
    ctx.fillStyle = 'rgba(255,255,255,0.80)'
    ctx.font = `32px sans-serif`
    y = canvasWrapText(ctx, text, PAD, y, TEXT_W, 54)
    y += 56
  }

  if (light) drawSection(lang === 'en' ? '✦  LIGHTING' : '✦  用光', light)
  if (improve) drawSection(lang === 'en' ? '✦  TIPS' : '✦  改进建议', improve)

  // EXIF pills
  if (exif) {
    const pills = []
    if (exif.aperture) pills.push(`f/${exif.aperture}`)
    if (exif.shutterSpeed || exif.exposureTime) pills.push(exif.shutterSpeed || exif.exposureTime)
    if (exif.iso) pills.push(`ISO ${exif.iso}`)
    if (exif.focalLength) pills.push(`${exif.focalLength}mm`)
    if (pills.length) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      ctx.fillRect(PAD, y, TEXT_W, 1)
      y += 40
      ctx.font = '28px monospace'
      let px = PAD
      for (const pill of pills) {
        const pw = ctx.measureText(pill).width + 36
        ctx.fillStyle = 'rgba(184,150,90,0.15)'
        ctx.beginPath()
        ctx.roundRect(px, y, pw, 52, 26)
        ctx.fill()
        ctx.strokeStyle = 'rgba(184,150,90,0.4)'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.fillStyle = '#B8965A'
        ctx.fillText(pill, px + 18, y + 34)
        px += pw + 14
      }
      y += 72
    }
  }

  // ── Branding ──
  const brandY = H - 64
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.font = '26px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('◎  追光 Lumen', PAD, brandY)
  ctx.textAlign = 'right'
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  ctx.fillText('lumenphoto.up.railway.app', W - PAD, brandY)

  return canvas
}

function ShareButton({ t, lang, image, analysis, exif }) {
  const [status, setStatus] = useState('idle') // idle | generating | done | copied

  const handleShare = async () => {
    setStatus('generating')
    try {
      const canvas = await generateShareCard({ image, analysis, exif, lang })
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92))
      const file = new File([blob], 'lumen-photo-analysis.jpg', { type: 'image/jpeg' })

      // Try native share with image file
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: lang === 'en' ? 'Lumen — AI Photography Analysis' : '追光 Lumen — 照片解读',
          text: lang === 'en' ? 'lumenphoto.up.railway.app' : 'lumenphoto.up.railway.app',
        })
        setStatus('done')
      } else if (navigator.share) {
        // Share without file (older browsers)
        const blobUrl = URL.createObjectURL(blob)
        // Download the image and share URL
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = 'lumen-analysis.jpg'
        a.click()
        URL.revokeObjectURL(blobUrl)
        await navigator.share({
          title: lang === 'en' ? 'Lumen — AI Photography Coach' : '追光 Lumen — AI 摄影解读',
          url: 'https://lumenphoto.up.railway.app',
        })
        setStatus('done')
      } else {
        // Desktop: download image
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = 'lumen-analysis.jpg'
        a.click()
        URL.revokeObjectURL(blobUrl)
        setStatus('done')
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error('Share failed', e)
      setStatus('idle')
    }
    setTimeout(() => setStatus('idle'), 3000)
  }

  const label = status === 'generating'
    ? t('share.generating')
    : status === 'done'
      ? t('share.done')
      : t('share.card.btn')

  const icon = status === 'generating' ? '…' : status === 'done' ? '✓' : '↑'

  return (
    <div className="border border-[#E5DED5] rounded-2xl p-5 bg-white">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-sm text-[#1A1714]">{t('share.card.title')}</p>
          <p className="text-xs text-[#A89C91] mt-0.5">{t('share.card.desc')}</p>
        </div>
        <button
          onClick={handleShare}
          disabled={status === 'generating'}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1A1714] text-white text-sm font-medium hover:bg-[#B8965A] transition-colors flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      </div>
    </div>
  )
}

function ParamCard({ info, value }) {
  return (
    <div className="bg-white border border-[#E5DED5] rounded-xl p-4 group relative hover:border-[#B8965A] transition-colors">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[#B8965A] text-sm">{info.icon}</span>
        <span className="text-xs text-[#A89C91]">{info.label}</span>
      </div>
      <div className="font-display font-semibold text-[#1A1714] text-lg">{info.format(value)}</div>
      <div className="absolute bottom-full left-0 mb-2 w-52 bg-[#1A1714] text-white text-xs rounded-xl p-3 hidden group-hover:block z-10 shadow-xl leading-relaxed">
        {info.tip}
      </div>
    </div>
  )
}

function AnalysisCard({ icon, label, content, accent }) {
  return (
    <div className="rounded-xl p-5 border border-[#E5DED5]" style={{ backgroundColor: accent }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[#B8965A]">{icon}</span>
        <span className="font-semibold text-sm text-[#1A1714]">{label}</span>
      </div>
      <p className="text-[#3D3530] text-sm leading-relaxed">{content}</p>
    </div>
  )
}
