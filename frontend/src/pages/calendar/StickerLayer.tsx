import { useRef, useState, type RefObject } from 'react'

export interface StickerLike {
  id: string
  imageDataUrl: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

export interface TextBoxLike {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  color: string
}

function useContainerDrag(
  containerRef: RefObject<HTMLDivElement | null>,
  start: { x: number; y: number },
  onCommit: (x: number, y: number) => void,
) {
  const posRef = useRef(start)
  const [pos, setPos] = useState(start)

  function startDrag(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const startClientX = e.clientX
    const startClientY = e.clientY
    const startX = posRef.current.x
    const startY = posRef.current.y

    function onMove(ev: MouseEvent) {
      const dxPct = ((ev.clientX - startClientX) / rect!.width) * 100
      const dyPct = ((ev.clientY - startClientY) / rect!.height) * 100
      const next = {
        x: Math.min(96, Math.max(0, startX + dxPct)),
        y: Math.min(96, Math.max(0, startY + dyPct)),
      }
      posRef.current = next
      setPos(next)
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      onCommit(posRef.current.x, posRef.current.y)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return { pos, setPos, posRef, startDrag }
}

function Sticker({
  sticker,
  containerRef,
  onCommitPosition,
  onCommitSize,
  onDelete,
}: {
  sticker: StickerLike
  containerRef: RefObject<HTMLDivElement | null>
  onCommitPosition: (id: string, x: number, y: number) => void
  onCommitSize: (id: string, w: number, h: number) => void
  onDelete: (id: string) => void
}) {
  const { pos, startDrag } = useContainerDrag(containerRef, { x: sticker.x, y: sticker.y }, (x, y) => onCommitPosition(sticker.id, x, y))
  const sizeRef = useRef({ w: sticker.width, h: sticker.height })
  const [size, setSize] = useState(sizeRef.current)

  function startResize(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const startClientX = e.clientX
    const startClientY = e.clientY
    const startWpx = (sizeRef.current.w / 100) * rect.width
    const startHpx = (sizeRef.current.h / 100) * rect.height
    const aspect = startWpx / startHpx

    function onMove(ev: MouseEvent) {
      const dxPx = ev.clientX - startClientX
      const dyPx = ev.clientY - startClientY
      const dPx = (dxPx + dyPx) / 2
      const newWpx = Math.max(16, startWpx + dPx)
      const newHpx = newWpx / aspect
      const next = { w: (newWpx / rect!.width) * 100, h: (newHpx / rect!.height) * 100 }
      sizeRef.current = next
      setSize(next)
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      onCommitSize(sticker.id, sizeRef.current.w, sizeRef.current.h)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      className="group/sticker absolute"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${size.w}%`, height: `${size.h}%`, zIndex: sticker.zIndex }}
    >
      <img
        src={sticker.imageDataUrl}
        alt=""
        draggable={false}
        onMouseDown={startDrag}
        className="h-full w-full cursor-move select-none object-contain drop-shadow-sm"
      />
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(sticker.id)
        }}
        className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-white text-[16px] text-gray-400 shadow group-hover/sticker:flex"
      >
        ×
      </button>
      <div onMouseDown={startResize} className="absolute bottom-1 right-0 h-2.5 w-2.5 translate-x-1/4 cursor-nwse-resize rounded-full bg-pink-300 opacity-0 group-hover/sticker:opacity-100" />
    </div>
  )
}

function TextBoxItem({
  box,
  containerRef,
  onCommitPosition,
  onCommitText,
  onDelete,
}: {
  box: TextBoxLike
  containerRef: RefObject<HTMLDivElement | null>
  onCommitPosition: (id: string, x: number, y: number) => void
  onCommitText: (id: string, text: string) => void
  onDelete: (id: string) => void
}) {
  const { pos, startDrag } = useContainerDrag(containerRef, { x: box.x, y: box.y }, (x, y) => onCommitPosition(box.id, x, y))
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(box.text)

  function commit() {
    setEditing(false)
    if (text.trim() === '') {
      onDelete(box.id)
      return
    }
    if (text !== box.text) onCommitText(box.id, text)
  }

  return (
    <div className="group/text absolute" style={{ left: `${pos.x}%`, top: `${pos.y}%`, maxWidth: '45%', zIndex: 50 }}>
      {editing ? (
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          rows={2}
          style={{ fontSize: box.fontSize }}
          className="w-40 resize-none rounded-md border border-pink-200 bg-white/90 px-1.5 py-1 text-center text-gray-700 outline-none"
        />
      ) : (
        <div
          onMouseDown={startDrag}
          onDoubleClick={(e) => {
            e.stopPropagation()
            setEditing(true)
          }}
          style={{ fontSize: box.fontSize }}
          className="max-w-[10rem] cursor-move select-none whitespace-pre-wrap break-words text-center font-normal text-black font-semibold"
        >
          {box.text}
        </div>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(box.id)
        }}
        className="absolute -right-4 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-white text-[14px] text-gray-400 shadow group-hover/text:flex"
      >
        ×
      </button>
    </div>
  )
}

export default function StickerLayer({
  containerRef,
  stickers,
  textBoxes,
  onStickerPosition,
  onStickerSize,
  onStickerDelete,
  onTextPosition,
  onTextCommit,
  onTextDelete,
}: {
  containerRef: RefObject<HTMLDivElement | null>
  stickers: StickerLike[]
  textBoxes: TextBoxLike[]
  onStickerPosition: (id: string, x: number, y: number) => void
  onStickerSize: (id: string, w: number, h: number) => void
  onStickerDelete: (id: string) => void
  onTextPosition: (id: string, x: number, y: number) => void
  onTextCommit: (id: string, text: string) => void
  onTextDelete: (id: string) => void
}) {
  return (
    <>
      {stickers.map((s) => (
        <Sticker key={s.id} sticker={s} containerRef={containerRef} onCommitPosition={onStickerPosition} onCommitSize={onStickerSize} onDelete={onStickerDelete} />
      ))}
      {textBoxes.map((b) => (
        <TextBoxItem key={b.id} box={b} containerRef={containerRef} onCommitPosition={onTextPosition} onCommitText={onTextCommit} onDelete={onTextDelete} />
      ))}
    </>
  )
}
