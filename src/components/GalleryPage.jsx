import { useState, useEffect, useCallback } from 'react'
import { galleryItems } from '../data/gallery'
import { useLang } from '../contexts/LangContext'

export default function GalleryPage() {
  const { t, lang } = useLang()
  const [activeCategory, setActiveCategory] = useState('featured')
  const [photos, setPhotos] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [noApiKey, setNoApiKey] = useState(false)
  const [selected, setSelected] = useState(null)

  const categories = [
    { id: 'featured',  label: t('gallery.cat.featured') },
    { id: 'portrait',  label: t('gallery.cat.portrait') },
    { id: 'landscape', label: t('gallery.cat.landscape') },
    { id: 'street',    label: t('gallery.cat.street') },
    { id: 'still',     label: t('gallery.cat.still') },
  ]

  const fetchPhotos = useCallback(async (category, pageNum, append = false) => {
    append ? setLoadingMore(true) : setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/gallery?category=${category}&page=${pageNum}`)
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'UNSPLASH_ACCESS_KEY_MISSING') {
          setNoApiKey(true)
          setPhotos(category === 'featured' ? galleryItems : galleryItems.filter(i => i.category === category))
          setHasMore(false)
          return
        }
        throw new Error(data.error || t('gallery.loading'))
      }
      setNoApiKey(false)
      setPhotos(prev => append ? [...prev, ...data.photos] : data.photos)
      setHasMore(data.page < data.totalPages)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [t])

  useEffect(() => {
    setPage(1)
    setPhotos([])
    fetchPhotos(activeCategory, 1, false)
  }, [activeCategory, fetchPhotos])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchPhotos(activeCategory, next, true)
  }

  if (selected) {
    return (
      <DetailView
        photo={selected}
        isFeatured={activeCategory === 'featured'}
        onBack={() => setSelected(null)}
        t={t}
        lang={lang}
      />
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[#B8965A] text-xs tracking-[0.2em] uppercase mb-3">{t('gallery.eyebrow')}</p>
        <h1 className="font-display text-3xl font-semibold text-[#1A1714]">{t('gallery.title')}</h1>
        <p className="text-[#6B6158] text-sm mt-2">{t('gallery.desc')}</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? 'bg-[#1A1714] text-white'
                : 'bg-white border border-[#E5DED5] text-[#6B6158] hover:border-[#B8965A] hover:text-[#1A1714]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* No API key notice */}
      {noApiKey && activeCategory !== 'featured' && (
        <div className="bg-[#FBF4E8] border border-[#E5DED5] rounded-xl p-4 text-sm text-[#6B6158] mb-8">
          <span className="text-[#B8965A] font-semibold">{t('gallery.no.key')}</span>{' '}
          <a
            href="https://unsplash.com/developers"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-[#B8965A] underline underline-offset-2"
          >
            {t('gallery.no.key.link')}
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="border border-red-200 bg-red-50 rounded-xl p-4 text-red-700 text-sm mb-8">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-[#F0EBE3] animate-pulse">
              <div className="aspect-[3/4] bg-[#E5DED5]" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-[#E5DED5] rounded w-3/4" />
                <div className="h-3 bg-[#E5DED5] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo grid */}
      {!loading && photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} onClick={() => setSelected(photo)} t={t} />
          ))}
        </div>
      )}

      {/* Load more skeletons */}
      {loadingMore && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-[#F0EBE3] animate-pulse">
              <div className="aspect-[3/4] bg-[#E5DED5]" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-[#E5DED5] rounded w-3/4" />
                <div className="h-3 bg-[#E5DED5] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div className="mt-10 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-8 py-3 rounded-full border border-[#E5DED5] text-[#6B6158] text-sm font-medium hover:border-[#B8965A] hover:text-[#B8965A] transition-colors disabled:opacity-40"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-[#E5DED5] border-t-[#B8965A] rounded-full animate-spin" />
                {t('gallery.loading')}
              </span>
            ) : (
              t('gallery.load.more')
            )}
          </button>
        </div>
      )}

      {/* Unsplash credit */}
      {activeCategory !== 'featured' && !noApiKey && photos.length > 0 && (
        <p className="text-center text-[#A89C91] text-xs mt-10">
          {t('gallery.credit')}{' '}
          <a
            href="https://unsplash.com/?utm_source=lumen&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-[#6B6158] transition-colors"
          >
            Unsplash
          </a>
        </p>
      )}
    </div>
  )
}

function PhotoCard({ photo, onClick, t }) {
  return (
    <button
      onClick={onClick}
      className="group text-left bg-white rounded-2xl overflow-hidden border border-[#E5DED5] hover:border-[#B8965A]/50 hover:shadow-lg transition-all duration-300"
    >
      <div className="aspect-[3/4] overflow-hidden bg-[#F0EBE3]">
        <img
          src={photo.thumb}
          alt={photo.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          style={{ backgroundColor: photo.color || '#E5DED5' }}
        />
      </div>
      <div className="p-3.5">
        <p className="font-medium text-sm text-[#1A1714] mb-1.5 truncate capitalize">
          {photo.title || t('gallery.photographer')}
        </p>
        {photo.exif && (
          <div className="flex gap-2 text-xs text-[#A89C91]">
            {photo.exif.aperture && <span>f/{photo.exif.aperture}</span>}
            {photo.exif.shutterSpeed && <span>{photo.exif.shutterSpeed}</span>}
            {photo.exif.iso && <span>ISO {photo.exif.iso}</span>}
          </div>
        )}
        {(photo.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {(photo.tags || []).slice(0, 2).map((tag) => (
              <span key={tag} className="bg-[#F0EBE3] text-[#6B6158] text-xs px-1.5 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

const CACHE_KEY = (id) => `lumen-gallery-analysis-${id}`

function getCachedAnalysis(id) {
  try {
    const raw = localStorage.getItem(CACHE_KEY(id))
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function setCachedAnalysis(id, data) {
  try { localStorage.setItem(CACHE_KEY(id), JSON.stringify(data)) } catch {}
}

// ---- Detail view with on-demand AI analysis ----
function DetailView({ photo, isFeatured, onBack, t, lang }) {
  const [analysis, setAnalysis] = useState(() => getCachedAnalysis(photo.id))
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState(null)

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: photo.full, exif: photo.exif, mode: 'gallery', lang }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t('gallery.ai.analyzing'))
      setAnalysis(data)
      setCachedAnalysis(photo.id, data)
    } catch (err) {
      setAnalyzeError(err.message)
    } finally {
      setAnalyzing(false)
    }
  }

  useEffect(() => {
    if (!getCachedAnalysis(photo.id)) {
      handleAnalyze()
    }
  }, [photo.id])

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#A89C91] hover:text-[#1A1714] text-sm mb-8 transition-colors"
      >
        ← {t('gallery.back')}
      </button>

      {/* Title */}
      <div className="mb-6">
        <p className="text-[#B8965A] text-xs tracking-[0.2em] uppercase mb-2">{photo.categoryLabel || 'Reference'}</p>
        <h2 className="font-display text-2xl font-semibold text-[#1A1714] capitalize">{photo.title || t('gallery.photographer')}</h2>
        {photo.photographer && !isFeatured && (
          <p className="text-[#A89C91] text-xs mt-2">
            {t('gallery.photographer')}：
            <a
              href={photo.photographerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[#6B6158] transition-colors"
            >
              {photo.photographer}
            </a>
            {' · '}
            <a
              href="https://unsplash.com/?utm_source=lumen&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[#6B6158] transition-colors"
            >
              Unsplash
            </a>
          </p>
        )}
      </div>

      {/* Photo */}
      <div className="relative rounded-2xl overflow-hidden bg-[#1A1714] mb-6">
        <img src={photo.full} alt={photo.title} className="w-full max-h-[480px] object-contain" />
        {analysis?.overallFeel && (
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/80">
            <p className="text-[#B8965A] text-xs tracking-widest uppercase mb-1">Overall</p>
            <p className="text-white font-display text-lg font-semibold">{analysis.overallFeel}</p>
          </div>
        )}
      </div>

      {/* EXIF */}
      {photo.exif && (
        <ExifCards exif={photo.exif} camera={photo.exif.camera || photo.camera} t={t} />
      )}

      {/* Analysis section */}
      {analysis ? (
        <div className="space-y-3 mt-8">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[#A89C91] text-xs tracking-[0.2em] uppercase">{t('gallery.ai.title')}</p>
            <div className="flex-1 h-px bg-[#E5DED5]" />
          </div>
          <AnalysisCard icon="◉" label={t('gallery.ai.exposure')} content={analysis.exposure} accent="#EBF3FA" />
          <AnalysisCard icon="◐" label={t('gallery.ai.light')} content={analysis.light} accent="#EAFAF0" />
          <AnalysisCard icon="◎" label={t('gallery.ai.composition')} content={analysis.composition} accent="#FBF4E8" />
          <AnalysisCard icon="◈" label={t('gallery.ai.style')} content={analysis.style} accent="#F0EBFA" />
        </div>
      ) : (
        <div className="mt-8">
          {analyzeError && (
            <div className="border border-red-200 bg-red-50 rounded-xl p-4 text-red-700 text-sm mb-4">
              {analyzeError}
            </div>
          )}
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="w-full py-4 rounded-xl bg-[#1A1714] text-white font-medium hover:bg-[#2D2520] transition-colors disabled:opacity-60 flex items-center justify-center gap-3"
          >
            {analyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('gallery.ai.analyzing')}
              </>
            ) : (
              <>
                <span className="text-[#B8965A]">◎</span>
                {t('gallery.ai.cta')}
              </>
            )}
          </button>
          <p className="text-center text-[#A89C91] text-xs mt-3">
            {t('gallery.ai.footer')}
          </p>
        </div>
      )}
    </div>
  )
}

function ExifCards({ exif, camera, t }) {
  const PARAM_INFO = {
    aperture:     { label: t('gallery.exif.aperture'),  icon: '◉', format: v => `f/${v}` },
    shutterSpeed: { label: t('gallery.exif.shutter'),   icon: '◷', format: v => v },
    iso:          { label: t('gallery.exif.iso'),        icon: '◑', format: v => `${v}` },
    focalLength:  { label: t('gallery.exif.focal'),      icon: '◎', format: v => `${v}mm` },
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <p className="text-[#A89C91] text-xs tracking-[0.2em] uppercase">{t('gallery.exif.title')}</p>
        <div className="flex-1 h-px bg-[#E5DED5]" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(PARAM_INFO).map(([key, info]) => {
          const val = exif[key]
          if (!val) return null
          return (
            <div key={key} className="bg-white border border-[#E5DED5] rounded-xl p-4 hover:border-[#B8965A] transition-colors">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[#B8965A] text-sm">{info.icon}</span>
                <span className="text-xs text-[#A89C91]">{info.label}</span>
              </div>
              <div className="font-display font-semibold text-[#1A1714] text-lg">{info.format(val)}</div>
            </div>
          )
        })}
      </div>
      {camera && <p className="text-[#A89C91] text-xs mt-3">◎ {camera}</p>}
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
