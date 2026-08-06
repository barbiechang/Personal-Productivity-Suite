import type { NotebookPageDto } from '../types'

interface PageSidebarProps {
  pages: NotebookPageDto[]
  activePageId: string | null
  onSelectPage: (id: string) => void
  onAddPage: () => void
  onDuplicatePage: (id: string) => void
  onDeletePage: (id: string) => void
  onMovePage: (id: string, direction: 'up' | 'down') => void
}

export default function PageSidebar({ pages, activePageId, onSelectPage, onAddPage, onDuplicatePage, onDeletePage, onMovePage }: PageSidebarProps) {
  const ordered = [...pages].sort((a, b) => a.order - b.order)

  return (
    <div className="flex w-44 shrink-0 flex-col gap-2 overflow-y-auto border-r border-gray-200 bg-white p-2">
      {ordered.map((page, index) => (
        <div
          key={page.id}
          className={`group relative cursor-pointer rounded-md border p-1 ${
            page.id === activePageId ? 'border-pink-500 ring-2 ring-pink-200' : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onSelectPage(page.id)}
        >
          <div className="flex aspect-[3/4] items-center justify-center overflow-hidden rounded bg-gray-50">
            {page.thumbnailDataUrl ? (
              <img src={page.thumbnailDataUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="text-xs text-gray-300">Blank</span>
            )}
          </div>
          <p className="mt-1 text-center text-xs text-gray-500">{index + 1}</p>

          <div className="absolute inset-x-0 bottom-0 hidden justify-center gap-1 bg-white/90 p-1 group-hover:flex">
            <button
              title="Move up"
              disabled={index === 0}
              onClick={(e) => {
                e.stopPropagation()
                onMovePage(page.id, 'up')
              }}
              className="rounded px-1 text-xs text-gray-600 disabled:opacity-30 hover:bg-gray-100"
            >
              ↑
            </button>
            <button
              title="Move down"
              disabled={index === ordered.length - 1}
              onClick={(e) => {
                e.stopPropagation()
                onMovePage(page.id, 'down')
              }}
              className="rounded px-1 text-xs text-gray-600 disabled:opacity-30 hover:bg-gray-100"
            >
              ↓
            </button>
            <button
              title="Duplicate"
              onClick={(e) => {
                e.stopPropagation()
                onDuplicatePage(page.id)
              }}
              className="rounded px-1 text-xs text-gray-600 hover:bg-gray-100"
            >
              ⧉
            </button>
            <button
              title="Delete"
              disabled={ordered.length <= 1}
              onClick={(e) => {
                e.stopPropagation()
                onDeletePage(page.id)
              }}
              className="rounded px-1 text-xs text-red-500 disabled:opacity-30 hover:bg-red-50"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={onAddPage}
        className="rounded-md border border-dashed border-gray-300 py-3 text-sm text-gray-500 hover:border-pink-400 hover:text-pink-600"
      >
        + Add page
      </button>
    </div>
  )
}
