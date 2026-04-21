import { useState, useRef, useCallback, useEffect } from 'react'
import * as exifr from 'exifr'
import AnalysisResult from './AnalysisResult'
import { makeThumbnail } from '../hooks/useHistory'

const STATES = {
  IDLE: 'idle',
  READING: 'reading',
  ANALYZING: 'analyzing',
  DONE: 'done',
  ERROR: 'error',
}

const FOCUS_OPTIONS = [
  { id: 'exposure', label: '曝光参数' },
  { id: 'light', label: '用光分析' },
  { id: 'composition', label: '构图' },
  { id: 'focal', label: '焦段选择' },
  { id: 'manual', label: '手动模式' },
  { id: 'portrait', label: '人像用光' },
]

const CONTEXT_KEY = 'lumen-user-context'

export default function UploadPage({ addRecord }) {
  const [state, setState] = useState(STATES.IDLE)
  const [preview, setPreview] = useState(null)
  const [imageBase64, setImageBase64] = useState(null)
  const [imageMediaType, setImageMediaType] = useState(null)
  const [exif, setExif] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [contextOpen, setContextOpen] = useState(false)
  const [device, setDevice] = useState('')
  const [focusAreas, setFocusAreas] = useState([])
  const [focusNote, setFocusNote] = useState('')
  const inputRef = useRef()

  // Restore saved context on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CONTEXT_KEY) || '{}')
      if (saved.device) setDevice(saved.device)
      if (saved.focusAreas) setFocusAreas(saved.focusAreas)
      if (saved.focusNote) setFocusNote(saved.focusNote)
      if (saved.device || saved.focusAreas?.length || saved.focusNote) setContextOpen(true)
    } catch {}
  }, [])

  const saveContext = (d, f, n) => {
    try { localStorage.setItem(CONTEXT_KEY, JSON.stringify({ device: d, focusAreas: f, focusNote: n })) } catch {}
  }

  const toggleFocus = (id) => {
    const next = focusAreas.includes(id) ? focusAreas.filter(x => x !== id) : [...focusAreas, id]
    setFocusAreas(next)
    saveContext(device, next, focusNote)
  }

  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setError('请上传图片文件（JPG / PNG / HEIC 等）')
      setState(STATES.ERROR)
      return
    }

    setState(STATES.READING)
    setError(null)
    setExif(null)
    setAnalysis(null)
    setPreview(URL.createObjectURL(file))

    // Make thumbnail for history (run in background, doesn't block)
    let thumbnailDataUrl = null
    makeThumbnail(file).then((t) => { thumbnailDataUrl = t }).catch(() => {})

    let exifData = null
    try {
      const raw = await exifr.parse(file, { tiff: true, exif: true, gps: false })
      if (raw) {
        exifData = {
          aperture: raw.FNumber,
          shutterSpeed: raw.ExposureTime ? formatShutter(raw.ExposureTime) : null,
          exposureTime: raw.ExposureTime,
          iso: raw.ISO,
          focalLength: raw.FocalLength,
          whiteBalance: raw.WhiteBalance,
          whiteBalanceMode: raw.WhiteBalanceMode,
          exposureMode: raw.ExposureMode,
          exposureProgram: raw.ExposureProgram,
          make: raw.Make,
          model: raw.Model,
          dateTime: raw.DateTimeOriginal
            ? new Date(raw.DateTimeOriginal).toLocaleString('zh-CN')
            : null,
        }
        setExif(exifData)
      }
    } catch { /* continue without EXIF */ }

    setState(STATES.ANALYZING)
    try {
      const { base64, mediaType: compressedType } = await compressToBase64(file, 4.5)
      setImageBase64(base64)
      setImageMediaType(compressedType)
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: compressedType,
          exif: exifData,
          userContext: { device: device.trim(), focusAreas, focusNote: focusNote.trim() },
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `请求失败 (${res.status})`)
      }
      const result = await res.json()
      setAnalysis(result)
      setState(STATES.DONE)
      // Save to history
      if (addRecord) {
        addRecord({
          id: Date.now(),
          thumbnail: thumbnailDataUrl,
          exif: exifData,
          analysis: result,
        })
      }
    } catch (err) {
      setError(err.message)
      setState(STATES.ERROR)
    }
  }, [device, focusAreas, focusNote])

  const onFileChange = (e) => { const f = e.target.files?.[0]; if (f) processFile(f) }
  const onDrop = (e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processFile(f) }
  const reset = () => {
    setState(STATES.IDLE); setPreview(null); setExif(null); setAnalysis(null); setError(null)
    setImageBase64(null); setImageMediaType(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const isLoading = state === STATES.READING || state === STATES.ANALYZING

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[#B8965A] text-xs tracking-[0.2em] uppercase mb-3">Analyze</p>
        <h1 className="font-display text-3xl font-semibold text-[#1A1714]">分析我的照片</h1>
        <p className="text-[#6B6158] text-sm mt-2">上传相机拍摄的照片，AI 帮你解读参数与改进思路</p>
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      {/* User context panel */}
      {state === STATES.IDLE && (
        <div className="mb-5 border border-[#E5DED5] rounded-2xl overflow-hidden">
          <button
            onClick={() => setContextOpen(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm hover:bg-[#FDFCFA] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-[#B8965A]">◈</span>
              <span className="font-medium text-[#1A1714]">告诉 AI 更多信息</span>
              <span className="text-[#A89C91] text-xs">选填，让分析更有针对性</span>
              {(device || focusAreas.length > 0 || focusNote) && (
                <span className="bg-[#B8965A] text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">已填</span>
              )}
            </div>
            <span className={`text-[#A89C91] text-xs transition-transform duration-200 ${contextOpen ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {contextOpen && (
            <div className="px-5 pb-5 border-t border-[#E5DED5] space-y-4 pt-4">
              {/* Device */}
              <div>
                <label className="block text-xs font-medium text-[#6B6158] mb-2">设备型号</label>
                <input
                  type="text"
                  value={device}
                  onChange={e => { setDevice(e.target.value); saveContext(e.target.value, focusAreas) }}
                  placeholder="如：富士 X-T30 + 35mm f/2，或 iPhone 15 Pro"
                  className="w-full border border-[#E5DED5] rounded-xl px-4 py-2.5 text-sm text-[#1A1714] placeholder-[#C4BAB0] focus:outline-none focus:border-[#B8965A] transition-colors bg-white"
                />
              </div>
              {/* Focus areas */}
              <div>
                <label className="block text-xs font-medium text-[#6B6158] mb-2">希望重点分析</label>
                <div className="flex flex-wrap gap-2">
                  {FOCUS_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => toggleFocus(opt.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        focusAreas.includes(opt.id)
                          ? 'bg-[#1A1714] text-white border-[#1A1714]'
                          : 'bg-white text-[#6B6158] border-[#E5DED5] hover:border-[#B8965A] hover:text-[#B8965A]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={focusNote}
                  onChange={e => { setFocusNote(e.target.value); saveContext(device, focusAreas, e.target.value) }}
                  placeholder="或手动输入，如：想了解如何在室内弱光下手持拍摄"
                  className="mt-2.5 w-full border border-[#E5DED5] rounded-xl px-4 py-2.5 text-sm text-[#1A1714] placeholder-[#C4BAB0] focus:outline-none focus:border-[#B8965A] transition-colors bg-white"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {state === STATES.IDLE && (
        <DropZone
          dragging={dragging}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => inputRef.current?.click()}
        />
      )}

      {isLoading && (
        <div className="text-center py-20">
          <div className="inline-flex flex-col items-center gap-5">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 border-2 border-[#E5DED5] rounded-full" />
              <div className="absolute inset-0 border-2 border-transparent border-t-[#B8965A] rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-[#B8965A]">◎</div>
            </div>
            <div className="text-center">
              <p className="text-[#1A1714] font-medium text-sm">
                {state === STATES.READING ? '读取 EXIF 参数中' : 'AI 解读画面中'}
              </p>
              <p className="text-[#A89C91] text-xs mt-1">
                {state === STATES.ANALYZING ? '约 3–5 秒…' : ''}
              </p>
            </div>
          </div>
          {preview && (
            <img src={preview} alt="preview" className="mt-10 max-h-56 mx-auto rounded-xl object-contain opacity-40" />
          )}
        </div>
      )}

      {state === STATES.ERROR && (
        <div className="space-y-4">
          <div className="border border-red-200 bg-red-50 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
          {preview && <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-xl object-contain opacity-50" />}
          <button onClick={reset} className="w-full py-3.5 rounded-xl bg-[#1A1714] text-white font-medium hover:bg-[#2D2520] transition-colors">
            重新上传
          </button>
        </div>
      )}

      {state === STATES.DONE && (
        <AnalysisResult
          image={preview}
          exif={exif}
          analysis={analysis}
          onReset={reset}
          imageBase64={imageBase64}
          mediaType={imageMediaType}
        />
      )}
    </div>
  )
}

function DropZone({ dragging, onDrop, onDragOver, onDragLeave, onClick }) {
  return (
    <div
      onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave} onClick={onClick}
      className={`relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
        dragging
          ? 'border-[#B8965A] bg-[#FBF4E8]'
          : 'border-[#E5DED5] hover:border-[#B8965A]/50 hover:bg-[#FDFCFA]'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#F0EBE3] flex items-center justify-center text-2xl text-[#B8965A]">◎</div>
        <div>
          <p className="font-semibold text-[#1A1714] mb-1">拖拽照片到这里，或点击选择</p>
          <p className="text-[#A89C91] text-sm">JPG / PNG / HEIC / WEBP，最大 30MB</p>
          <p className="text-[#A89C91] text-xs mt-1">相机原图含 EXIF 参数，分析效果最佳</p>
        </div>
      </div>
    </div>
  )
}

function formatShutter(t) {
  if (!t) return null
  if (t >= 1) return `${t}s`
  return `1/${Math.round(1 / t)}s`
}

async function compressToBase64(file, maxMB = 4.5) {
  const maxBytes = maxMB * 1024 * 1024
  if (file.size <= maxBytes) {
    const base64 = await new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result.split(',')[1])
      r.onerror = rej
      r.readAsDataURL(file)
    })
    return { base64, mediaType: file.type }
  }
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  const maxDim = 3000
  let { width, height } = bitmap
  if (width > maxDim || height > maxDim) {
    const scale = maxDim / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }
  canvas.width = width; canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
  const mediaType = 'image/jpeg'
  for (const q of [0.92, 0.85, 0.75, 0.65, 0.5]) {
    const dataUrl = canvas.toDataURL(mediaType, q)
    const base64 = dataUrl.split(',')[1]
    if (base64.length * 0.75 <= maxBytes) return { base64, mediaType }
  }
  return { base64: canvas.toDataURL(mediaType, 0.4).split(',')[1], mediaType }
}
