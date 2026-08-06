import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerSrc from 'pdfjs-dist/build/pdf.worker.mjs?url'
import { StaticCanvas, FabricImage } from 'fabric'
import { api } from '../../lib/api'
import { useNotebookCanvas } from './canvas/useNotebookCanvas'
import Toolbar from './components/Toolbar'
import PageSidebar from './components/PageSidebar'
import { downloadPNG, downloadSinglePagePDF, downloadNotebookPDF } from './export'
import { PAGE_SIZE_PX } from './types'
import type { NotebookDto, NotebookPageDto, PaperStyle, Tool } from './types'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc

const paperBackgrounds: Record<PaperStyle, string> = {
  blank: '',
  lined: 'repeating-linear-gradient(to bottom, transparent, transparent 27px, #cbd5e1 28px)',
  grid: 'linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)',
  dotGrid: 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
}
const paperBackgroundSize: Partial<Record<PaperStyle, string>> = {
  grid: '24px 24px',
  dotGrid: '20px 20px',
}

function sortByOrder(pages: NotebookPageDto[]) {
  return [...pages].sort((a, b) => a.order - b.order)
}

export default function NotebookEditor() {
  const { notebookId } = useParams<{ notebookId: string }>()
  const navigate = useNavigate()

  const [notebook, setNotebook] = useState<NotebookDto | null>(null)
  const [pages, setPages] = useState<NotebookPageDto[]>([])
  const [activePageId, setActivePageId] = useState<string | null>(null)
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#111827')
  const [width, setWidth] = useState(3)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [titleDraft, setTitleDraft] = useState('')

  const pagesRef = useRef<NotebookPageDto[]>([])
  const activePageRef = useRef<NotebookPageDto | null>(null)

  const canvasApi = useNotebookCanvas({
    tool,
    color,
    width,
    onSave: (canvasJson, thumbnailDataUrl) => {
      const page = activePageRef.current
      if (!page) return
      persistPage(page.id, { ...page, canvasJson, thumbnailDataUrl })
      setSavedAt(new Date())
    },
    onToolFinished: () => setTool('select'),
  })

  useEffect(() => {
    if (!notebookId) return
    api.get<NotebookDto>(`/notebooks/${notebookId}`).then((res) => {
      setNotebook(res.data)
      setPages(res.data.pages)
      setTitleDraft(res.data.title)
      const first = sortByOrder(res.data.pages)[0]
      if (first) setActivePageId(first.id)
      setLoading(false)
    })
  }, [notebookId])

  useEffect(() => {
    pagesRef.current = pages
  }, [pages])

  useEffect(() => {
    if (!activePageId) return
    const page = pagesRef.current.find((p) => p.id === activePageId)
    if (!page) return
    activePageRef.current = page
    canvasApi.loadPage(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePageId])

  async function persistPage(pageId: string, updated: NotebookPageDto) {
    if (!notebookId) return
    setPages((prev) => prev.map((p) => (p.id === pageId ? updated : p)))
    if (activePageRef.current?.id === pageId) activePageRef.current = updated
    try {
      const res = await api.put<NotebookPageDto>(`/notebooks/${notebookId}/pages/${pageId}`, {
        order: updated.order,
        paperStyle: updated.paperStyle,
        pageSize: updated.pageSize,
        backgroundColor: updated.backgroundColor,
        canvasJson: updated.canvasJson,
        thumbnailDataUrl: updated.thumbnailDataUrl,
      })
      setPages((prev) => prev.map((p) => (p.id === pageId ? res.data : p)))
      if (activePageRef.current?.id === pageId) activePageRef.current = res.data
      if (res.data.order === 0) {
        setNotebook((n) => (n ? { ...n, coverDataUrl: res.data.thumbnailDataUrl ?? n.coverDataUrl } : n))
      }
    } catch {
      // best-effort autosave; a transient failure just gets retried on the next edit
    }
  }

  function flushActivePage(): NotebookPageDto | null {
    const page = activePageRef.current
    if (!page) return null
    canvasApi.cancelPendingSave()
    const snap = canvasApi.getSnapshot()
    if (!snap.canvasJson) return page
    const updated = { ...page, canvasJson: snap.canvasJson, thumbnailDataUrl: snap.thumbnailDataUrl }
    persistPage(page.id, updated)
    return updated
  }

  function handleSelectPage(id: string) {
    if (id === activePageId) return
    flushActivePage()
    setActivePageId(id)
  }

  async function handleAddPage() {
    if (!notebookId || loading) return
    const template = flushActivePage() ?? activePageRef.current
    const newOrder = pages.length ? Math.max(...pages.map((p) => p.order)) + 1 : 0
    const res = await api.post<NotebookPageDto>(`/notebooks/${notebookId}/pages`, {
      order: newOrder,
      paperStyle: template?.paperStyle ?? 'blank',
      pageSize: template?.pageSize ?? 'a4',
      backgroundColor: template?.backgroundColor ?? '#ffffff',
      canvasJson: '',
    })
    setPages((prev) => [...prev, res.data])
    setActivePageId(res.data.id)
  }

  async function handleDuplicatePage(id: string) {
    if (!notebookId) return
    const isActive = id === activePageId
    const source = isActive ? flushActivePage() : pages.find((p) => p.id === id)
    if (!source) return
    const newOrder = Math.max(...pages.map((p) => p.order)) + 1
    const res = await api.post<NotebookPageDto>(`/notebooks/${notebookId}/pages`, {
      order: newOrder,
      paperStyle: source.paperStyle,
      pageSize: source.pageSize,
      backgroundColor: source.backgroundColor,
      canvasJson: source.canvasJson,
      thumbnailDataUrl: source.thumbnailDataUrl,
    })
    setPages((prev) => [...prev, res.data])
  }

  async function handleDeletePage(id: string) {
    if (!notebookId || pages.length <= 1) return
    if (!confirm('Delete this page? This cannot be undone.')) return
    await api.delete(`/notebooks/${notebookId}/pages/${id}`)
    const remaining = pages.filter((p) => p.id !== id)
    setPages(remaining)
    if (id === activePageId) {
      const next = sortByOrder(remaining)[0]
      setActivePageId(next?.id ?? null)
    }
  }

  async function handleMovePage(id: string, direction: 'up' | 'down') {
    if (!notebookId) return
    const ordered = sortByOrder(pages)
    const idx = ordered.findIndex((p) => p.id === id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= ordered.length) return
    const a = ordered[idx]
    const b = ordered[swapIdx]
    setPages((prev) => prev.map((p) => (p.id === a.id ? { ...p, order: b.order } : p.id === b.id ? { ...p, order: a.order } : p)))
    await Promise.all([
      api.put(`/notebooks/${notebookId}/pages/${a.id}`, { ...a, order: b.order }),
      api.put(`/notebooks/${notebookId}/pages/${b.id}`, { ...b, order: a.order }),
    ])
  }

  function updateActivePageMeta(patch: Partial<Pick<NotebookPageDto, 'paperStyle' | 'pageSize' | 'backgroundColor'>>) {
    const page = activePageRef.current
    if (!page) return
    canvasApi.cancelPendingSave()
    const snap = canvasApi.getSnapshot()
    const updated: NotebookPageDto = {
      ...page,
      ...patch,
      canvasJson: snap.canvasJson || page.canvasJson,
      thumbnailDataUrl: snap.thumbnailDataUrl || page.thumbnailDataUrl,
    }
    activePageRef.current = updated
    setPages((prev) => prev.map((p) => (p.id === page.id ? updated : p)))
    if (patch.backgroundColor) canvasApi.setBackgroundColor(patch.backgroundColor)
    if (patch.pageSize) {
      canvasApi.loadPage(updated)
    }
    persistPage(page.id, updated)
    setSavedAt(new Date())
  }

  async function handleImportPdf(file: File) {
    if (!notebookId) return
    const buffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
    let nextOrder = pages.length ? Math.max(...pages.map((p) => p.order)) + 1 : 0
    const target = PAGE_SIZE_PX.a4
    const created: NotebookPageDto[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const pdfPage = await pdf.getPage(i)
      const viewport = pdfPage.getViewport({ scale: 1.5 })
      const offscreen = document.createElement('canvas')
      offscreen.width = viewport.width
      offscreen.height = viewport.height
      const ctx = offscreen.getContext('2d')!
      await pdfPage.render({ canvas: offscreen, canvasContext: ctx, viewport }).promise
      const dataUrl = offscreen.toDataURL('image/png')

      const staticCanvas = new StaticCanvas(document.createElement('canvas'), { width: target.width, height: target.height })
      const img = await FabricImage.fromURL(dataUrl)
      const scale = Math.min(target.width / img.width, target.height / img.height)
      img.set({
        selectable: false,
        evented: false,
        left: (target.width - img.width * scale) / 2,
        top: (target.height - img.height * scale) / 2,
        scaleX: scale,
        scaleY: scale,
      })
      staticCanvas.add(img)
      const canvasJson = JSON.stringify(staticCanvas.toJSON())
      const thumbnailDataUrl = staticCanvas.toDataURL({ format: 'png', multiplier: 0.25 })
      staticCanvas.dispose()

      const res = await api.post<NotebookPageDto>(`/notebooks/${notebookId}/pages`, {
        order: nextOrder++,
        paperStyle: 'blank',
        pageSize: 'a4',
        backgroundColor: '#ffffff',
        canvasJson,
        thumbnailDataUrl,
      })
      created.push(res.data)
    }

    setPages((prev) => [...prev, ...created])
    if (created[0]) setActivePageId(created[0].id)
  }

  function handleExportPNG() {
    const page = activePageRef.current
    if (!page) return
    downloadPNG(canvasApi.exportCurrentPagePNG(), `${notebook?.title ?? 'page'}-${(page.order + 1).toString().padStart(2, '0')}.png`)
  }

  function handleExportPagePDF() {
    const page = activePageRef.current
    if (!page) return
    const size = page.pageSize === 'fullscreen' ? PAGE_SIZE_PX.fullscreen : PAGE_SIZE_PX[page.pageSize]
    downloadSinglePagePDF(
      canvasApi.exportCurrentPagePNG(),
      size.width,
      size.height,
      `${notebook?.title ?? 'page'}-${(page.order + 1).toString().padStart(2, '0')}.pdf`,
    )
  }

  async function handleExportNotebookPDF() {
    flushActivePage()
    if (!notebook) return
    await downloadNotebookPDF(pagesRef.current, `${notebook.title}.pdf`)
  }

  async function commitTitle() {
    if (!notebookId || !notebook) return
    if (titleDraft.trim() === notebook.title) return
    const res = await api.put<NotebookDto>(`/notebooks/${notebookId}`, {
      title: titleDraft.trim() || notebook.title,
      coverDataUrl: null,
      folderId: notebook.folderId,
    })
    setNotebook((n) => (n ? { ...n, title: res.data.title } : n))
  }

  const activePage = pages.find((p) => p.id === activePageId) ?? null

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center gap-3">
        <button onClick={() => navigate('/notebook')} className="text-sm text-gray-500 hover:text-gray-700">
          ← Notebooks
        </button>
        {loading ? (
          <span className="text-sm text-gray-500">Loading notebook...</span>
        ) : (
          <input
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            className="text-xl font-semibold outline-none focus:border-b focus:border-pink-400"
          />
        )}
      </div>

      <Toolbar
        tool={tool}
        onToolChange={setTool}
        color={color}
        onColorChange={setColor}
        width={width}
        onWidthChange={setWidth}
        paperStyle={activePage?.paperStyle ?? 'blank'}
        onPaperStyleChange={(paperStyle) => updateActivePageMeta({ paperStyle })}
        pageSize={activePage?.pageSize ?? 'a4'}
        onPageSizeChange={(pageSize) => updateActivePageMeta({ pageSize })}
        backgroundColor={activePage?.backgroundColor ?? '#ffffff'}
        onBackgroundColorChange={(backgroundColor) => updateActivePageMeta({ backgroundColor })}
        canUndo={canvasApi.canUndo}
        canRedo={canvasApi.canRedo}
        onUndo={canvasApi.undo}
        onRedo={canvasApi.redo}
        onInsertImage={canvasApi.insertImage}
        onImportPdf={handleImportPdf}
        onExportPNG={handleExportPNG}
        onExportPagePDF={handleExportPagePDF}
        onExportNotebookPDF={handleExportNotebookPDF}
        onZoomIn={canvasApi.zoomIn}
        onZoomOut={canvasApi.zoomOut}
        onZoomReset={canvasApi.zoomReset}
        savedAt={savedAt}
      />

      <div className="flex flex-1 gap-3 overflow-hidden">
        <PageSidebar
          pages={pages}
          activePageId={activePageId}
          onSelectPage={handleSelectPage}
          onAddPage={handleAddPage}
          onDuplicatePage={handleDuplicatePage}
          onDeletePage={handleDeletePage}
          onMovePage={handleMovePage}
        />

        <div className="flex-1 overflow-auto rounded-md border border-gray-200 bg-gray-100 p-6">
          <div
            className="mx-auto shadow"
            style={{
              width: activePage?.pageSize === 'fullscreen' ? '100%' : PAGE_SIZE_PX[activePage?.pageSize ?? 'a4'].width,
              backgroundColor: activePage?.backgroundColor ?? '#ffffff',
              backgroundImage: paperBackgrounds[activePage?.paperStyle ?? 'blank'],
              backgroundSize: paperBackgroundSize[activePage?.paperStyle ?? 'blank'],
            }}
          >
            <canvas ref={canvasApi.canvasElRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
