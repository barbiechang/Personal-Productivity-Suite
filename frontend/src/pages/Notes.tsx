import { useState } from 'react'

interface Note {
  id: string
  title: string
  body: string
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = notes.find((n) => n.id === selectedId) ?? null

  function createNote() {
    const note: Note = { id: crypto.randomUUID(), title: 'Untitled', body: '' }
    setNotes((prev) => [note, ...prev])
    setSelectedId(note.id)
  }

  function updateSelected(patch: Partial<Note>) {
    if (!selectedId) return
    setNotes((prev) => prev.map((n) => (n.id === selectedId ? { ...n, ...patch } : n)))
  }

  return (
    <div className="flex h-full gap-4">
      <div className="w-64 shrink-0">
        <button
          onClick={createNote}
          className="mb-3 w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + New Note
        </button>
        <ul className="flex flex-col gap-1">
          {notes.map((n) => (
            <li key={n.id}>
              <button
                onClick={() => setSelectedId(n.id)}
                className={`w-full truncate rounded-md px-3 py-2 text-left text-sm ${
                  n.id === selectedId ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'
                }`}
              >
                {n.title || 'Untitled'}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-1">
        {selected ? (
          <div className="flex h-full flex-col gap-2">
            <input
              className="rounded-md border border-gray-300 px-3 py-2 text-lg font-semibold"
              value={selected.title}
              onChange={(e) => updateSelected({ title: e.target.value })}
            />
            <textarea
              className="flex-1 resize-none rounded-md border border-gray-300 p-3 text-sm"
              value={selected.body}
              onChange={(e) => updateSelected({ body: e.target.value })}
              placeholder="Write your note..."
            />
          </div>
        ) : (
          <p className="text-sm text-gray-500">Select or create a note.</p>
        )}
      </div>
    </div>
  )
}
