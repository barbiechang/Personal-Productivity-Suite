import { useEffect, useRef, useState } from 'react'
import { Canvas, PencilBrush, FabricImage } from 'fabric'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc

type Tool = 'pen' | 'eraser'
type PaperStyle = 'blank' | 'lined' | 'grid'

const AUTOSAVE_KEY = 'notebook:autosave'
const MAX_HISTORY = 50

const paperBackgrounds: Record<PaperStyle, string> = {
  blank: '',
  lined:
    'repeating-linear-gradient(to bottom, transparent, transparent 27px, #cbd5e1 28px)',
  grid: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
}

export default function DigitalNotebook() {
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const fabricRef = useRef<Canvas | null>(null)
  const historyRef = useRef<{ undo: string[]; redo: string[] }>({ undo: [], redo: [] })
  const restoringRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#111827')
  const [width, setWidth] = useState(3)
  const [paperStyle, setPaperStyle] = useState<PaperStyle>('blank')
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  useEffect(() => {
    if (!canvasElRef.current) return

    const canvas = new Canvas(canvasElRef.current, {
      isDrawingMode: true,
      width: canvasElRef.current.parentElement?.clientWidth ?? 800,
      height: 700,
    })
    canvas.freeDrawingBrush = new PencilBrush(canvas)
    fabricRef.current = canvas

    const saved = localStorage.getItem(AUTOSAVE_KEY)
    if (saved) {
      restoringRef.current = true
      canvas.loadFromJSON(saved).then(() => {
        canvas.renderAll()
        restoringRef.current = false
        historyRef.current.undo = [saved]
      })
    } else {
      historyRef.current.undo = [JSON.stringify(canvas.toJSON())]
    }

    function pushHistory() {
      if (restoringRef.current) return
      const json = JSON.stringify(canvas.toJSON())
      historyRef.current.undo.push(json)
      if (historyRef.current.undo.length > MAX_HISTORY) historyRef.current.undo.shift()
      historyRef.current.redo = []
      scheduleAutosave(json)
    }

    canvas.on('path:created', pushHistory)
    canvas.on('object:removed', pushHistory)

    return () => {
      canvas.dispose()
      fabricRef.current = null
    }
  }, [])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas) return
    if (tool === 'pen') {
      canvas.isDrawingMode = true
      canvas.freeDrawingBrush = new PencilBrush(canvas)
      canvas.freeDrawingBrush.color = color
      canvas.freeDrawingBrush.width = width
    } else {
      canvas.isDrawingMode = false
    }
  }, [tool, color, width])

  useEffect(() => {
    const canvas = fabricRef.current
    if (!canvas || tool !== 'eraser') return

    function eraseAtPointer(opt: { target?: unknown }) {
      if (!canvas || !opt.target) return
      canvas.remove(opt.target as never)
    }

    canvas.on('mouse:down', eraseAtPointer as never)
    return () => {
      canvas.off('mouse:down', eraseAtPointer as never)
    }
  }, [tool])

  function scheduleAutosave(json: string) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem(AUTOSAVE_KEY, json)
      setSavedAt(new Date())
    }, 800)
  }

  function undo() {
    const canvas = fabricRef.current
    const history = historyRef.current
    if (!canvas || history.undo.length <= 1) return
    const current = history.undo.pop()!
    history.redo.push(current)
    const prev = history.undo[history.undo.length - 1]
    restoringRef.current = true
    canvas.loadFromJSON(prev).then(() => {
      canvas.renderAll()
      restoringRef.current = false
      scheduleAutosave(prev)
    })
  }

  function redo() {
    const canvas = fabricRef.current
    const history = historyRef.current
    if (!canvas || history.redo.length === 0) return
    const next = history.redo.pop()!
    history.undo.push(next)
    restoringRef.current = true
    canvas.loadFromJSON(next).then(() => {
      canvas.renderAll()
      restoringRef.current = false
      scheduleAutosave(next)
    })
  }

  function clearCanvas() {
    const canvas = fabricRef.current
    if (!canvas) return
    canvas.clear()
    canvas.backgroundImage = undefined
    canvas.renderAll()
    const json = JSON.stringify(canvas.toJSON())
    historyRef.current.undo.push(json)
    historyRef.current.redo = []
    scheduleAutosave(json)
  }

  async function importPdfBackground(file: File) {
    const canvas = fabricRef.current
    if (!canvas) return
    const buffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1.5 })

    const offscreen = document.createElement('canvas')
    offscreen.width = viewport.width
    offscreen.height = viewport.height
    const ctx = offscreen.getContext('2d')!
    await page.render({ canvas: offscreen, canvasContext: ctx, viewport }).promise

    const dataUrl = offscreen.toDataURL('image/png')
    const img = await FabricImage.fromURL(dataUrl)
    canvas.setDimensions({ width: viewport.width, height: viewport.height })
    img.set({ selectable: false, evented: false })
    canvas.backgroundImage = img
    canvas.renderAll()
  }

  return (
    <div className="flex h-full flex-col">
      <h2 className="mb-4 text-xl font-semibold">Digital Notebook</h2>

      <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-gray-200 bg-white p-3">
        <div className="flex overflow-hidden rounded-md border border-gray-300">
          <button
            onClick={() => setTool('pen')}
            className={`px-3 py-1.5 text-sm ${tool === 'pen' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
          >
            Pen
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`px-3 py-1.5 text-sm ${tool === 'eraser' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'}`}
          >
            Eraser
          </button>
        </div>

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border border-gray-300"
        />

        <input
          type="range"
          min={1}
          max={20}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
        />

        <select
          value={paperStyle}
          onChange={(e) => setPaperStyle(e.target.value as PaperStyle)}
          className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
        >
          <option value="blank">Blank</option>
          <option value="lined">Lined</option>
          <option value="grid">Grid</option>
        </select>

        <button onClick={undo} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
          Undo
        </button>
        <button onClick={redo} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
          Redo
        </button>
        <button onClick={clearCanvas} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
          Clear
        </button>

        <label className="cursor-pointer rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50">
          Import PDF
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) importPdfBackground(file)
              e.target.value = ''
            }}
          />
        </label>

        <span className="ml-auto text-xs text-gray-400">
          {savedAt ? `Saved ${savedAt.toLocaleTimeString()}` : 'Not saved yet'}
        </span>
      </div>

      <div
        className="flex-1 overflow-auto rounded-md border border-gray-200 bg-white"
        style={{
          backgroundImage: paperBackgrounds[paperStyle],
          backgroundSize: paperStyle === 'grid' ? '24px 24px' : undefined,
        }}
      >
        <canvas ref={canvasElRef} />
      </div>
    </div>
  )
}
