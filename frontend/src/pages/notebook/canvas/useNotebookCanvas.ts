import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { Canvas, Circle, FabricImage, Group, Line, Point, Rect, Textbox } from 'fabric'
import type { FabricObject } from 'fabric'
import { createStrokePath, type StrokePoint } from './pressureStroke'
import { PAGE_SIZE_PX, type NotebookPageDto, type Tool } from '../types'

const MAX_HISTORY = 60
const AUTOSAVE_DEBOUNCE_MS = 900

interface ToolPreset {
  size: number
  opacity: number
  thinning: number
  composite?: GlobalCompositeOperation
}

function presetFor(tool: Tool, width: number): ToolPreset {
  switch (tool) {
    case 'pencil':
      return { size: Math.max(1, width * 0.6), opacity: 0.8, thinning: 0.25 }
    case 'highlighter':
      return { size: width * 3, opacity: 0.35, thinning: 0, composite: 'multiply' }
    case 'eraser':
      return { size: width * 2, opacity: 1, thinning: 0, composite: 'destination-out' }
    default:
      return { size: width, opacity: 1, thinning: 0.55 }
  }
}

const FREEHAND_TOOLS: Tool[] = ['pen', 'pencil', 'highlighter', 'eraser']

interface UseNotebookCanvasOptions {
  tool: Tool
  color: string
  width: number
  onSave: (canvasJson: string, thumbnailDataUrl: string) => void
  onToolFinished?: () => void
}

export function useNotebookCanvas(options: UseNotebookCanvasOptions) {
  const canvasElRef = useRef<HTMLCanvasElement>(null)
  const canvasRef = useRef<Canvas | null>(null)
  const optionsRef = useRef(options)
  optionsRef.current = options

  const historyRef = useRef<{ undo: string[]; redo: string[] }>({ undo: [], redo: [] })
  const restoringRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const readyRef = useRef(false)
  const bgColorRef = useRef('#ffffff')

  function withBackground<T>(fn: (canvas: Canvas) => T): T {
    const canvas = canvasRef.current!
    const prev = canvas.backgroundColor
    canvas.backgroundColor = bgColorRef.current
    const result = fn(canvas)
    canvas.backgroundColor = prev
    return result
  }

  const drawingRef = useRef<{ points: StrokePoint[]; preview: FabricObject | null } | null>(null)
  const previewShapeRef = useRef<FabricObject | null>(null)
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null)
  const panRef = useRef<{ x: number; y: number } | null>(null)

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  function pushHistory(canvas: Canvas) {
    if (restoringRef.current) return
    const json = JSON.stringify(canvas.toJSON())
    historyRef.current.undo.push(json)
    if (historyRef.current.undo.length > MAX_HISTORY) historyRef.current.undo.shift()
    historyRef.current.redo = []
    setCanUndo(historyRef.current.undo.length > 1)
    setCanRedo(false)
    scheduleAutosave(canvas)
  }

  function scheduleAutosave(canvas: Canvas) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const json = JSON.stringify(canvas.toJSON())
      const thumbnail = withBackground((c) => c.toDataURL({ format: 'png', multiplier: 0.25 }))
      optionsRef.current.onSave(json, thumbnail)
    }, AUTOSAVE_DEBOUNCE_MS)
  }

  function getSnapshot() {
    const canvas = canvasRef.current
    if (!canvas) return { canvasJson: '', thumbnailDataUrl: '' }
    return {
      canvasJson: JSON.stringify(canvas.toJSON()),
      thumbnailDataUrl: withBackground((c) => c.toDataURL({ format: 'png', multiplier: 0.25 })),
    }
  }

  function exportCurrentPagePNG(): string {
    const canvas = canvasRef.current
    if (!canvas) return ''
    return withBackground((c) => c.toDataURL({ format: 'png', multiplier: 1 }))
  }

  function setBackgroundColor(color: string) {
    bgColorRef.current = color
  }

  function cancelPendingSave() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
  }

  function undo() {
    const canvas = canvasRef.current
    const history = historyRef.current
    if (!canvas || history.undo.length <= 1) return
    const current = history.undo.pop()!
    history.redo.push(current)
    const prev = history.undo[history.undo.length - 1]
    restoringRef.current = true
    canvas.loadFromJSON(prev).then(() => {
      canvas.renderAll()
      restoringRef.current = false
      setCanUndo(history.undo.length > 1)
      setCanRedo(true)
      scheduleAutosave(canvas)
    })
  }

  function redo() {
    const canvas = canvasRef.current
    const history = historyRef.current
    if (!canvas || history.redo.length === 0) return
    const next = history.redo.pop()!
    history.undo.push(next)
    restoringRef.current = true
    canvas.loadFromJSON(next).then(() => {
      canvas.renderAll()
      restoringRef.current = false
      setCanUndo(true)
      setCanRedo(history.redo.length > 0)
      scheduleAutosave(canvas)
    })
  }

  async function loadPage(page: NotebookPageDto) {
    const canvas = canvasRef.current
    if (!canvas) return
    cancelPendingSave()
    restoringRef.current = true

    const size =
      page.pageSize === 'fullscreen'
        ? {
            width: canvasElRef.current?.parentElement?.clientWidth ?? PAGE_SIZE_PX.fullscreen.width,
            height: canvasElRef.current?.parentElement?.clientHeight ?? PAGE_SIZE_PX.fullscreen.height,
          }
        : PAGE_SIZE_PX[page.pageSize]

    canvas.setDimensions(size)
    canvas.setZoom(1)
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0]

    if (page.canvasJson) {
      await canvas.loadFromJSON(page.canvasJson)
    } else {
      canvas.clear()
    }
    bgColorRef.current = page.backgroundColor || '#ffffff'
    canvas.renderAll()

    historyRef.current = { undo: [JSON.stringify(canvas.toJSON())], redo: [] }
    setCanUndo(false)
    setCanRedo(false)
    restoringRef.current = false
  }

  function replacePreview(ref: MutableRefObject<FabricObject | null>, canvas: Canvas, next: FabricObject | null) {
    if (ref.current) canvas.remove(ref.current)
    ref.current = next
    if (next) canvas.add(next)
    canvas.requestRenderAll()
  }

  function insertImage(file: File) {
    const canvas = canvasRef.current
    if (!canvas) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      FabricImage.fromURL(dataUrl).then((img) => {
        const maxDim = Math.min(canvas.getWidth(), canvas.getHeight()) * 0.6
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
        img.set({
          left: (canvas.getWidth() - img.width * scale) / 2,
          top: (canvas.getHeight() - img.height * scale) / 2,
          scaleX: scale,
          scaleY: scale,
        })
        canvas.add(img)
        canvas.setActiveObject(img)
        pushHistory(canvas)
      })
    }
    reader.readAsDataURL(file)
  }

  function zoomBy(factor: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const center = new Point(canvas.getWidth() / 2, canvas.getHeight() / 2)
    const zoom = Math.min(Math.max(canvas.getZoom() * factor, 0.2), 5)
    canvas.zoomToPoint(center, zoom)
  }

  function zoomReset() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setZoom(1)
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0]
    canvas.requestRenderAll()
  }

  // --- mount: create canvas once, wire all raw pointer/event handling ---
  useEffect(() => {
    if (!canvasElRef.current) return
    const canvas = new Canvas(canvasElRef.current, {
      isDrawingMode: false,
      selection: true,
      width: PAGE_SIZE_PX.a4.width,
      height: PAGE_SIZE_PX.a4.height,
      backgroundColor: undefined,
    })
    canvasRef.current = canvas
    readyRef.current = true

    canvas.on('object:modified', () => pushHistory(canvas))
    canvas.on('text:editing:exited', () => pushHistory(canvas))

    canvas.on('mouse:wheel', (opt) => {
      const e = opt.e as WheelEvent
      if (e.ctrlKey) {
        const zoom = Math.min(Math.max(canvas.getZoom() * 0.999 ** e.deltaY, 0.2), 5)
        canvas.zoomToPoint(new Point(e.offsetX, e.offsetY), zoom)
      } else {
        const vpt = canvas.viewportTransform!
        vpt[4] -= e.deltaX
        vpt[5] -= e.deltaY
        canvas.requestRenderAll()
      }
      e.preventDefault()
      e.stopPropagation()
    })

    const upperEl = canvas.upperCanvasEl

    function scenePoint(e: PointerEvent): StrokePoint {
      const pt = canvas.getScenePoint(e)
      const pressure = e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5
      return { x: pt.x, y: pt.y, pressure }
    }

    function onPointerDown(e: PointerEvent) {
      const tool = optionsRef.current.tool
      const { x, y } = scenePoint(e)

      if (FREEHAND_TOOLS.includes(tool)) {
        upperEl.setPointerCapture(e.pointerId)
        drawingRef.current = { points: [scenePoint(e)], preview: null }
        return
      }

      if (tool === 'pan') {
        upperEl.setPointerCapture(e.pointerId)
        panRef.current = { x: e.clientX, y: e.clientY }
        return
      }

      if (tool === 'text') {
        const textbox = new Textbox('', {
          left: x,
          top: y,
          width: 240,
          fontSize: 22,
          fill: optionsRef.current.color,
        })
        canvas.add(textbox)
        canvas.setActiveObject(textbox)
        textbox.enterEditing()
        textbox.selectAll()
        optionsRef.current.onToolFinished?.()
        return
      }

      if (tool.startsWith('shape-')) {
        upperEl.setPointerCapture(e.pointerId)
        shapeStartRef.current = { x, y }
        return
      }
    }

    function buildShape(tool: Tool, start: { x: number; y: number }, x: number, y: number): FabricObject {
      const common = { selectable: false, evented: false, stroke: optionsRef.current.color, strokeWidth: optionsRef.current.width, fill: 'transparent' }
      if (tool === 'shape-rect') {
        return new Rect({
          ...common,
          left: Math.min(start.x, x),
          top: Math.min(start.y, y),
          width: Math.abs(x - start.x),
          height: Math.abs(y - start.y),
        })
      }
      if (tool === 'shape-circle') {
        const radius = Math.hypot(x - start.x, y - start.y) / 2
        const cx = (start.x + x) / 2
        const cy = (start.y + y) / 2
        return new Circle({ ...common, left: cx - radius, top: cy - radius, radius })
      }
      if (tool === 'shape-arrow') {
        const line = new Line([start.x, start.y, x, y], { ...common, fill: undefined })
        const angle = (Math.atan2(y - start.y, x - start.x) * 180) / Math.PI
        const head = new Rect({
          width: optionsRef.current.width * 4,
          height: optionsRef.current.width * 4,
          fill: optionsRef.current.color,
          left: x,
          top: y,
          originX: 'center',
          originY: 'center',
          angle: angle + 45,
        })
        return new Group([line, head], { selectable: false, evented: false })
      }
      // shape-line
      return new Line([start.x, start.y, x, y], { ...common, fill: undefined })
    }

    function onPointerMove(e: PointerEvent) {
      const tool = optionsRef.current.tool
      const { x, y } = scenePoint(e)

      if (FREEHAND_TOOLS.includes(tool) && drawingRef.current) {
        drawingRef.current.points.push(scenePoint(e))
        const preset = presetFor(tool, optionsRef.current.width)
        const path = createStrokePath(drawingRef.current.points, {
          size: preset.size,
          color: tool === 'eraser' ? '#000000' : optionsRef.current.color,
          opacity: preset.opacity,
          thinning: preset.thinning,
          compositeOperation: preset.composite,
        })
        if (drawingRef.current.preview) canvas.remove(drawingRef.current.preview)
        drawingRef.current.preview = path
        if (path) canvas.add(path)
        canvas.requestRenderAll()
        return
      }

      if (tool === 'pan' && panRef.current) {
        const dx = e.clientX - panRef.current.x
        const dy = e.clientY - panRef.current.y
        panRef.current = { x: e.clientX, y: e.clientY }
        const vpt = canvas.viewportTransform!
        vpt[4] += dx
        vpt[5] += dy
        canvas.requestRenderAll()
        return
      }

      if (tool.startsWith('shape-') && shapeStartRef.current) {
        const shape = buildShape(tool, shapeStartRef.current, x, y)
        replacePreview(previewShapeRef, canvas, shape)
        return
      }
    }

    function onPointerUp(e: PointerEvent) {
      const tool = optionsRef.current.tool

      if (FREEHAND_TOOLS.includes(tool) && drawingRef.current) {
        if (drawingRef.current.preview) {
          drawingRef.current.preview.set({ selectable: tool !== 'eraser', evented: tool !== 'eraser' })
          drawingRef.current.preview.setCoords()
          pushHistory(canvas)
        }
        drawingRef.current = null
        upperEl.releasePointerCapture(e.pointerId)
        return
      }

      if (tool === 'pan') {
        panRef.current = null
        upperEl.releasePointerCapture(e.pointerId)
        return
      }

      if (tool.startsWith('shape-') && shapeStartRef.current) {
        if (previewShapeRef.current) {
          previewShapeRef.current.set({ selectable: true, evented: true })
          previewShapeRef.current.setCoords()
          pushHistory(canvas)
        }
        previewShapeRef.current = null
        shapeStartRef.current = null
        upperEl.releasePointerCapture(e.pointerId)
        optionsRef.current.onToolFinished?.()
        return
      }
    }

    upperEl.addEventListener('pointerdown', onPointerDown)
    upperEl.addEventListener('pointermove', onPointerMove)
    upperEl.addEventListener('pointerup', onPointerUp)

    return () => {
      upperEl.removeEventListener('pointerdown', onPointerDown)
      upperEl.removeEventListener('pointermove', onPointerMove)
      upperEl.removeEventListener('pointerup', onPointerUp)
      canvas.dispose()
      canvasRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // toggle native fabric selection vs. custom-tool drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.selection = options.tool === 'select'
    canvas.skipTargetFind = options.tool !== 'select'
    canvas.defaultCursor = options.tool === 'pan' ? 'grab' : options.tool === 'select' ? 'default' : 'crosshair'
  }, [options.tool])

  return {
    canvasElRef,
    canUndo,
    canRedo,
    undo,
    redo,
    loadPage,
    getSnapshot,
    cancelPendingSave,
    insertImage,
    setBackgroundColor,
    exportCurrentPagePNG,
    zoomIn: () => zoomBy(1.2),
    zoomOut: () => zoomBy(1 / 1.2),
    zoomReset,
  }
}
