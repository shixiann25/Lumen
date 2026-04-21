import { useState } from 'react'
import AnalysisResult from './AnalysisResult'

export default function HistoryPage({ history, removeRecord, clearAll }) {
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
            ← 返回历史记录
          </button>
          <button
            onClick={() => { removeRecord(record.id); setSelected(null) }}
            className="text-xs text-[#A89C91] hover:text-red-500 transition-colors"
          >
            删除这条记录
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
          <p className="text-[#B8965A] text-xs tracking-[0.2em] uppercase mb-3">History</p>
          <h1 className="font-display text-3xl font-semibold text-[#1A1714]">分析历史</h1>
          <p className="text-[#6B6158] text-sm mt-2">你上传并解读过的 {history.length} 张照片</p>
        </div>
        {history.length > 0 && (
          confirmClear ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-[#6B6158]">确认清空全部？</span>
              <button
                onClick={() => { clearAll(); setConfirmClear(false) }}
                className="text-red-500 font-medium hover:text-red-600 transition-colors"
              >
                确认
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="text-[#A89C91] hover:text-[#6B6158] transition-colors"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-sm text-[#A89C91] hover:text-[#6B6158] transition-colors"
            >
              清空记录
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
          <p className="font-display text-xl text-[#1A1714] mb-2">还没有分析记录</p>
          <p className="text-[#A89C91] text-sm">上传一张照片，AI 解读结果会自动保存在这里</p>
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
            />
          ))}
        </div>
      )}
    </div>
  )
}

function HistoryCard({ record, onClick, onDelete }) {
  const [hover, setHover] = useState(false)

  const formatDate = (ts) => {
    const d = new Date(ts)
    const now = new Date()
    const diffMs = now - d
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays === 0) return `今天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    if (diffDays === 1) return '昨天'
    if (diffDays < 7) return `${diffDays} 天前`
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  }

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden border border-[#E5DED5] hover:border-[#B8965A]/50 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
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
        {/* Delete button */}
        {hover && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-red-500/80 transition-colors"
            title="删除"
          >
            ×
          </button>
        )}
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
          <p className="text-[#A89C91] text-xs">无 EXIF 参数</p>
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
