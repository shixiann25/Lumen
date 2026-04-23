import { useState } from 'react'
import HomePage from './components/HomePage'
import UploadPage from './components/UploadPage'
import GalleryPage from './components/GalleryPage'
import HistoryPage from './components/HistoryPage'
import LearnPage from './components/LearnPage'
import Navbar from './components/Navbar'
import { useHistory } from './hooks/useHistory'
import { LangProvider } from './contexts/LangContext'

export default function App() {
  const [page, setPage] = useState('home')
  const { history, addRecord, removeRecord, clearAll } = useHistory()

  return (
    <LangProvider>
      <div className="min-h-screen bg-[#F8F6F2] text-[#1A1714]" style={{ fontFamily: 'var(--font-body)' }}>
        <Navbar page={page} setPage={setPage} historyCount={history.length} />
        <main>
          {page === 'home'    && <HomePage setPage={setPage} />}
          {page === 'upload'  && <UploadPage setPage={setPage} addRecord={addRecord} />}
          {page === 'gallery' && <GalleryPage setPage={setPage} />}
          {page === 'history' && <HistoryPage history={history} removeRecord={removeRecord} clearAll={clearAll} />}
          {page === 'learn'   && <LearnPage />}
        </main>
      </div>
    </LangProvider>
  )
}
