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
      <ShareButton t={t} lang={lang} />

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

function ShareButton({ t, lang }) {
  const [copied, setCopied] = useState(false)

  const shareData = {
    title: lang === 'en' ? 'Lumen — AI Photography Coach' : '追光 Lumen — AI 摄影解读',
    text: lang === 'en'
      ? 'Upload your photos and let AI explain your camera settings, lighting, and how to improve. Free to use!'
      : '上传照片，AI 结合 EXIF 参数帮你理解光圈、快门、ISO，像摄影师朋友帮你看片。免费使用！',
    url: 'https://lumenphoto.up.railway.app',
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (e) {
        if (e.name !== 'AbortError') fallbackCopy()
      }
    } else {
      fallbackCopy()
    }
  }

  const fallbackCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareData.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="border border-[#E5DED5] rounded-2xl p-5 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm text-[#1A1714]">{t('share.title')}</p>
          <p className="text-xs text-[#A89C91] mt-0.5">{t('share.desc')}</p>
        </div>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1A1714] text-white text-sm font-medium hover:bg-[#B8965A] transition-colors flex-shrink-0 ml-4"
        >
          <span>{copied ? '✓' : '↑'}</span>
          <span>{copied ? t('share.copied') : t('share.btn')}</span>
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
