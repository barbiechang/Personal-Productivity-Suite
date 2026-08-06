export type CalendarListKind = 'priority' | 'wishlist' | 'note'

export interface CalendarListItemDto {
  id: string
  year: number
  month: number
  kind: CalendarListKind
  text: string
  isDone: boolean
  order: number
}

export type CalendarStickerRegion = 'grid' | 'sidebar'

export interface CalendarStickerDto {
  id: string
  year: number
  month: number
  region: CalendarStickerRegion
  imageDataUrl: string
  x: number
  y: number
  width: number
  height: number
  zIndex: number
}

export interface CalendarTextBoxDto {
  id: string
  year: number
  month: number
  text: string
  x: number
  y: number
  fontSize: number
  color: string
}
