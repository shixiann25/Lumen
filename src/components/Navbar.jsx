import { useLang } from '../contexts/LangContext'

export default function Navbar({ page, setPage, historyCount }) {
  const { t, lang, setLang } = useLang()

  return (
    <nav className="sticky top-0 z-50 bg-[#F8F6F2]/95 backdrop-blur-md border-b border-[#E5DED5]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand */}
        <button onClick={() => setPage('home')} className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-full bg-[#1A1714] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs">◎</span>
          </div>
          <span className="font-display text-base sm:text-lg font-semibold tracking-tight text-[#1A1714]">{t('nav.brand')}</span>
        </button>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="px-3 py-1.5 rounded-full text-xs font-medium text-[#A89C91] hover:text-[#1A1714] hover:bg-[#F0EBE3] transition-colors mr-1"
          >
            {lang === 'zh' ? 'EN' : '中'}
          </button>
          <NavBtn active={page === 'learn'} onClick={() => setPage('learn')}>{t('nav.learn')}</NavBtn>
          <NavBtn active={page === 'gallery'} onClick={() => setPage('gallery')}>{t('nav.gallery')}</NavBtn>
          <NavBtn active={page === 'history'} onClick={() => setPage('history')}>
            <span className="flex items-center gap-1.5">
              {t('nav.history')}
              {historyCount > 0 && (
                <span className="bg-[#B8965A] text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none font-medium">
                  {historyCount > 99 ? '99+' : historyCount}
                </span>
              )}
            </span>
          </NavBtn>
          <NavBtn active={page === 'upload'} onClick={() => setPage('upload')} primary>{t('nav.upload')}</NavBtn>
        </div>

        {/* Mobile: lang toggle + upload button only */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="px-2.5 py-1.5 rounded-full text-xs font-medium text-[#A89C91] hover:bg-[#F0EBE3] transition-colors"
          >
            {lang === 'zh' ? 'EN' : '中'}
          </button>
          <button
            onClick={() => setPage('upload')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${page === 'upload' ? 'bg-[#B8965A] text-white' : 'bg-[#1A1714] text-white'}`}
          >
            {t('nav.upload')}
          </button>
        </div>
      </div>
    </nav>
  )
}

function NavBtn({ active, onClick, children, primary }) {
  if (primary) {
    return (
      <button onClick={onClick} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${active ? 'bg-[#B8965A] text-white' : 'bg-[#1A1714] text-white hover:bg-[#B8965A]'}`}>
        {children}
      </button>
    )
  }
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${active ? 'text-[#1A1714] bg-[#E5DED5]' : 'text-[#6B6158] hover:text-[#1A1714] hover:bg-[#F0EBE3]'}`}>
      {children}
    </button>
  )
}
