import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

interface DashboardImageDto {
  id: string
  dataUrl: string
  order: number
}

interface DashboardSettingsDto {
  id: string
  petGifDataUrl: string | null
  familyCoverDataUrl: string | null
}

interface FamilyMemberDto {
  id: string
  name: string
  role: string | null
  birthday: string
  emoji: string
  photoDataUrl: string | null
}

const FAMILY_EMOJIS = ['👨', '👩', '👦', '👧', '👶', '🐱', '🐶']

function formatBirthday(birthday: string) {
  const [y, m, d] = birthday.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function daysUntilBirthday(birthday: string) {
  const [, m, d] = birthday.split('-').map(Number)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let next = new Date(today.getFullYear(), m - 1, d)
  if (next < today) next = new Date(today.getFullYear() + 1, m - 1, d)
  return Math.round((next.getTime() - today.getTime()) / 86400000)
}

const CUPCAKE_PIXELS = [
  ['', '', '', 'w', 'c', '', ''],
  ['', '', 'w', 'w', 'r', 'c', ''],
  ['', 'w', 'c', 'w', 'w', 'b', ''],
  ['', 'w', 'w', 'c', 'w', 'c', ''],
  ['w', 'c', 'c', 'w', 'c', 'c', 'w'],
  ['t', 't', 't', 't', 't', 't', 't'],
  ['u', 'u', 't', 't', 't', 'u', 'u'],
]

const CUPCAKE_COLORS: Record<string, string> = {
  w: '#fdfbf6',
  c: '#e8e3ce',
  r: '#f2a0a0',
  b: '#8fcbe8',
  t: '#f3cf7a',
  u: '#e0ac54',
}

function PixelCupcake() {
  return (
    <div className="grid shrink-0 grid-cols-7 grid-rows-7 gap-0" style={{ width: '3.2rem', height: '3.2rem' }}>
      {CUPCAKE_PIXELS.flatMap((row, ri) =>
        row.map((cell, ci) => (
          <div key={`${ri}-${ci}`} style={{ backgroundColor: cell ? CUPCAKE_COLORS[cell] : 'transparent' }} />
        )),
      )}
    </div>
  )
}

function ClockCard() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hh = now.getHours().toString().padStart(2, '0')
  const mm = now.getMinutes().toString().padStart(2, '0')
  const buddhistYear = now.getFullYear() + 543
  const dateStr = `${buddhistYear}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getDate().toString().padStart(2, '0')}`
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()

  return (
    <div className="flex aspect-[2/1] w-full shrink-0 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
      <PixelCupcake />
      <div className="flex flex-col items-center gap-1">
        <p className="font-pixel whitespace-nowrap text-3xl text-gray-900 sm:text-4xl">
          {hh}
          <span className="mx-0.5">:</span>
          {mm}
        </p>
        <div className="flex items-center gap-2">
          <span className="font-pixel truncate text-[0.4375rem] text-pink-300">{dateStr}</span>
          <span className="font-pixel truncate text-[0.4375rem] text-pink-300">{weekday}</span>
        </div>
      </div>
    </div>
  )
}

function MusicCard() {
  const [showNote, setShowNote] = useState(false)

  return (
    <div className="flex aspect-[2/1] w-full shrink-0 flex-col justify-center rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-lg">🎵</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-gray-800">Not connected</p>
          <p className="truncate text-[0.625rem] text-gray-400">Connect Spotify to see your playlist</p>
        </div>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[0.625rem] text-gray-400">▶</span>
      </div>

      <button
        onClick={() => setShowNote(true)}
        className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-green-500 px-2.5 py-1 text-[0.625rem] font-medium text-white hover:bg-green-600"
      >
        Save on Spotify
      </button>

      {showNote && <p className="mt-1 truncate text-[0.5625rem] text-gray-400">Coming soon — needs a Spotify Developer App client ID first.</p>}
    </div>
  )
}

function FamilyMemberModal({
  initial,
  onClose,
  onSave,
}: {
  initial: FamilyMemberDto | null
  onClose: () => void
  onSave: (data: { name: string; role: string | null; birthday: string; photoDataUrl: string | null }) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [role, setRole] = useState(initial?.role ?? '')
  const [birthday, setBirthday] = useState(initial?.birthday ?? '')
  const [photo, setPhoto] = useState<string | null>(initial?.photoDataUrl ?? null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => setPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  function submit() {
    if (!name.trim() || !birthday) return
    onSave({ name: name.trim(), role: role.trim() || null, birthday, photoDataUrl: photo })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-center text-sm font-semibold text-gray-700">
          {initial ? 'Edit family member' : 'Add family member'}
        </h3>

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
            {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : <span className="text-xs">+ Photo</span>}
          </button>
        </div>

        <label className="mb-3 block text-xs text-gray-500">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mom"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="mb-3 block text-xs text-gray-500">
          Role (optional)
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g. Mom"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <label className="mb-5 block text-xs text-gray-500">
          Birthday
          <input
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim() || !birthday}
            className="rounded-md bg-pink-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

function FamilyCard() {
  const [members, setMembers] = useState<FamilyMemberDto[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [modalTarget, setModalTarget] = useState<FamilyMemberDto | 'new' | null>(null)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [cover, setCover] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const coverFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    refresh()
    api.get<DashboardSettingsDto>('/dashboard/settings').then((res) => setCover(res.data.familyCoverDataUrl))
  }, [])

  function handleCoverFile(file: File) {
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      await api.put('/dashboard/settings', { familyCoverDataUrl: dataUrl })
      setCover(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  function updateScrollState() {
    const el = listRef.current
    if (!el) return
    setCanScrollUp(el.scrollTop > 4)
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 4)
  }

  useEffect(() => {
    updateScrollState()
  }, [members])

  function scrollBy(amount: number) {
    const el = listRef.current
    if (!el) return
    el.scrollTop += amount
    updateScrollState()
  }

  useEffect(() => {
    if (!openMenu) return
    function handleClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('[data-family-menu]')) setOpenMenu(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openMenu])

  async function refresh() {
    setLoading(true)
    const res = await api.get<FamilyMemberDto[]>('/family')
    setMembers(res.data)
    setLoading(false)
  }

  async function saveMember(data: { name: string; role: string | null; birthday: string; photoDataUrl: string | null }) {
    if (modalTarget && modalTarget !== 'new') {
      await api.put(`/family/${modalTarget.id}`, {
        name: data.name,
        role: data.role,
        birthday: data.birthday,
        emoji: modalTarget.emoji,
        photoDataUrl: data.photoDataUrl,
      })
    } else {
      const emoji = FAMILY_EMOJIS[members.length % FAMILY_EMOJIS.length]
      await api.post('/family', { name: data.name, role: data.role, birthday: data.birthday, emoji, photoDataUrl: data.photoDataUrl })
    }
    setModalTarget(null)
    refresh()
  }

  async function deleteMember(id: string) {
    if (!confirm('Remove this family member?')) return
    await api.delete(`/family/${id}`)
    setMembers((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="group/cover relative h-40 w-full shrink-0 bg-gradient-to-br from-pink-100 to-pink-50">
        <input
          ref={coverFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleCoverFile(file)
            e.target.value = ''
          }}
        />
        {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
        <button
          onClick={() => coverFileRef.current?.click()}
          className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-1 text-[0.6875rem] text-gray-600 opacity-0 shadow-sm hover:bg-white group-hover/cover:opacity-100"
        >
          Change cover
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="mb-3 flex shrink-0 items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Family 🤍˚ʚ🧸ɞ˚☁️</h3>
          <button
            onClick={() => setModalTarget('new')}
            title="Add family member"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-400 text-white shadow-sm hover:bg-pink-500"
          >
            <span className="text-base leading-none">+</span>
          </button>
        </div>

      {loading ? (
        <p className="text-xs text-gray-400">Loading...</p>
      ) : members.length === 0 ? (
        <p className="text-xs text-gray-400">No family members yet.</p>
      ) : (
        <div ref={listRef} onScroll={updateScrollState} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {members.map((m) => {
            const days = daysUntilBirthday(m.birthday)
            return (
              <div key={m.id} className="group relative flex items-center gap-2 rounded-xl border border-gray-100 p-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-pink-50 text-lg">
                  {m.photoDataUrl ? <img src={m.photoDataUrl} alt="" className="h-full w-full object-cover" /> : m.emoji}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-800">{m.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1">
                    {m.role && <span className="rounded-full bg-pink-50 px-1.5 py-0.5 text-[0.5625rem] font-medium text-pink-600">{m.role}</span>}
                    <span className="text-[0.625rem] text-gray-400">{formatBirthday(m.birthday)}</span>
                  </div>
                  <span
                    className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[0.5625rem] font-medium ${
                      days === 0 ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {days === 0 ? '🎉 Today' : `in ${days}d`}
                  </span>
                </div>

                <div data-family-menu className="absolute right-1 top-1">
                  <button
                    onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)}
                    className="rounded px-1 text-xs text-gray-400 opacity-0 hover:bg-gray-100 group-hover:opacity-100"
                  >
                    ⋯
                  </button>
                  {openMenu === m.id && (
                    <div className="absolute right-0 top-full z-20 mt-1 w-28 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                      <button
                        onClick={() => {
                          setOpenMenu(null)
                          setModalTarget(m)
                        }}
                        className="block w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setOpenMenu(null)
                          deleteMember(m.id)
                        }}
                        className="block w-full px-3 py-1.5 text-left text-xs text-red-500 hover:bg-gray-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {canScrollUp && (
        <button
          onClick={() => scrollBy(-160)}
          className="absolute left-1/2 top-[8.25rem] flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-xs text-gray-500 shadow-sm hover:bg-gray-50"
        >
          ▲
        </button>
      )}
      {canScrollDown && (
        <button
          onClick={() => scrollBy(160)}
          className="absolute bottom-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-xs text-gray-500 shadow-sm hover:bg-gray-50"
        >
          ▼
        </button>
      )}

      {modalTarget && (
        <FamilyMemberModal initial={modalTarget === 'new' ? null : modalTarget} onClose={() => setModalTarget(null)} onSave={saveMember} />
      )}
      </div>
    </div>
  )
}

function PhotoManagerModal({
  images,
  onClose,
  onUpload,
  onDelete,
}: {
  images: DashboardImageDto[]
  onClose: () => void
  onUpload: (files: FileList) => void
  onDelete: (id: string) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Upload photos</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            const files = e.target.files
            if (files && files.length) onUpload(files)
            e.target.value = ''
          }}
        />

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            if (e.dataTransfer.files.length) onUpload(e.dataTransfer.files)
          }}
          onClick={() => fileRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver ? 'border-pink-400 bg-pink-50' : 'border-gray-300 bg-gray-50'
          }`}
        >
          <span className="mb-1 text-2xl">☁️</span>
          <p className="text-sm font-medium text-gray-700">Drag & drop to upload</p>
          <p className="text-xs text-pink-500">or browse</p>
        </div>

        {images.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {images.map((img) => (
              <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                <img src={img.dataUrl} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => onDelete(img.id)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-300 text-[0.625rem] text-white opacity-0 shadow-sm group-hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SlideshowCard() {
  const [images, setImages] = useState<DashboardImageDto[]>([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [managerOpen, setManagerOpen] = useState(false)

  useEffect(() => {
    refresh()
  }, [])

  useEffect(() => {
    if (images.length < 2) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % images.length), 4000)
    return () => clearInterval(timer)
  }, [images.length])

  async function refresh() {
    setLoading(true)
    const res = await api.get<DashboardImageDto[]>('/dashboard/images')
    setImages(res.data)
    setIndex((i) => Math.min(i, Math.max(res.data.length - 1, 0)))
    setLoading(false)
  }

  function handleUpload(files: FileList) {
    Promise.all(
      Array.from(files).map(
        (file) =>
          new Promise<void>((resolve) => {
            const reader = new FileReader()
            reader.onload = async () => {
              await api.post('/dashboard/images', { dataUrl: reader.result })
              resolve()
            }
            reader.readAsDataURL(file)
          }),
      ),
    ).then(() => refresh())
  }

  async function handleDelete(id: string) {
    await api.delete(`/dashboard/images/${id}`)
    refresh()
  }

  return (
    <div className="group relative h-full w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">
      {loading ? null : images.length === 0 ? (
        <button
          onClick={() => setManagerOpen(true)}
          className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400 hover:text-pink-500"
        >
          <span className="text-2xl">+</span>
          <span className="text-sm">Add photos</span>
        </button>
      ) : (
        <>
          {images.map((img, i) => (
            <img
              key={img.id}
              src={img.dataUrl}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          <button
            onClick={() => setManagerOpen(true)}
            className="absolute right-2 top-2 rounded-full bg-white/80 px-2 py-1 text-xs text-gray-600 opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
          >
            ⋯
          </button>
        </>
      )}

      {managerOpen && (
        <PhotoManagerModal images={images} onClose={() => setManagerOpen(false)} onUpload={handleUpload} onDelete={handleDelete} />
      )}
    </div>
  )
}

const PET_POSITION_KEY = 'dashboard:petPosition'

function PetWidget() {
  const [petGif, setPetGif] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(() => {
    const saved = localStorage.getItem(PET_POSITION_KEY)
    return saved ? JSON.parse(saved) : null
  })
  const fileRef = useRef<HTMLInputElement>(null)
  const spriteRef = useRef<HTMLImageElement>(null)
  const draggingRef = useRef(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    api
      .get<DashboardSettingsDto>('/dashboard/settings')
      .then((res) => setPetGif(res.data.petGifDataUrl))
      .finally(() => setLoading(false))
  }, [])

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      await api.put('/dashboard/settings', { petGifDataUrl: dataUrl })
      setPetGif(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  function onPointerDown(e: React.PointerEvent<HTMLImageElement>) {
    const rect = spriteRef.current!.getBoundingClientRect()
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    if (!pos) setPos({ x: rect.left, y: rect.top })
    draggingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent<HTMLImageElement>) {
    if (!draggingRef.current) return
    setPos({ x: e.clientX - dragOffsetRef.current.x, y: e.clientY - dragOffsetRef.current.y })
  }

  function onPointerUp() {
    if (!draggingRef.current) return
    draggingRef.current = false
    setPos((p) => {
      if (p) localStorage.setItem(PET_POSITION_KEY, JSON.stringify(p))
      return p
    })
  }

  return (
    <>
      {!loading && petGif && (
        <img
          ref={spriteRef}
          src={petGif}
          alt="pet"
          draggable={false}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className={`pet-hover-zone fixed z-40 h-20 w-20 cursor-grab select-none object-contain ${pos ? '' : 'pet-roam'}`}
          style={pos ? { left: pos.x, top: pos.y } : undefined}
        />
      )}

      <div className="fixed bottom-6 right-6 z-40">
        <input
          ref={fileRef}
          type="file"
          accept="image/gif,image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
        <div className="flex flex-col items-center gap-2">
          <button
            title={petGif ? 'Change pet GIF' : 'Upload a pet GIF'}
            onClick={() => fileRef.current?.click()}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-pink-400 text-white shadow-sm hover:bg-pink-500"
          >
            <span className="text-sm leading-none">+</span>
          </button>
          <button
            title={petGif ? 'Change pet GIF' : 'Upload a pet GIF'}
            onClick={() => fileRef.current?.click()}
            className="flex h-16 w-16 flex-col items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gray-300 bg-white/90 text-gray-400 shadow-sm hover:border-pink-400 hover:text-pink-500"
          >
            {loading ? null : petGif ? (
              <img src={petGif} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[0.5625rem] leading-tight">Pet GIF</span>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pet-roam {
          0% { left: 5vw; bottom: 24px; transform: scaleX(1); }
          48% { left: 78vw; bottom: 24px; transform: scaleX(1); }
          50% { left: 78vw; bottom: 24px; transform: scaleX(-1); }
          98% { left: 5vw; bottom: 24px; transform: scaleX(-1); }
          100% { left: 5vw; bottom: 24px; transform: scaleX(1); }
        }
        .pet-roam { animation: pet-roam 40s ease-in-out infinite; }
        .pet-hover-zone {
          cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24'%3E%3Cpath fill='%23f472b6' d='M12 21s-6.5-4.35-9.5-8.5C.5 9.5 1.5 5.5 5 4.5c2-.6 3.8.2 5 2 .2.3.5.3.7 0 1.2-1.8 3-2.6 5-2 3.5 1 4.5 5 2.5 8-3 4.15-9.5 8.5-9.5 8.5z'/%3E%3C/svg%3E") 14 14, grab;
        }
      `}</style>
    </>
  )
}

export default function Dashboard() {
  const referenceRef = useRef<HTMLDivElement>(null)
  const [referenceHeight, setReferenceHeight] = useState<number | null>(null)

  useEffect(() => {
    const el = referenceRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      setReferenceHeight(entries[0].contentRect.height)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">𐔌 Buddy Home ˚.🎀༘⋆</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div ref={referenceRef} className="flex flex-col gap-4 self-start sm:col-span-1">
          <ClockCard />
          <MusicCard />
        </div>
        <div className="min-h-0 sm:col-span-1" style={referenceHeight ? { height: referenceHeight } : undefined}>
          <SlideshowCard />
        </div>
        <div className="min-h-0 sm:col-span-2" style={referenceHeight ? { height: referenceHeight } : undefined}>
          <FamilyCard />
        </div>
      </div>
      <PetWidget />
    </div>
  )
}
