import { useState, useRef, useEffect } from 'react'

export default function PhotoChat({ imageBase64, imageUrl, mediaType, exif, analysis }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed || loading) return

    const userMsg = { role: 'user', content: trimmed }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          imageBase64,
          imageUrl,
          mediaType,
          exif,
          analysis,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '请求失败')
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const SUGGESTED = [
    '为什么背景虚化不够？',
    '这张照片怎么调整白平衡？',
    '如果换成手动模式怎么设置？',
    '自然光哪个方向最好看？',
  ]

  return (
    <div className="mt-8 border border-[#E5DED5] rounded-2xl overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E5DED5] bg-[#F8F6F2]">
        <div className="w-7 h-7 rounded-full bg-[#1A1714] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs">◎</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1A1714]">继续问 AI</p>
          <p className="text-xs text-[#A89C91]">针对这张照片，随时提问</p>
        </div>
      </div>

      {/* Messages */}
      <div className="px-5 py-4 space-y-4 max-h-96 overflow-y-auto">
        {/* Empty state — suggested questions */}
        {messages.length === 0 && (
          <div>
            <p className="text-xs text-[#A89C91] mb-3">你可以问我：</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="text-xs px-3 py-2 rounded-full border border-[#E5DED5] text-[#6B6158] hover:border-[#B8965A] hover:text-[#B8965A] transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-[#1A1714] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-[10px]">◎</span>
              </div>
            )}
            <div
              className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#1A1714] text-white rounded-tr-sm'
                  : 'bg-[#F8F6F2] text-[#1A1714] rounded-tl-sm border border-[#E5DED5]'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-6 h-6 rounded-full bg-[#1A1714] flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-[10px]">◎</span>
            </div>
            <div className="bg-[#F8F6F2] border border-[#E5DED5] rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center h-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8965A] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8965A] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8965A] animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-500 text-center">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#E5DED5] flex gap-2">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="问关于这张照片的任何问题…"
          className="flex-1 resize-none bg-[#F8F6F2] rounded-xl px-4 py-2.5 text-sm text-[#1A1714] placeholder-[#C4B9B0] outline-none border border-[#E5DED5] focus:border-[#B8965A] transition-colors"
          style={{ maxHeight: '120px' }}
          onInput={(e) => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 rounded-xl bg-[#1A1714] text-white text-sm font-medium hover:bg-[#B8965A] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
        >
          发送
        </button>
      </div>
    </div>
  )
}
