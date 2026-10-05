import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { api } from '../../lib/api'

interface TripDto {
  id: string
  name: string
  description: string | null
  coverDataUrl: string | null
  startDate: string | null
  endDate: string | null
}

interface ItineraryItemDto {
  id: string
  tripId: string
  dayNumber: number
  time: string | null
  title: string
  notes: string | null
  order: number
}

interface PackingItemDto {
  id: string
  tripId: string
  text: string
  isPacked: boolean
  order: number
}

export default function TripDetail() {
  const { tripId } = useParams<{ tripId: string }>()
  const navigate = useNavigate()

  const [trip, setTrip] = useState<TripDto | null>(null)
  const [titleDraft, setTitleDraft] = useState('')
  const [items, setItems] = useState<ItineraryItemDto[]>([])
  const [packing, setPacking] = useState<PackingItemDto[]>([])
  const [loading, setLoading] = useState(true)

  const [newDay, setNewDay] = useState(1)
  const [newTime, setNewTime] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [packDraft, setPackDraft] = useState('')

  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!tripId) return
    setLoading(true)
    Promise.all([
      api.get<TripDto>(`/trips/${tripId}`),
      api.get<ItineraryItemDto[]>('/trip-itinerary-items', { params: { tripId } }),
      api.get<PackingItemDto[]>('/trip-packing-items', { params: { tripId } }),
    ]).then(([tripRes, itemsRes, packingRes]) => {
      setTrip(tripRes.data)
      setTitleDraft(tripRes.data.name)
      setItems(itemsRes.data)
      setPacking(packingRes.data)
      setLoading(false)
    })
  }, [tripId])

  const byDay = useMemo(() => {
    const map = new Map<number, ItineraryItemDto[]>()
    for (const item of items) {
      const list = map.get(item.dayNumber) ?? []
      list.push(item)
      map.set(item.dayNumber, list)
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0])
  }, [items])

  const maxDay = items.reduce((m, i) => Math.max(m, i.dayNumber), 0)

  useEffect(() => {
    setNewDay(Math.max(1, maxDay))
  }, [maxDay])

  async function commitTitle() {
    if (!trip || !tripId) return
    if (titleDraft.trim() === trip.name) return
    const res = await api.put<TripDto>(`/trips/${tripId}`, { name: titleDraft.trim() || trip.name, coverDataUrl: null, startDate: null, endDate: null })
    setTrip(res.data)
  }

  function handleCoverFile(file: File) {
    if (!trip || !tripId) return
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      const res = await api.put<TripDto>(`/trips/${tripId}`, { name: trip.name, coverDataUrl: dataUrl, startDate: null, endDate: null })
      setTrip(res.data)
    }
    reader.readAsDataURL(file)
  }

  async function addItem() {
    if (!newTitle.trim() || !tripId) return
    const res = await api.post<ItineraryItemDto>('/trip-itinerary-items', {
      tripId,
      dayNumber: newDay,
      time: newTime.trim() || null,
      title: newTitle.trim(),
    })
    setItems((prev) => [...prev, res.data])
    setNewTitle('')
    setNewTime('')
  }

  async function deleteItem(id: string) {
    await api.delete(`/trip-itinerary-items/${id}`)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  async function addPacking() {
    if (!packDraft.trim() || !tripId) return
    const res = await api.post<PackingItemDto>('/trip-packing-items', { tripId, text: packDraft.trim() })
    setPacking((prev) => [...prev, res.data])
    setPackDraft('')
  }

  async function togglePacking(item: PackingItemDto) {
    const res = await api.put<PackingItemDto>(`/trip-packing-items/${item.id}`, { isPacked: !item.isPacked })
    setPacking((prev) => prev.map((p) => (p.id === item.id ? res.data : p)))
  }

  async function deletePacking(id: string) {
    await api.delete(`/trip-packing-items/${id}`)
    setPacking((prev) => prev.filter((p) => p.id !== id))
  }

  if (loading || !trip) {
    return <p className="text-sm text-gray-500">Loading...</p>
  }

  const dayOptions = Array.from({ length: Math.max(1, maxDay + 1) }, (_, i) => i + 1)

  return (
    <div>
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleCoverFile(file)
          e.target.value = ''
        }}
      />

      <button onClick={() => navigate('/travel')} className="mb-2 text-sm text-gray-500 hover:text-gray-700">
        ← Travel Planner
      </button>

      <div className="group/cover relative mb-4 h-28 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-pink-100 to-rose-50">
        {trip.coverDataUrl && <img src={trip.coverDataUrl} alt="" className="h-full w-full object-cover" />}
        <button
          onClick={() => coverInputRef.current?.click()}
          className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-1 text-[0.6875rem] text-gray-600 opacity-0 shadow-sm hover:bg-white group-hover/cover:opacity-100"
        >
          Change cover
        </button>
      </div>

      <input
        value={titleDraft}
        onChange={(e) => setTitleDraft(e.target.value)}
        onBlur={commitTitle}
        className="mb-1 w-full border-none text-2xl font-bold text-gray-800 outline-none"
      />
      {(trip.startDate || trip.endDate) && (
        <p className="mb-6 text-xs text-gray-400">
          {trip.startDate && format(new Date(trip.startDate), 'MMM d, yyyy')}
          {trip.endDate && ` – ${format(new Date(trip.endDate), 'MMM d, yyyy')}`}
        </p>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-[2fr_1fr]">
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Itinerary</h3>

          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2">
            <select value={newDay} onChange={(e) => setNewDay(Number(e.target.value))} className="rounded-md border border-gray-300 px-2 py-1.5 text-sm">
              {dayOptions.map((d) => (
                <option key={d} value={d}>
                  Day {d}
                </option>
              ))}
            </select>
            <input
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              placeholder="09:00"
              className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Activity"
              className="min-w-[8rem] flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
            <button onClick={addItem} className="rounded-md bg-pink-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-pink-600">
              Add
            </button>
          </div>

          {byDay.length === 0 ? (
            <p className="text-sm text-gray-400">No itinerary items yet.</p>
          ) : (
            <div className="flex flex-col gap-5">
              {byDay.map(([day, dayItems]) => (
                <div key={day}>
                  <p className="mb-2 text-sm font-semibold text-pink-500">Day {day}</p>
                  <ul className="overflow-hidden rounded-lg border border-gray-200">
                    {dayItems.map((item, i) => (
                      <li
                        key={item.id}
                        className={`group flex items-start gap-3 px-3 py-2 ${i % 2 === 1 ? 'bg-pink-50/60' : 'bg-white'} ${i > 0 ? 'border-t border-gray-100' : ''}`}
                      >
                        {item.time && <span className="w-14 shrink-0 text-xs text-gray-400">{item.time}</span>}
                        <span className="flex-1 text-sm text-gray-700">{item.title}</span>
                        <button onClick={() => deleteItem(item.id)} className="hidden text-xs text-red-400 hover:text-red-600 group-hover:inline">
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Packing list</h3>
          <ul className="mb-3 flex flex-col gap-1">
            {packing.map((item) => (
              <li key={item.id} className="group flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={item.isPacked} onChange={() => togglePacking(item)} className="accent-pink-500" />
                <span className={`flex-1 ${item.isPacked ? 'text-gray-400 line-through' : ''}`}>{item.text}</span>
                <button onClick={() => deletePacking(item.id)} className="hidden text-xs text-red-400 hover:text-red-600 group-hover:inline">
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-1">
            <input
              value={packDraft}
              onChange={(e) => setPackDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPacking()}
              placeholder="Add item..."
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
            <button onClick={addPacking} className="rounded-md bg-pink-100 px-3 text-sm text-pink-600 hover:bg-pink-200">
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
