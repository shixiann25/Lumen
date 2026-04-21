import PhotoChat from './PhotoChat'

const PARAM_INFO = {
  aperture:     { label: '光圈',     icon: '◉', format: v => `f/${v}`, tip: 'f 值越小光圈越大，背景虚化越明显，进光越多' },
  shutterSpeed: { label: '快门速度', icon: '◷', format: v => v,        tip: '越快能冻结运动；越慢光线更多，但易糊' },
  iso:          { label: 'ISO',      icon: '◑', format: v => `${v}`,   tip: '越高暗处越亮，但噪点也越多；白天尽量保持低值' },
  focalLength:  { label: '焦段',     icon: '◎', format: v => `${v}mm`, tip: '广角(<35mm)视野宽；长焦(>85mm)适合人像和远景' },
}

function formatWhiteBalance(exif) {
  if (exif.whiteBalance === 0) return 'AWB 自动'
  if (exif.whiteBalance === 1) return '手动'
  if (exif.whiteBalanceMode) return exif.whiteBalanceMode
  return null
}

export default function AnalysisResult({ image, exif, analysis, onReset, hideReset, imageBase64, imageUrl, mediaType }) {
  const wb = exif ? formatWhiteBalance(exif) : null

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
            <p className="text-[#A89C91] text-xs tracking-[0.2em] uppercase">拍摄参数</p>
            <div className="flex-1 h-px bg-[#E5DED5]" />
            {exif.exposureMode === 1 && (
              <span className="text-xs bg-[#1A1714] text-white px-2.5 py-1 rounded-full">M 手动</span>
            )}
            {exif.exposureMode === 0 && (
              <span className="text-xs border border-[#E5DED5] text-[#A89C91] px-2.5 py-1 rounded-full">自动曝光</span>
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
                info={{ label: '白平衡', icon: '◈', format: v => v, tip: 'AWB 适合大多数场景；手动白平衡精确控制色调' }}
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
          未读取到 EXIF 数据，可能是截图或经过处理的图片。AI 将仅根据画面内容分析。
        </div>
      )}

      {/* AI Analysis */}
      {analysis && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[#A89C91] text-xs tracking-[0.2em] uppercase">AI 解读</p>
            <div className="flex-1 h-px bg-[#E5DED5]" />
          </div>
          <AnalysisCard icon="◉" label="参数解释" content={analysis.paramExplanation} accent="#EBF3FA" />
          {analysis.manualModeTip && (
            <AnalysisCard icon="◈" label="手动模式怎么拍" content={analysis.manualModeTip} accent="#F0EBFA" />
          )}
          <AnalysisCard icon="◐" label="用光分析" content={analysis.intentAnalysis} accent="#EAFAF0" />
          <AnalysisCard icon="◑" label="改进建议" content={analysis.improvement} accent="#FBF4E8" />
          {analysis.lensTip && (
            <AnalysisCard icon="◎" label="镜头建议" content={analysis.lensTip} accent="#FAF0F0" />
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

      {!hideReset && onReset && (
        <button
          onClick={onReset}
          className="w-full py-4 rounded-xl border border-dashed border-[#E5DED5] text-[#A89C91] hover:border-[#B8965A] hover:text-[#B8965A] transition-colors text-sm"
        >
          + 再上传一张照片
        </button>
      )}
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
