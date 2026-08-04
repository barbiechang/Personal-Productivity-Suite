import { useState } from 'react'
import { api } from '../lib/api'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!input.trim()) return
    const next = [...messages, { role: 'user', content: input } as Message]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await api.post<{ reply: string }>('/assistant/chat', { messages: next })
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Backend not reachable.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-4 text-xl font-semibold">AI Assistant</h2>

      <div className="flex-1 space-y-3 overflow-auto rounded-md border border-gray-200 bg-white p-4">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
            m.role === 'user' ? 'ml-auto bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'
          }`}>
            {m.content}
          </div>
        ))}
        {loading && <p className="text-xs text-gray-400">Thinking...</p>}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button
          onClick={send}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Send
        </button>
      </div>
    </div>
  )
}
