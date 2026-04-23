import { createContext, useContext, useState } from 'react'
import { translations } from '../i18n/translations'

const LangContext = createContext()

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('lumen-lang') || 'zh' } catch { return 'zh' }
  })

  const switchLang = (l) => {
    setLang(l)
    try { localStorage.setItem('lumen-lang', l) } catch {}
  }

  const t = (key, ...args) => {
    const val = translations[lang]?.[key] ?? translations.zh?.[key] ?? key
    return typeof val === 'function' ? val(...args) : val
  }

  return (
    <LangContext.Provider value={{ lang, setLang: switchLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
