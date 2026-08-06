import { useEffect, useMemo, useRef, useState } from 'react'
import { endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns'
import { api } from '../../lib/api'
import Sidebar from './Sidebar'
import StickerLayer from './StickerLayer'
import ImageCropModal from './ImageCropModal'
import { getHoliday } from './holidays'
import type { CalendarStickerDto, CalendarTextBoxDto } from './types'

interface BannerSettingsDto {
  calendarBannerDataUrl: string | null
  calendarBannerIconDataUrl: string | null
}

type CoverTarget = { type: 'banner' } | { type: 'bannerIcon' }

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date())
  const [highlightDay, setHighlightDay] = useState<Date | null>(null)
  const [banner, setBanner] = useState<BannerSettingsDto>({ calendarBannerDataUrl: null, calendarBannerIconDataUrl: null })
  const [stickers, setStickers] = useState<CalendarStickerDto[]>([])
  const [textBoxes, setTextBoxes] = useState<CalendarTextBoxDto[]>([])
  const [pendingImage, setPendingImage] = useState<{ file: File; x: number; y: number } | null>(null)

  const coverInputRef = useRef<HTMLInputElement>(null)
  const coverTargetRef = useRef<CoverTarget | null>(null)
  const addImageInputRef = useRef<HTMLInputElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const year = month.getFullYear()
  const monthNum = month.getMonth() + 1

  useEffect(() => {
    api.get<BannerSettingsDto>('/dashboard/settings').then((res) => setBanner(res.data))
  }, [])

  useEffect(() => {
    api.get<CalendarStickerDto[]>('/calendar-stickers', { params: { year, month: monthNum, region: 'grid' } }).then((res) => setStickers(res.data))
    api.get<CalendarTextBoxDto[]>('/calendar-text-boxes', { params: { year, month: monthNum } }).then((res) => setTextBoxes(res.data))
  }, [year, monthNum])

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month))
    const end = endOfWeek(endOfMonth(month))
    const list: Date[] = []
    for (let d = start; d <= end; d = new Date(d.getTime() + 86400000)) list.push(d)
    return list
  }, [month])

  function pickCover(target: CoverTarget) {
    coverTargetRef.current = target
    coverInputRef.current?.click()
  }

  function handleCoverFile(file: File) {
    const target = coverTargetRef.current
    if (!target) return
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      if (target.type === 'banner') {
        const res = await api.put<BannerSettingsDto>('/dashboard/settings', { calendarBannerDataUrl: dataUrl })
        setBanner(res.data)
      } else {
        const res = await api.put<BannerSettingsDto>('/dashboard/settings', { calendarBannerIconDataUrl: dataUrl })
        setBanner(res.data)
      }
    }
    reader.readAsDataURL(file)
  }

  function positionFromEvent(clientX: number, clientY: number) {
    const rect = gridRef.current?.getBoundingClientRect()
    if (!rect) return { x: 40, y: 40 }
    return {
      x: Math.min(90, Math.max(0, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.min(90, Math.max(0, ((clientY - rect.top) / rect.height) * 100)),
    }
  }

  function handleGridDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    setPendingImage({ file, ...positionFromEvent(e.clientX, e.clientY) })
  }

  async function handleImageConfirm(dataUrl: string, aspect: number) {
    if (!pendingImage) return
    const rect = gridRef.current?.getBoundingClientRect()
    const basePx = 70
    const widthPx = aspect >= 1 ? basePx : basePx * aspect
    const heightPx = aspect >= 1 ? basePx / aspect : basePx
    const width = rect ? (widthPx / rect.width) * 100 : 12
    const height = rect ? (heightPx / rect.height) * 100 : 12

    const res = await api.post<CalendarStickerDto>('/calendar-stickers', {
      year,
      month: monthNum,
      region: 'grid',
      imageDataUrl: dataUrl,
      x: pendingImage.x,
      y: pendingImage.y,
      width,
      height,
    })
    setStickers((prev) => [...prev, res.data])
    setPendingImage(null)
  }

  async function addTextBox() {
    const res = await api.post<CalendarTextBoxDto>('/calendar-text-boxes', { year, month: monthNum, text: 'New note', x: 40, y: 40 })
    setTextBoxes((prev) => [...prev, res.data])
  }

  async function handleStickerPosition(id: string, x: number, y: number) {
    setStickers((prev) => prev.map((s) => (s.id === id ? { ...s, x, y } : s)))
    await api.put(`/calendar-stickers/${id}`, { x, y })
  }

  async function handleStickerSize(id: string, width: number, height: number) {
    setStickers((prev) => prev.map((s) => (s.id === id ? { ...s, width, height } : s)))
    await api.put(`/calendar-stickers/${id}`, { width, height })
  }

  async function handleStickerDelete(id: string) {
    setStickers((prev) => prev.filter((s) => s.id !== id))
    await api.delete(`/calendar-stickers/${id}`)
  }

  async function handleTextPosition(id: string, x: number, y: number) {
    setTextBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, x, y } : b)))
    await api.put(`/calendar-text-boxes/${id}`, { x, y })
  }

  async function handleTextCommit(id: string, text: string) {
    setTextBoxes((prev) => prev.map((b) => (b.id === id ? { ...b, text } : b)))
    await api.put(`/calendar-text-boxes/${id}`, { text })
  }

  async function handleTextDelete(id: string) {
    setTextBoxes((prev) => prev.filter((b) => b.id !== id))
    await api.delete(`/calendar-text-boxes/${id}`)
  }

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
      <input
        ref={addImageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) setPendingImage({ file, x: 40, y: 40 })
          e.target.value = ''
        }}
      />

      <div className="group/banner relative -mx-6 -mt-6 mb-16 h-28 w-[calc(100%+3rem)] bg-gradient-to-r from-pink-100 to-rose-50">
        {banner.calendarBannerDataUrl && <img src={banner.calendarBannerDataUrl} alt="" className="h-full w-full object-cover" />}
        <button
          onClick={() => pickCover({ type: 'banner' })}
          className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-1 text-[11px] text-gray-600 opacity-0 shadow-sm hover:bg-white group-hover/banner:opacity-100"
        >
          Change banner
        </button>
        <button
          onClick={() => pickCover({ type: 'bannerIcon' })}
          className="group/icon absolute -bottom-12 left-6 z-10 flex h-24 w-24 items-end justify-center"
        >
          {banner.calendarBannerIconDataUrl ? (
            <img src={banner.calendarBannerIconDataUrl} alt="" className="max-h-full max-w-full object-contain drop-shadow-sm" />
          ) : (
            <span className="text-5xl leading-none">🗓️</span>
          )}
          <span className="absolute -bottom-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] text-gray-600 opacity-0 shadow-sm group-hover/icon:opacity-100">
            Change
          </span>
        </button>
      </div>

      <div className="flex">
        <Sidebar month={month} onSelectMonth={setMonth} highlightDay={highlightDay} onHighlightDay={setHighlightDay} />

        <div className="min-w-0 flex-1 pl-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold">{format(month, 'MMMM yyyy')}</h2>
            <div className="flex gap-2">
              <button onClick={() => addImageInputRef.current?.click()} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50">
                + Add image
              </button>
              <button onClick={addTextBox} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50">
                + Add text
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-t-md border border-gray-200 bg-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="bg-gray-50 px-2 py-1 text-center text-xs font-medium text-gray-500">
                {d}
              </div>
            ))}
          </div>

          <div
            ref={gridRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleGridDrop}
            className="relative grid grid-cols-7 gap-px overflow-hidden rounded-b-md border border-t-0 border-gray-200 bg-gray-200"
          >
            {days.map((d) => {
              const holiday = getHoliday(d.getMonth() + 1, d.getDate())
              const inMonth = isSameMonth(d, month)
              return (
                <div
                  key={d.toISOString()}
                  className={`min-h-[100px] p-2 text-sm ${inMonth ? 'text-gray-900' : 'text-gray-300'} ${
                    holiday && inMonth ? 'bg-pink-50/70' : 'bg-white'
                  } ${highlightDay && isSameDay(d, highlightDay) ? 'ring-2 ring-inset ring-pink-300' : ''}`}
                >
                  <span>{format(d, 'd')}</span>
                  {holiday && (
                    <span className={`mt-0.5 block truncate text-[9px] leading-tight ${inMonth ? 'text-gray-500' : 'text-gray-300'}`}>{holiday.name}</span>
                  )}
                </div>
              )
            })}

            <div className="absolute inset-0">
              <StickerLayer
                containerRef={gridRef}
                stickers={stickers}
                textBoxes={textBoxes}
                onStickerPosition={handleStickerPosition}
                onStickerSize={handleStickerSize}
                onStickerDelete={handleStickerDelete}
                onTextPosition={handleTextPosition}
                onTextCommit={handleTextCommit}
                onTextDelete={handleTextDelete}
              />
            </div>
          </div>
        </div>
      </div>

      {pendingImage && <ImageCropModal file={pendingImage.file} onCancel={() => setPendingImage(null)} onConfirm={handleImageConfirm} />}
    </div>
  )
}
