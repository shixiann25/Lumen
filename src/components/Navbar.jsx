export default function Navbar({ page, setPage, historyCount }) {
  return (
    <nav className="sticky top-0 z-50 bg-[#F8F6F2]/95 backdrop-blur-md border-b border-[#E5DED5]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => setPage('home')}
          className="flex items-center gap-3 group"
        >
          <div className="w-7 h-7 rounded-full bg-[#1A1714] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs">◎</span>
          </div>
          <div className="text-left">
            <span className="font-display text-lg font-semibold tracking-tight text-[#1A1714]">追光</span>
            <span className="text-[#A89C91] text-xs ml-2 tracking-widest uppercase font-light hidden sm:inline">Lumen</span>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <NavBtn active={page === 'learn'} onClick={() => setPage('learn')}>
            摄影知识
          </NavBtn>
          <NavBtn active={page === 'gallery'} onClick={() => setPage('gallery')}>
            参考图库
          </NavBtn>
          <NavBtn active={page === 'history'} onClick={() => setPage('history')}>
            <span className="flex items-center gap-1.5">
              历史记录
              {historyCount > 0 && (
                <span className="bg-[#B8965A] text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none font-medium">
                  {historyCount > 99 ? '99+' : historyCount}
                </span>
              )}
            </span>
          </NavBtn>
          <NavBtn active={page === 'upload'} onClick={() => setPage('upload')} primary>
            分析照片
          </NavBtn>
        </div>
      </div>
    </nav>
  )
}

function NavBtn({ active, onClick, children, primary }) {
  if (primary) {
    return (
      <button
        onClick={onClick}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
          active
            ? 'bg-[#B8965A] text-white'
            : 'bg-[#1A1714] text-white hover:bg-[#B8965A]'
        }`}
      >
        {children}
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'text-[#1A1714] bg-[#E5DED5]'
          : 'text-[#6B6158] hover:text-[#1A1714] hover:bg-[#F0EBE3]'
      }`}
    >
      {children}
    </button>
  )
}
