import type { PageSize, PaperStyle, Tool } from '../types'

interface ToolbarProps {
  tool: Tool
  onToolChange: (t: Tool) => void
  color: string
  onColorChange: (c: string) => void
  width: number
  onWidthChange: (w: number) => void
  paperStyle: PaperStyle
  onPaperStyleChange: (p: PaperStyle) => void
  pageSize: PageSize
  onPageSizeChange: (s: PageSize) => void
  backgroundColor: string
  onBackgroundColorChange: (c: string) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onInsertImage: (file: File) => void
  onImportPdf: (file: File) => void
  onExportPNG: () => void
  onExportPagePDF: () => void
  onExportNotebookPDF: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  savedAt: Date | null
}

const DRAW_TOOLS: { id: Tool; label: string }[] = [
  { id: 'pen', label: 'Pen' },
  { id: 'pencil', label: 'Pencil' },
  { id: 'highlighter', label: 'Highlighter' },
  { id: 'eraser', label: 'Eraser' },
]

const OTHER_TOOLS: { id: Tool; label: string }[] = [
  { id: 'select', label: 'Select' },
  { id: 'pan', label: 'Pan' },
  { id: 'text', label: 'Text' },
  { id: 'shape-rect', label: '▭' },
  { id: 'shape-circle', label: '◯' },
  { id: 'shape-line', label: '╱' },
  { id: 'shape-arrow', label: '↗' },
]

function ToolButton({ active, onClick, children, title }: { active: boolean; onClick: () => void; children: React.ReactNode; title: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`px-2.5 py-1.5 text-sm ${active ? 'bg-pink-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
    >
      {children}
    </button>
  )
}

export default function Toolbar(props: ToolbarProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md border border-gray-200 bg-white p-3">
      <div className="flex overflow-hidden rounded-md border border-gray-300">
        {DRAW_TOOLS.map((t) => (
          <ToolButton key={t.id} active={props.tool === t.id} onClick={() => props.onToolChange(t.id)} title={t.label}>
            {t.label}
          </ToolButton>
        ))}
      </div>

      <div className="flex overflow-hidden rounded-md border border-gray-300">
        {OTHER_TOOLS.map((t) => (
          <ToolButton key={t.id} active={props.tool === t.id} onClick={() => props.onToolChange(t.id)} title={t.label}>
            {t.label}
          </ToolButton>
        ))}
      </div>

      <label className="cursor-pointer rounded-md border border-gray-300 px-2.5 py-1.5 text-sm hover:bg-gray-50">
        Image
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) props.onInsertImage(file)
            e.target.value = ''
          }}
        />
      </label>

      <input
        type="color"
        value={props.color}
        onChange={(e) => props.onColorChange(e.target.value)}
        title="Color"
        className="h-8 w-8 cursor-pointer rounded border border-gray-300"
      />

      <input
        type="range"
        min={1}
        max={24}
        value={props.width}
        onChange={(e) => props.onWidthChange(Number(e.target.value))}
        title="Thickness"
      />

      <select
        value={props.paperStyle}
        onChange={(e) => props.onPaperStyleChange(e.target.value as PaperStyle)}
        className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
      >
        <option value="blank">Blank</option>
        <option value="lined">Lined</option>
        <option value="grid">Grid</option>
        <option value="dotGrid">Dot grid</option>
      </select>

      <select
        value={props.pageSize}
        onChange={(e) => props.onPageSizeChange(e.target.value as PageSize)}
        className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
      >
        <option value="a4">A4</option>
        <option value="letter">Letter</option>
        <option value="fullscreen">Fullscreen</option>
      </select>

      <input
        type="color"
        value={props.backgroundColor}
        onChange={(e) => props.onBackgroundColorChange(e.target.value)}
        title="Page background color"
        className="h-8 w-8 cursor-pointer rounded border border-gray-300"
      />

      <div className="flex overflow-hidden rounded-md border border-gray-300">
        <button disabled={!props.canUndo} onClick={props.onUndo} className="px-2.5 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50">
          Undo
        </button>
        <button disabled={!props.canRedo} onClick={props.onRedo} className="px-2.5 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50">
          Redo
        </button>
      </div>

      <div className="flex overflow-hidden rounded-md border border-gray-300">
        <button onClick={props.onZoomOut} className="px-2.5 py-1.5 text-sm hover:bg-gray-50">
          −
        </button>
        <button onClick={props.onZoomReset} className="px-2.5 py-1.5 text-sm hover:bg-gray-50">
          100%
        </button>
        <button onClick={props.onZoomIn} className="px-2.5 py-1.5 text-sm hover:bg-gray-50">
          +
        </button>
      </div>

      <label className="cursor-pointer rounded-md border border-gray-300 px-2.5 py-1.5 text-sm hover:bg-gray-50">
        Import PDF
        <input
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) props.onImportPdf(file)
            e.target.value = ''
          }}
        />
      </label>

      <div className="flex overflow-hidden rounded-md border border-gray-300">
        <button onClick={props.onExportPNG} className="px-2.5 py-1.5 text-sm hover:bg-gray-50">
          Export PNG
        </button>
        <button onClick={props.onExportPagePDF} className="px-2.5 py-1.5 text-sm hover:bg-gray-50">
          Page PDF
        </button>
        <button onClick={props.onExportNotebookPDF} className="px-2.5 py-1.5 text-sm hover:bg-gray-50">
          Notebook PDF
        </button>
      </div>

      <span className="ml-auto text-xs text-gray-400">
        {props.savedAt ? `Saved ${props.savedAt.toLocaleTimeString()}` : 'Not saved yet'}
      </span>
    </div>
  )
}
