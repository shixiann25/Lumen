import { useState } from 'react'
import AnalysisResult from './AnalysisResult'
import { useLang } from '../contexts/LangContext'

export default function HistoryPage({ history, removeRecord, clearAll }) {
  const { t, lang } = useLang()
  const [selected, setSelected] = useState(null)
  const [confirmClear, setConfirmClear] = useState(false)

  if (selected) {
    const record = history.find((r) => r.id === selected)
    if (!record) { setSelected(null); return null }
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-2 text-[#A89C91] hover:text-[#1A1714] text-sm transition-colors"
          >
            {t('history.back')}
          </button>
          <button
            onClick={() => { removeRecord(record.id); setSelected(null) }}
            className="text-xs text-[#A89C91] hover:text-red-500 transition-colors"
          >
            {t('history.delete')}
          </button>
        </div>
        <AnalysisResult
          image={record.thumbnail}
          exif={record.exif}
          analysis={record.analysis}
          onReset={() => setSelected(null)}
          hideReset
        />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-[#B8965A] text-xs tracking-[0.2em] uppercase mb-3">{t('history.eyebrow')}</p>
          <h1 className="font-display text-3xl font-semibold text-[#1A1714]">{t('history.title')}</h1>
          <p className="text-[#6B6158] text-sm mt-2">{t('history.count', history.length)}</p>
        </div>
        {history.length > 0 && (
          confirmClear ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-[#6B6158]">{t('history.clear.confirm')}</span>
              <button
                onClick={() => { clearAll(); setConfirmClear(false) }}
                className="text-red-500 font-medium hover:text-red-600 transition-colors"
              >
                {t('history.clear.ok')}
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-[#A89C91] hover:text-[#6B6158] transition-colors"
              >
                {t('history.clear.cancel')}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-sm text-[#A89C91] hover:text-[#6B6158] transition-colors"
            >
              {t('history.clear')}
            </button>
          )
        )}
      </div>

      {/* Empty state */}
      {history.length === 0 && (
        <div className="text-center py-28 border border-dashed border-[#E5DED5] rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-[#F0EBE3] flex items-center justify-center text-2xl text-[#B8965A] mx-auto mb-5">
            ◎
          </div>
          <p className="font-display text-xl text-[#1A1714] mb-2">{t('history.empty.title')}</p>
          <p className="text-[#A89C91] text-sm">{t('history.empty.desc')}</p>
        </div>
      )}

      {/* Grid */}
      {history.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {history.map((record) => (
            <HistoryCard
              key={record.id}
              record={record}
              onClick={() => setSelected(record.id)}
              onDelete={() => removeRecord(record.id)}
              t={t}
              lang={lang}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryCard({ record, onClick, onDelete, t, lang }) {
  const formatDate = (ts) => {
    const d = new Date(ts)
    const now = new Date()
    const diffMs = now - d
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays === 0) return `${t('history.today')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    if (diffDays === 1) return t('history.yesterday')
    if (diffDays < 7) return t('history.days.ago', diffDays)
    return d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden border border-[#E5DED5] hover:border-[#B8965A]/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-[3/4] overflow-hidden bg-[#F0EBE3] relative">
        {record.thumbnail ? (
          <img
            src={record.thumbnail}
            alt="历史记录"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-[#B8965A] opacity-40">
            ◎
          </div>
        )}
        {/* Delete button — always visible on mobile, hover-only on desktop */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white text-sm flex items-center justify-center hover:bg-red-500/80 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
          title="删除"
        >
          ×
        </button>
        {/* Overall feel overlay */}
        {record.analysis?.overallFeel && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-white text-xs leading-snug line-clamp-2">{record.analysis.overallFeel}</p>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="p-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[#A89C91] text-xs">{formatDate(record.id)}</p>
          {record.exif?.exposureMode === 1 && (
            <span className="bg-[#1A1714] text-white text-[10px] px-1.5 py-0.5 rounded font-medium">M</span>
          )}
        </div>

        {record.exif ? (
          <div className="flex flex-wrap gap-1.5 text-xs text-[#6B6158]">
            {record.exif.aperture && <span>f/{record.exif.aperture}</span>}
            {record.exif.shutterSpeed && <span>{record.exif.shutterSpeed}</span>}
            {record.exif.iso && <span>ISO {record.exif.iso}</span>}
          </div>
        ) : (
          <p className="text-[#A89C91] text-xs">{t('history.no.exif')}</p>
        )}

        {record.analysis?.improvement && (
          <p className="text-[#6B6158] text-xs mt-2 line-clamp-2 leading-relaxed">
            {record.analysis.improvement}
          </p>
        )}
      </div>
    </div>
  )
}
