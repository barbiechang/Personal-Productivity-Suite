import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { api } from '../../lib/api'

interface TripSummaryDto {
  id: string
  name: string
  description: string | null
  coverDataUrl: string | null
  startDate: string | null
  endDate: string | null
  itineraryCount: number
  updatedAt: string
}

interface TripDto {
  id: string
  name: string
}

function CardMenu({ open, onToggle, children }: { open: boolean; onToggle: (open: boolean) => void; children: React.ReactNode }) {
  return (
    <div data-trip-menu className="absolute right-1 top-1 z-20">
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle(!open)
        }}
        className={`rounded-full bg-white/90 px-2 py-0.5 text-sm text-gray-600 shadow-sm hover:bg-white ${open ? '' : 'opacity-0 group-hover:opacity-100'}`}
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-32 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg">{children}</div>
      )}
    </div>
  )
}

function MenuItem({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 ${danger ? 'text-red-500' : 'text-gray-700'}`}
    >
      {children}
    </button>
  )
}

function TripModal({
  initial,
  onClose,
  onSave,
}: {
  initial: TripSummaryDto | null
  onClose: () => void
  onSave: (data: { name: string; coverDataUrl: string | null; startDate: string | null; endDate: string | null }) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [startDate, setStartDate] = useState(initial?.startDate?.slice(0, 10) ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate?.slice(0, 10) ?? '')
  const [cover, setCover] = useState<string | null>(initial?.coverDataUrl ?? null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => setCover(reader.result as string)
    reader.readAsDataURL(file)
  }

  function submit() {
    if (!name.trim()) return
    onSave({ name: name.trim(), coverDataUrl: cover, startDate: startDate || null, endDate: endDate || null })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-center text-sm font-semibold text-gray-700">{initial ? 'Edit trip' : 'New trip'}</h3>

        <div className="mb-4 flex justify-center">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ''
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-pink-400 hover:text-pink-500"
          >
            {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <span className="text-xs">+ Cover</span>}
          </button>
        </div>

        <label className="mb-3 block text-xs text-gray-500">
          Destination
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tokyo"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <div className="mb-5 flex gap-2">
          <label className="flex-1 text-xs text-gray-500">
            Start
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
          </label>
          <label className="flex-1 text-xs text-gray-500">
            End
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className="rounded-md bg-pink-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

const GRID_CLASS = 'grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4'

function dateRangeLabel(start: string | null, end: string | null) {
  if (!start) return null
  const s = format(new Date(start), 'MMM d')
  if (!end) return s
  return `${s} – ${format(new Date(end), 'MMM d, yyyy')}`
}

export default function TripGallery() {
  const navigate = useNavigate()
  const [trips, setTrips] = useState<TripSummaryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [modalTarget, setModalTarget] = useState<TripSummaryDto | 'new' | null>(null)

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    if (!openMenu) return
    function handleClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('[data-trip-menu]')) setOpenMenu(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openMenu])

  async function refresh() {
    setLoading(true)
    const res = await api.get<TripSummaryDto[]>('/trips')
    setTrips(res.data)
    setLoading(false)
  }

  async function saveTrip(data: { name: string; coverDataUrl: string | null; startDate: string | null; endDate: string | null }) {
    if (modalTarget && modalTarget !== 'new') {
      await api.put(`/trips/${modalTarget.id}`, { ...data, description: null })
      setModalTarget(null)
      refresh()
    } else {
      const res = await api.post<TripDto>('/trips', { ...data, description: null })
      setModalTarget(null)
      navigate(`/travel/${res.data.id}`)
    }
  }

  async function deleteTrip(id: string) {
    if (!confirm('Delete this trip and its itinerary? This cannot be undone.')) return
    await api.delete(`/trips/${id}`)
    setTrips((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Travel Planner</h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className={GRID_CLASS}>
          <button
            onClick={() => setModalTarget('new')}
            className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-pink-400 hover:text-pink-500"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="text-sm">New Trip</span>
          </button>

          {trips.map((trip) => (
            <div key={trip.id} className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <button
                onClick={() => navigate(`/travel/${trip.id}`)}
                className="flex h-28 w-full items-center justify-center overflow-hidden bg-gray-50"
              >
                {trip.coverDataUrl ? (
                  <img src={trip.coverDataUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-300">No cover</span>
                )}
              </button>

              <CardMenu open={openMenu === trip.id} onToggle={(o) => setOpenMenu(o ? trip.id : null)}>
                <MenuItem
                  onClick={() => {
                    setOpenMenu(null)
                    setModalTarget(trip)
                  }}
                >
                  Edit
                </MenuItem>
                <MenuItem
                  danger
                  onClick={() => {
                    setOpenMenu(null)
                    deleteTrip(trip.id)
                  }}
                >
                  Delete
                </MenuItem>
              </CardMenu>

              <div className="p-2">
                <p className="truncate text-sm font-medium text-gray-800">{trip.name}</p>
                <p className="truncate text-xs text-gray-400">
                  {dateRangeLabel(trip.startDate, trip.endDate) ?? `${trip.itineraryCount} item${trip.itineraryCount === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalTarget && <TripModal initial={modalTarget === 'new' ? null : modalTarget} onClose={() => setModalTarget(null)} onSave={saveTrip} />}
    </div>
  )
}
