import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'
import type { NotebookDto, NotebookSummaryDto, FolderDto } from './types'

const NOTEBOOK_DRAG_TYPE = 'application/x-notebook-id'

function FolderShape({ folder }: { folder: FolderDto }) {
  const clipId = `folder-clip-${folder.id}`
  // 100x75 matches the 4:3 card, so the folder fills it edge to edge.
  return (
    <svg viewBox="0 0 100 75" className="h-full w-full drop-shadow">
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="42" height="16" rx="4" />
          <rect x="0" y="8" width="100" height="67" rx="6" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {folder.coverDataUrl ? (
          <image href={folder.coverDataUrl} x="0" y="0" width="100" height="75" preserveAspectRatio="xMidYMid slice" />
        ) : (
          <rect x="0" y="0" width="100" height="75" fill="#f7c5d8" />
        )}
      </g>
    </svg>
  )
}

function CardMenu({ menuKey, open, onToggle, children }: { menuKey: string; open: boolean; onToggle: (key: string | null) => void; children: React.ReactNode }) {
  return (
    <div data-card-menu className="absolute right-1 top-1 z-20">
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle(open ? null : menuKey)
        }}
        className={`rounded-full bg-white/90 px-2 py-0.5 text-sm text-gray-600 shadow-sm hover:bg-white ${open ? '' : 'opacity-0 group-hover:opacity-100'}`}
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-32 overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {children}
        </div>
      )}
    </div>
  )
}

function MenuItem({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 ${danger ? 'text-red-500' : 'text-gray-700'}`}
    >
      {children}
    </button>
  )
}

const GRID_CLASS = 'grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4'

type CoverTarget = { type: 'notebook'; notebook: NotebookSummaryDto } | { type: 'folder'; folder: FolderDto }

export default function NotebookGallery() {
  const [searchParams, setSearchParams] = useSearchParams()
  const folderId = searchParams.get('folder')
  const navigate = useNavigate()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const coverTargetRef = useRef<CoverTarget | null>(null)

  const [folders, setFolders] = useState<FolderDto[]>([])
  const [notebooks, setNotebooks] = useState<NotebookSummaryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId])

  useEffect(() => {
    if (!openMenu) return
    function handleClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest('[data-card-menu]')) setOpenMenu(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [openMenu])

  async function refresh() {
    setLoading(true)
    const [nbRes, foldersRes] = await Promise.all([
      api.get<NotebookSummaryDto[]>('/notebooks', { params: folderId ? { folderId } : {} }),
      api.get<FolderDto[]>('/folders'),
    ])
    setNotebooks(nbRes.data)
    setFolders(foldersRes.data)
    setLoading(false)
  }

  const currentFolder = folderId ? folders.find((f) => f.id === folderId) ?? null : null

  async function createNotebook() {
    const res = await api.post<NotebookDto>('/notebooks', { title: 'Untitled', folderId })
    navigate(`/notebook/${res.data.id}`)
  }

  async function createFolder() {
    const name = prompt('Folder name', 'New Folder')
    if (!name) return
    await api.post('/folders', { name })
    refresh()
  }

  async function renameFolder(id: string, currentName: string) {
    const name = prompt('Folder name', currentName)
    if (!name || name === currentName) return
    await api.put(`/folders/${id}`, { name })
    refresh()
  }

  async function deleteFolder(id: string) {
    if (!confirm('Delete this folder? Notebooks inside move back to All Notebooks.')) return
    await api.delete(`/folders/${id}`)
    refresh()
  }

  async function renameNotebook(notebook: NotebookSummaryDto) {
    const title = prompt('Notebook name', notebook.title)
    if (!title || title === notebook.title) return
    await api.put(`/notebooks/${notebook.id}`, { title, coverDataUrl: null, folderId: notebook.folderId })
    refresh()
  }

  async function deleteNotebook(id: string) {
    if (!confirm('Delete this notebook and all its pages? This cannot be undone.')) return
    await api.delete(`/notebooks/${id}`)
    setNotebooks((prev) => prev.filter((n) => n.id !== id))
  }

  async function moveNotebookToFolder(notebookId: string, targetFolderId: string | null) {
    const notebook = notebooks.find((n) => n.id === notebookId)
    if (!notebook || notebook.folderId === targetFolderId) return
    await api.put(`/notebooks/${notebookId}`, {
      title: notebook.title,
      coverDataUrl: null,
      folderId: targetFolderId,
    })
    refresh()
  }

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
      if (target.type === 'notebook') {
        await api.put(`/notebooks/${target.notebook.id}`, {
          title: target.notebook.title,
          coverDataUrl: dataUrl,
          folderId: target.notebook.folderId,
        })
      } else {
        await api.put(`/folders/${target.folder.id}`, { name: target.folder.name, coverDataUrl: dataUrl })
      }
      refresh()
    }
    reader.readAsDataURL(file)
  }

  function handleDrop(e: React.DragEvent, targetFolderId: string | null) {
    e.preventDefault()
    setDropTarget(null)
    const id = e.dataTransfer.getData(NOTEBOOK_DRAG_TYPE)
    if (id) moveNotebookToFolder(id, targetFolderId)
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

      <div className="mb-4 flex items-center gap-2">
        {currentFolder ? (
          <>
            <button
              onClick={() => setSearchParams({})}
              onDragOver={(e) => {
                e.preventDefault()
                setDropTarget('root')
              }}
              onDragLeave={() => setDropTarget(null)}
              onDrop={(e) => handleDrop(e, null)}
              className={`rounded px-2 py-1 text-sm text-gray-500 hover:text-gray-700 ${dropTarget === 'root' ? 'bg-pink-50 ring-2 ring-pink-300' : ''}`}
            >
              ← All Notebooks
            </button>
            <h2 className="text-xl font-semibold">{currentFolder.name}</h2>
          </>
        ) : (
          <h2 className="text-xl font-semibold">Digital Notebook</h2>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <>
        {!currentFolder && (
        <div className={`${GRID_CLASS} mb-6`}>
            <button
              onClick={createFolder}
              className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-pink-400 hover:text-pink-500"
            >
              <span className="text-2xl leading-none">📁+</span>
              <span className="text-sm">New Folder</span>
            </button>

            {folders.map((folder) => (
              <div key={folder.id} className="group relative flex flex-col">
                <button
                  onClick={() => setSearchParams({ folder: folder.id })}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDropTarget(folder.id)
                  }}
                  onDragLeave={() => setDropTarget((cur) => (cur === folder.id ? null : cur))}
                  onDrop={(e) => handleDrop(e, folder.id)}
                  className={`relative aspect-[4/3] rounded-lg ${
                    dropTarget === folder.id ? 'ring-2 ring-pink-400' : ''
                  }`}
                >
                  <FolderShape folder={folder} />
                </button>

                <CardMenu menuKey={`folder-${folder.id}`} open={openMenu === `folder-${folder.id}`} onToggle={setOpenMenu}>
                  <MenuItem
                    onClick={() => {
                      setOpenMenu(null)
                      pickCover({ type: 'folder', folder })
                    }}
                  >
                    Set cover
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setOpenMenu(null)
                      renameFolder(folder.id, folder.name)
                    }}
                  >
                    Rename
                  </MenuItem>
                  <MenuItem
                    danger
                    onClick={() => {
                      setOpenMenu(null)
                      deleteFolder(folder.id)
                    }}
                  >
                    Delete
                  </MenuItem>
                </CardMenu>

                <div className="mt-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{folder.name}</p>
                  <p className="text-xs text-gray-400">
                    {folder.notebookCount} notebook{folder.notebookCount === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            ))}
        </div>
        )}

        <div className={GRID_CLASS}>
          <button
            onClick={createNotebook}
            className="flex min-h-[11.875rem] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-pink-400 hover:text-pink-500"
          >
            <span className="text-3xl leading-none">+</span>
            <span className="text-sm">New</span>
          </button>

          {notebooks.map((notebook) => (
            <div
              key={notebook.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData(NOTEBOOK_DRAG_TYPE, notebook.id)}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
            >
              <button onClick={() => navigate(`/notebook/${notebook.id}`)} className="flex h-28 w-full items-center justify-center overflow-hidden bg-gray-50">
                {notebook.coverDataUrl ? (
                  <img src={notebook.coverDataUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-300">No preview</span>
                )}
              </button>

              <CardMenu menuKey={`notebook-${notebook.id}`} open={openMenu === `notebook-${notebook.id}`} onToggle={setOpenMenu}>
                <MenuItem
                  onClick={() => {
                    setOpenMenu(null)
                    pickCover({ type: 'notebook', notebook })
                  }}
                >
                  Set cover
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setOpenMenu(null)
                    renameNotebook(notebook)
                  }}
                >
                  Rename
                </MenuItem>
                <MenuItem
                  danger
                  onClick={() => {
                    setOpenMenu(null)
                    deleteNotebook(notebook.id)
                  }}
                >
                  Delete
                </MenuItem>
              </CardMenu>

              <div className="p-2">
                <p className="truncate text-sm font-medium text-gray-800">{notebook.title}</p>
                <p className="text-xs text-gray-400">
                  {notebook.pageCount} page{notebook.pageCount === 1 ? '' : 's'} · {new Date(notebook.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  )
}
