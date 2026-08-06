export type PaperStyle = 'blank' | 'lined' | 'grid' | 'dotGrid'
export type PageSize = 'a4' | 'letter' | 'fullscreen'

export interface NotebookPageDto {
  id: string
  notebookId: string
  title: string
  order: number
  paperStyle: PaperStyle
  pageSize: PageSize
  backgroundColor: string
  canvasJson: string
  thumbnailDataUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface NotebookDto {
  id: string
  title: string
  coverDataUrl: string | null
  coverIsCustom: boolean
  folderId: string | null
  createdAt: string
  updatedAt: string
  pages: NotebookPageDto[]
}

export interface NotebookSummaryDto {
  id: string
  title: string
  coverDataUrl: string | null
  folderId: string | null
  pageCount: number
  updatedAt: string
}

export interface FolderDto {
  id: string
  name: string
  coverDataUrl: string | null
  notebookCount: number
  updatedAt: string
}

export type Tool =
  | 'pen'
  | 'pencil'
  | 'highlighter'
  | 'eraser'
  | 'select'
  | 'pan'
  | 'text'
  | 'image'
  | 'shape-rect'
  | 'shape-circle'
  | 'shape-line'
  | 'shape-arrow'

export const PAGE_SIZE_PX: Record<PageSize, { width: number; height: number }> = {
  a4: { width: 1240, height: 1754 },
  letter: { width: 1275, height: 1650 },
  fullscreen: { width: 1200, height: 900 },
}
