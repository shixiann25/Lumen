import { useLang } from '../contexts/LangContext'

export default function BottomNav({ page, setPage, historyCount }) {
  const { t } = useLang()

  const tabs = [
    { id: 'home',    icon: '⌂', label: t('nav.home') },
    { id: 'gallery', icon: '◰', label: t('nav.gallery') },
    { id: 'upload',  icon: '◎', label: t('nav.upload'), primary: true },
    { id: 'history', icon: '◑', label: t('nav.history'), badge: historyCount },
    { id: 'learn',   icon: '◈', label: t('nav.learn') },
  ]

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F8F6F2]/95 backdrop-blur-md border-t border-[#E5DED5] pb-safe">
      <div className="flex items-stretch h-16">
        {tabs.map(({ id, icon, label, primary, badge }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative ${
              primary
                ? page === id
                  ? 'text-[#B8965A]'
                  : 'text-[#1A1714]'
                : page === id
                  ? 'text-[#B8965A]'
                  : 'text-[#A89C91]'
            }`}
          >
            {primary ? (
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-0.5 transition-colors ${
                page === id ? 'bg-[#B8965A] text-white' : 'bg-[#1A1714] text-white'
              }`}>
                {icon}
              </div>
            ) : (
              <>
                <span className="text-lg leading-none relative">
                  {icon}
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-2 bg-[#B8965A] text-white text-[9px] px-1 py-px rounded-full leading-none font-medium min-w-[14px] text-center">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </>
            )}
            {primary && (
              <span className="text-[10px] font-medium leading-none -mt-1">{label}</span>
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
