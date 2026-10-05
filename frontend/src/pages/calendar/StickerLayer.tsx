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

function scrollParentOf(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null
  while (node) {
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node
    node = node.parentElement
  }
  return null
}

function useContainerDrag(
  containerRef: RefObject<HTMLDivElement | null>,
  start: { x: number; y: number },
  onCommit: (x: number, y: number) => void,
  unboundedY = false,
) {
  const posRef = useRef(start)
  const [pos, setPos] = useState(start)

  function startDrag(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    const container = containerRef.current
    const rect = container?.getBoundingClientRect()
    if (!container || !rect) return
    // Offset between the cursor and the item's top-left corner, in px.
    const grabX = e.clientX - (rect.left + (posRef.current.x / 100) * rect.width)
    const grabY = e.clientY - (rect.top + (posRef.current.y / 100) * rect.height)
    let lastX = e.clientX
    let lastY = e.clientY
    let frame = 0

    function update() {
      // Re-measure every time so page scrolling during the drag is accounted for.
      const r = container!.getBoundingClientRect()
      const x = ((lastX - grabX - r.left) / r.width) * 100
      const y = ((lastY - grabY - r.top) / r.height) * 100
      const next = {
        x: Math.min(96, Math.max(0, x)),
        y: unboundedY ? Math.max(0, y) : Math.min(96, Math.max(0, y)),
      }
      posRef.current = next
      setPos(next)
    }

    function autoScroll() {
      const scroller = scrollParentOf(container)
      if (scroller) {
        const bounds = scroller.getBoundingClientRect()
        const edge = 48
        let dy = 0
        if (lastY > bounds.bottom - edge) dy = Math.ceil((lastY - (bounds.bottom - edge)) / 3)
        else if (lastY < bounds.top + edge) dy = -Math.ceil((bounds.top + edge - lastY) / 3)
        if (dy !== 0) {
          scroller.scrollTop += dy
          update()
        }
      }
      frame = requestAnimationFrame(autoScroll)
    }

    function onMove(ev: MouseEvent) {
      lastX = ev.clientX
      lastY = ev.clientY
      update()
    }
    function onUp() {
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      onCommit(posRef.current.x, posRef.current.y)
    }
    if (unboundedY) frame = requestAnimationFrame(autoScroll)
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
  unboundedY,
}: {
  sticker: StickerLike
  containerRef: RefObject<HTMLDivElement | null>
  onCommitPosition: (id: string, x: number, y: number) => void
  onCommitSize: (id: string, w: number, h: number) => void
  onDelete: (id: string) => void
  unboundedY?: boolean
}) {
  const { pos, startDrag } = useContainerDrag(containerRef, { x: sticker.x, y: sticker.y }, (x, y) => onCommitPosition(sticker.id, x, y), unboundedY)
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
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${size.w}%`, zIndex: sticker.zIndex }}
    >
      <img
        src={sticker.imageDataUrl}
        alt=""
        draggable={false}
        onMouseDown={startDrag}
        className="block w-full cursor-move select-none drop-shadow-sm"
        style={{ height: 'auto' }}
      />
      <button
        onClick={(e) => {
          e.stopPropagation()
          onDelete(sticker.id)
        }}
        className="absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-white text-[1rem] text-gray-400 shadow group-hover/sticker:flex"
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
        className="absolute -right-4 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-white text-[0.875rem] text-gray-400 shadow group-hover/text:flex"
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
  unboundedY = false,
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
  /** Let stickers be dragged below the container (the page scrolls to follow). */
  unboundedY?: boolean
}) {
  return (
    <>
      {stickers.map((s) => (
        <Sticker key={s.id} sticker={s} containerRef={containerRef} onCommitPosition={onStickerPosition} onCommitSize={onStickerSize} onDelete={onStickerDelete} unboundedY={unboundedY} />
      ))}
      {textBoxes.map((b) => (
        <TextBoxItem key={b.id} box={b} containerRef={containerRef} onCommitPosition={onTextPosition} onCommitText={onTextCommit} onDelete={onTextDelete} />
      ))}
    </>
  )
}
