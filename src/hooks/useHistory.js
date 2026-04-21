import { useState, useEffect, useCallback, useRef } from 'react'
import { openDB } from 'idb'

const DB_NAME = 'lumen-db'
const DB_VERSION = 1
const STORE = 'history'
const MAX_ITEMS = 500

function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    },
  })
}

export function useHistory() {
  const [history, setHistory] = useState([])
  const [ready, setReady] = useState(false)
  const dbRef = useRef(null)

  // Load all records on mount
  useEffect(() => {
    initDB().then(async (db) => {
      dbRef.current = db
      const all = await db.getAll(STORE)
      all.sort((a, b) => b.id - a.id)
      setHistory(all)
      setReady(true)
    }).catch((e) => {
      console.error('IndexedDB init failed', e)
      setReady(true)
    })
  }, [])

  const addRecord = useCallback(async (record) => {
    const db = dbRef.current
    if (!db) return
    await db.put(STORE, record)
    setHistory((prev) => {
      const next = [record, ...prev.filter((r) => r.id !== record.id)]
      // Trim oldest beyond MAX_ITEMS asynchronously
      if (next.length > MAX_ITEMS) {
        const toDelete = next.slice(MAX_ITEMS)
        toDelete.forEach((r) => db.delete(STORE, r.id).catch(() => {}))
        return next.slice(0, MAX_ITEMS)
      }
      return next
    })
  }, [])

  const removeRecord = useCallback(async (id) => {
    const db = dbRef.current
    if (!db) return
    await db.delete(STORE, id)
    setHistory((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const clearAll = useCallback(async () => {
    const db = dbRef.current
    if (!db) return
    await db.clear(STORE)
    setHistory([])
  }, [])

  return { history, addRecord, removeRecord, clearAll, ready }
}

/** Compress a File to a thumbnail dataURL (max 600px, JPEG 0.8) */
export async function makeThumbnail(file) {
  try {
    const bitmap = await createImageBitmap(file)
    const maxDim = 600
    let { width, height } = bitmap
    if (width > maxDim || height > maxDim) {
      const scale = maxDim / Math.max(width, height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', 0.8)
  } catch {
    return null
  }
}
