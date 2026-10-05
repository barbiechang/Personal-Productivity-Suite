import { useEffect, useRef, useState } from 'react'
import { endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek } from 'date-fns'
import { api } from '../../lib/api'
import ImageCropModal from './ImageCropModal'
import { getHoliday } from './holidays'
import type { CalendarListItemDto, CalendarListKind, CalendarStickerDto } from './types'

const CARD_COLORS = ['#fff1f5', '#fdf2e9', '#f3f0ff', '#eefaf3']

function ChecklistWidget({ year, month, kind, title }: { year: number; month: number; kind: CalendarListKind; title: string }) {
  const [items, setItems] = useState<CalendarListItemDto[]>([])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    api.get<CalendarListItemDto[]>('/calendar-list-items', { params: { year, month, kind } }).then((res) => setItems(res.data))
  }, [year, month, kind])

  async function add() {
    if (!draft.trim()) return
    const res = await api.post<CalendarListItemDto>('/calendar-list-items', { year, month, kind, text: draft.trim() })
    setItems((prev) => [res.data, ...prev])
    setDraft('')
  }

  async function toggle(item: CalendarListItemDto) {
    const res = await api.put<CalendarListItemDto>(`/calendar-list-items/${item.id}`, { isDone: !item.isDone })
    setItems((prev) => prev.map((i) => (i.id === item.id ? res.data : i)))
  }

  async function remove(id: string) {
    await api.delete(`/calendar-list-items/${id}`)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="mb-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      <div className="mb-2 flex gap-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add..."
          className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm outline-none focus:border-pink-300"
        />
        <button onClick={add} className="rounded-md bg-pink-100 px-2 text-sm text-pink-600 hover:bg-pink-200">
          +
        </button>
      </div>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id} className="group flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={item.isDone} onChange={() => toggle(item)} className="accent-pink-400" />
            <span className={`flex-1 ${item.isDone ? 'text-gray-400 line-through' : ''}`}>{item.text}</span>
            <button
              onClick={() => remove(item.id)}
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white text-[0.625rem] leading-none text-pink-300 opacity-0 hover:text-pink-500 group-hover:opacity-100"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function NotesWidget({ year, month }: { year: number; month: number }) {
  const [items, setItems] = useState<CalendarListItemDto[]>([])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    api.get<CalendarListItemDto[]>('/calendar-list-items', { params: { year, month, kind: 'note' } }).then((res) => setItems(res.data))
  }, [year, month])

  async function add() {
    if (!draft.trim()) return
    const res = await api.post<CalendarListItemDto>('/calendar-list-items', { year, month, kind: 'note', text: draft.trim() })
    setItems((prev) => [res.data, ...prev])
    setDraft('')
  }

  async function remove(id: string) {
    await api.delete(`/calendar-list-items/${id}`)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="mb-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Notes</h3>
      <div className="mb-2 flex gap-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add a note..."
          className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm outline-none focus:border-pink-300"
        />
        <button onClick={add} className="rounded-md bg-pink-100 px-2 text-sm text-pink-600 hover:bg-pink-200">
          +
        </button>
      </div>
      <div className="flex flex-col gap-1">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="group relative rounded-md px-2 py-1.5 text-sm text-gray-700 shadow-sm"
            style={{ backgroundColor: CARD_COLORS[i % CARD_COLORS.length] }}
          >
            {item.text}
            <button
              onClick={() => remove(item.id)}
              className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[0.625rem] leading-none text-pink-300 opacity-0 shadow-sm hover:text-pink-500 group-hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function MoodPhoto({ year, month }: { year: number; month: number }) {
  const [photo, setPhoto] = useState<CalendarStickerDto | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.get<CalendarStickerDto[]>('/calendar-stickers', { params: { year, month, region: 'sidebar' } }).then((res) => setPhoto(res.data[0] ?? null))
  }, [year, month])

  async function handleConfirm(dataUrl: string) {
    if (photo) await api.delete(`/calendar-stickers/${photo.id}`)
    const res = await api.post<CalendarStickerDto>('/calendar-stickers', {
      year,
      month,
      region: 'sidebar',
      imageDataUrl: dataUrl,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    })
    setPhoto(res.data)
    setPendingFile(null)
  }

  return (
    <div className="mb-5">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) setPendingFile(file)
          e.target.value = ''
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="flex h-28 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-pink-200 bg-pink-50/50"
      >
        {photo ? <img src={photo.imageDataUrl} alt="" className="h-full w-full object-contain" /> : <span className="text-sm text-pink-300">+ Add photo</span>}
      </button>

      {pendingFile && <ImageCropModal file={pendingFile} onCancel={() => setPendingFile(null)} onConfirm={handleConfirm} />}
    </div>
  )
}

export default function Sidebar({
  month,
  onSelectMonth,
  highlightDay,
  onHighlightDay,
}: {
  month: Date
  onSelectMonth: (d: Date) => void
  highlightDay: Date | null
  onHighlightDay: (d: Date) => void
}) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()

  const miniDays = (() => {
    const start = startOfWeek(startOfMonth(month))
    const end = endOfWeek(endOfMonth(month))
    const list: Date[] = []
    for (let d = start; d <= end; d = new Date(d.getTime() + 86400000)) list.push(d)
    return list
  })()

  return (
    <aside className="w-64 shrink-0 border-r border-pink-100 bg-white/60 p-4">
      <div className="mb-3 flex items-center gap-2">
        <select
          value={monthIndex}
          onChange={(e) => onSelectMonth(new Date(year, Number(e.target.value), 1))}
          className="rounded-md border border-gray-200 bg-white px-1.5 py-1 text-sm"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={i}>
              {format(new Date(2000, i, 1), 'MMMM')}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => onSelectMonth(new Date(Number(e.target.value), monthIndex, 1))}
          className="rounded-md border border-gray-200 bg-white px-1.5 py-1 text-sm"
        >
          {Array.from({ length: 11 }).map((_, i) => {
            const y = new Date().getFullYear() - 5 + i
            return (
              <option key={y} value={y}>
                {y}
              </option>
            )
          })}
        </select>
      </div>

      <div className="mb-5 grid grid-cols-7 gap-0.5 rounded-lg bg-white p-2 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i} className="text-xs text-gray-400">
            {d}
          </span>
        ))}
        {miniDays.map((d) => {
          const holiday = getHoliday(d.getMonth() + 1, d.getDate())
          return (
            <button
              key={d.toISOString()}
              onClick={() => onHighlightDay(d)}
              title={holiday?.name}
              className={`relative rounded-full text-xs leading-6 ${
                !isSameMonth(d, month) ? 'text-gray-300' : isToday(d) ? 'bg-pink-400 text-white' : 'text-gray-600 hover:bg-pink-50'
              } ${highlightDay && isSameDay(d, highlightDay) ? 'ring-1 ring-pink-400' : ''}`}
            >
              {format(d, 'd')}
              {holiday && <span className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-pink-400" />}
            </button>
          )
        })}
      </div>

      <ChecklistWidget year={year} month={monthIndex + 1} kind="priority" title="This month's priorities" />
      <NotesWidget year={year} month={monthIndex + 1} />
      <MoodPhoto year={year} month={monthIndex + 1} />
    </aside>
  )
}
