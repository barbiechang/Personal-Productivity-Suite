import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'

interface VocabWordDto {
  id: string
  word: string
  meaning: string
  exampleSentence: string | null
  isLearned: boolean
  createdAt: string
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function AddWordForm({ onAdd }: { onAdd: (word: string, meaning: string, example: string) => void }) {
  const [word, setWord] = useState('')
  const [meaning, setMeaning] = useState('')
  const [example, setExample] = useState('')

  function submit() {
    if (!word.trim() || !meaning.trim()) return
    onAdd(word.trim(), meaning.trim(), example.trim())
    setWord('')
    setMeaning('')
    setExample('')
  }

  return (
    <div className="mb-6 flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-white p-3">
      <input
        value={word}
        onChange={(e) => setWord(e.target.value)}
        placeholder="Word"
        className="w-32 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
      />
      <input
        value={meaning}
        onChange={(e) => setMeaning(e.target.value)}
        placeholder="Meaning"
        className="w-40 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
      />
      <input
        value={example}
        onChange={(e) => setExample(e.target.value)}
        placeholder="Example sentence (optional)"
        className="min-w-[12rem] flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
      />
      <button onClick={submit} className="rounded-md bg-pink-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-pink-600">
        Add word
      </button>
    </div>
  )
}

function WordRow({ word, onToggle, onDelete }: { word: VocabWordDto; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="group flex items-center gap-3 border-b border-gray-100 px-3 py-2.5 last:border-b-0">
      <input type="checkbox" checked={word.isLearned} onChange={onToggle} className="accent-pink-500" />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${word.isLearned ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
          {word.word} <span className="font-normal text-gray-500">— {word.meaning}</span>
        </p>
        {word.exampleSentence && <p className="truncate text-xs italic text-gray-400">{word.exampleSentence}</p>}
      </div>
      <button onClick={onDelete} className="hidden text-xs text-red-400 hover:text-red-600 group-hover:inline">
        Delete
      </button>
    </div>
  )
}

function PracticeMode({ words, onMarkLearned }: { words: VocabWordDto[]; onMarkLearned: (id: string) => void }) {
  const [queue, setQueue] = useState<VocabWordDto[]>([])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    setQueue(shuffle(words))
    setIndex(0)
    setRevealed(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const current = queue[index]

  function next() {
    setRevealed(false)
    setIndex((i) => (i + 1) % queue.length)
  }

  if (queue.length === 0) {
    return <p className="text-sm text-gray-500">No words to practice. Add some words first, or mark a few as "still learning".</p>
  }

  return (
    <div className="flex flex-col items-center">
      <p className="mb-3 text-xs text-gray-400">
        Card {index + 1} / {queue.length}
      </p>
      <div
        onClick={() => setRevealed((r) => !r)}
        className="mb-4 flex h-48 w-80 cursor-pointer flex-col items-center justify-center rounded-2xl border border-pink-200 bg-white p-6 text-center shadow-sm"
      >
        {!revealed ? (
          <p className="text-2xl font-semibold text-gray-800">{current.word}</p>
        ) : (
          <div>
            <p className="text-lg font-semibold text-gray-800">{current.meaning}</p>
            {current.exampleSentence && <p className="mt-2 text-sm italic text-gray-500">{current.exampleSentence}</p>}
          </div>
        )}
        <p className="mt-3 text-[0.6875rem] text-gray-300">{revealed ? 'click to hide' : 'click to reveal'}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            onMarkLearned(current.id)
            next()
          }}
          className="rounded-md bg-pink-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-pink-600"
        >
          I know this
        </button>
        <button onClick={next} className="rounded-md border border-gray-300 px-4 py-1.5 text-sm hover:bg-gray-50">
          Still learning
        </button>
      </div>
    </div>
  )
}

export default function EnglishPractice() {
  const [words, setWords] = useState<VocabWordDto[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'list' | 'practice'>('list')

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    const res = await api.get<VocabWordDto[]>('/vocab-words')
    setWords(res.data)
    setLoading(false)
  }

  async function addWord(word: string, meaning: string, example: string) {
    const res = await api.post<VocabWordDto>('/vocab-words', { word, meaning, exampleSentence: example || null })
    setWords((prev) => [res.data, ...prev])
  }

  async function toggleLearned(w: VocabWordDto) {
    const res = await api.put<VocabWordDto>(`/vocab-words/${w.id}`, { isLearned: !w.isLearned })
    setWords((prev) => prev.map((x) => (x.id === w.id ? res.data : x)))
  }

  async function markLearned(id: string) {
    const res = await api.put<VocabWordDto>(`/vocab-words/${id}`, { isLearned: true })
    setWords((prev) => prev.map((x) => (x.id === id ? res.data : x)))
  }

  async function deleteWord(id: string) {
    await api.delete(`/vocab-words/${id}`)
    setWords((prev) => prev.filter((x) => x.id !== id))
  }

  const unlearned = useMemo(() => words.filter((w) => !w.isLearned), [words])
  const learnedCount = words.length - unlearned.length

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">English Practice</h2>
          <p className="text-xs text-gray-400">
            {learnedCount} / {words.length} words learned
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('list')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${mode === 'list' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Word list
          </button>
          <button
            onClick={() => setMode('practice')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${mode === 'practice' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Practice
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : mode === 'list' ? (
        <>
          <AddWordForm onAdd={addWord} />
          {words.length === 0 ? (
            <p className="text-sm text-gray-400">No words yet. Add your first word above.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              {words.map((w) => (
                <WordRow key={w.id} word={w} onToggle={() => toggleLearned(w)} onDelete={() => deleteWord(w.id)} />
              ))}
            </div>
          )}
        </>
      ) : (
        <PracticeMode words={unlearned.length > 0 ? unlearned : words} onMarkLearned={markLearned} />
      )}
    </div>
  )
}
