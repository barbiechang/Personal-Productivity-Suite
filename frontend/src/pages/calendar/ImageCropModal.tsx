import { useEffect, useRef, useState } from 'react'

const SIZE = 260

type Shape = 'circle' | 'heart' | 'star' | 'square'
type Mode = 'shape' | 'cutout'

function buildShapePath(shape: Shape): Path2D {
  const path = new Path2D()
  const s = SIZE

  if (shape === 'circle') {
    path.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2)
  } else if (shape === 'square') {
    path.roundRect(s * 0.04, s * 0.04, s * 0.92, s * 0.92, s * 0.14)
  } else if (shape === 'star') {
    const cx = s / 2
    const cy = s / 2
    const outerR = s / 2
    const innerR = outerR * 0.42
    const points: [number, number][] = []
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outerR : innerR
      const angle = (Math.PI / 5) * i - Math.PI / 2
      points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)])
    }
    path.moveTo(points[0][0], points[0][1])
    for (let i = 1; i < points.length; i++) path.lineTo(points[i][0], points[i][1])
    path.closePath()
  } else if (shape === 'heart') {
    const w = s
    const h = s
    path.moveTo(w / 2, h * 0.32)
    path.bezierCurveTo(w / 2, h * 0.18, w * 0.32, h * 0.05, w * 0.18, h * 0.05)
    path.bezierCurveTo(w * -0.02, h * 0.05, w * -0.02, h * 0.34, w * -0.02, h * 0.34)
    path.bezierCurveTo(w * -0.02, h * 0.55, w * 0.18, h * 0.75, w / 2, h * 0.95)
    path.bezierCurveTo(w * 0.82, h * 0.75, w * 1.02, h * 0.55, w * 1.02, h * 0.34)
    path.bezierCurveTo(w * 1.02, h * 0.34, w * 1.02, h * 0.05, w * 0.82, h * 0.05)
    path.bezierCurveTo(w * 0.68, h * 0.05, w / 2, h * 0.18, w / 2, h * 0.32)
    path.closePath()
  }

  return path
}

function trimTransparent(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  const { width, height } = canvas
  const data = ctx.getImageData(0, 0, width, height).data
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  let found = false

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 10) {
        found = true
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (!found) return canvas

  const pad = 2
  minX = Math.max(0, minX - pad)
  minY = Math.max(0, minY - pad)
  maxX = Math.min(width - 1, maxX + pad)
  maxY = Math.min(height - 1, maxY + pad)
  const w = maxX - minX + 1
  const h = maxY - minY + 1

  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  const octx = out.getContext('2d')
  if (!octx) return canvas
  octx.drawImage(canvas, minX, minY, w, h, 0, 0, w, h)
  return out
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  ctx.clearRect(0, 0, SIZE, SIZE)
  const scale = Math.max(SIZE / img.naturalWidth, SIZE / img.naturalHeight)
  const dw = img.naturalWidth * scale
  const dh = img.naturalHeight * scale
  const dx = (SIZE - dw) / 2
  const dy = (SIZE - dh) / 2
  ctx.drawImage(img, dx, dy, dw, dh)
}

export default function ImageCropModal({
  file,
  onCancel,
  onConfirm,
}: {
  file: File
  onCancel: () => void
  onConfirm: (dataUrl: string, aspect: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [ready, setReady] = useState(false)
  const [mode, setMode] = useState<Mode>('shape')
  const [shape, setShape] = useState<Shape>('circle')
  const [tolerance, setTolerance] = useState(32)

  useEffect(() => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        imgRef.current = img
        setReady(true)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }, [file])

  useEffect(() => {
    if (!ready) return
    redraw()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, mode, shape])

  function redraw() {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (mode === 'shape') {
      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.save()
      ctx.clip(buildShapePath(shape))
      drawCover(ctx, img)
      ctx.restore()
    } else {
      drawCover(ctx, img)
    }
  }

  function handleCutoutClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (mode !== 'cutout') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * SIZE)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * SIZE)

    const imageData = ctx.getImageData(0, 0, SIZE, SIZE)
    const data = imageData.data
    const idx = (y * SIZE + x) * 4
    const seed: [number, number, number] = [data[idx], data[idx + 1], data[idx + 2]]
    const maxDist = tolerance * 4.41
    const visited = new Uint8Array(SIZE * SIZE)
    const stack: number[] = [y * SIZE + x]

    while (stack.length > 0) {
      const p = stack.pop() as number
      if (visited[p]) continue
      visited[p] = 1
      const px = p % SIZE
      const py = (p - px) / SIZE
      const pi = p * 4
      if (data[pi + 3] === 0) continue
      const dr = data[pi] - seed[0]
      const dg = data[pi + 1] - seed[1]
      const db = data[pi + 2] - seed[2]
      const dist = Math.sqrt(dr * dr + dg * dg + db * db)
      if (dist > maxDist) continue
      data[pi + 3] = 0
      if (px > 0) stack.push(p - 1)
      if (px < SIZE - 1) stack.push(p + 1)
      if (py > 0) stack.push(p - SIZE)
      if (py < SIZE - 1) stack.push(p + SIZE)
    }

    ctx.putImageData(imageData, 0, 0)
  }

  function confirm() {
    const canvas = canvasRef.current
    if (!canvas) return
    const trimmed = trimTransparent(canvas)
    onConfirm(trimmed.toDataURL('image/png'), trimmed.width / trimmed.height)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-center text-sm font-semibold text-gray-700">Crop image</h3>

        <div className="mb-3 flex justify-center gap-2">
          <button
            onClick={() => setMode('shape')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${mode === 'shape' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Shape crop
          </button>
          <button
            onClick={() => setMode('cutout')}
            className={`rounded-full px-3 py-1 text-xs font-medium ${mode === 'cutout' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Cutout
          </button>
        </div>

        {mode === 'shape' && (
          <div className="mb-3 flex justify-center gap-2">
            {(['circle', 'square', 'heart', 'star'] as Shape[]).map((s) => (
              <button
                key={s}
                onClick={() => setShape(s)}
                className={`rounded-md border px-2 py-1 text-[0.6875rem] capitalize ${
                  shape === s ? 'border-pink-400 bg-pink-50 text-pink-600' : 'border-gray-200 text-gray-500'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {mode === 'cutout' && (
          <div className="mb-3">
            <p className="mb-1 text-center text-[0.6875rem] text-gray-500">Click background areas on the image to erase them</p>
            <label className="flex items-center justify-center gap-2 text-[0.6875rem] text-gray-500">
              Tolerance
              <input type="range" min={5} max={100} value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} />
            </label>
            <div className="flex justify-center">
              <button onClick={redraw} className="mt-1 text-[0.6875rem] text-pink-500 hover:underline">
                Reset
              </button>
            </div>
          </div>
        )}

        <div className="mb-4 flex justify-center">
          {ready ? (
            <canvas
              ref={canvasRef}
              width={SIZE}
              height={SIZE}
              onClick={handleCutoutClick}
              className="rounded-lg bg-[conic-gradient(#eee_90deg,#fff_90deg_180deg,#eee_180deg_270deg,#fff_270deg)] bg-[length:16px_16px]"
              style={{ cursor: mode === 'cutout' ? 'crosshair' : 'default' }}
            />
          ) : (
            <div className="flex h-[260px] w-[260px] items-center justify-center text-xs text-gray-400">Loading...</div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={confirm} disabled={!ready} className="rounded-md bg-pink-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-40">
            Use image
          </button>
        </div>
      </div>
    </div>
  )
}
