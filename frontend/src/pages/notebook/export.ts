import { jsPDF } from 'jspdf'
import { StaticCanvas } from 'fabric'
import { PAGE_SIZE_PX, type NotebookPageDto } from './types'

function download(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

export function downloadPNG(dataUrl: string, filename: string) {
  download(dataUrl, filename)
}

export function downloadSinglePagePDF(dataUrl: string, width: number, height: number, filename: string) {
  const doc = new jsPDF({ orientation: width >= height ? 'l' : 'p', unit: 'px', format: [width, height] })
  doc.addImage(dataUrl, 'PNG', 0, 0, width, height)
  doc.save(filename)
}

async function rasterizePage(page: NotebookPageDto): Promise<{ dataUrl: string; width: number; height: number }> {
  const size = page.pageSize === 'fullscreen' ? PAGE_SIZE_PX.fullscreen : PAGE_SIZE_PX[page.pageSize]
  const el = document.createElement('canvas')
  const staticCanvas = new StaticCanvas(el, { width: size.width, height: size.height })
  staticCanvas.backgroundColor = page.backgroundColor || '#ffffff'

  if (page.canvasJson) {
    await staticCanvas.loadFromJSON(page.canvasJson)
  }
  staticCanvas.renderAll()
  const dataUrl = staticCanvas.toDataURL({ format: 'png', multiplier: 1 })
  staticCanvas.dispose()
  return { dataUrl, width: size.width, height: size.height }
}

export async function downloadNotebookPDF(pages: NotebookPageDto[], filename: string) {
  const ordered = [...pages].sort((a, b) => a.order - b.order)
  if (ordered.length === 0) return

  const first = await rasterizePage(ordered[0])
  const doc = new jsPDF({
    orientation: first.width >= first.height ? 'l' : 'p',
    unit: 'px',
    format: [first.width, first.height],
  })
  doc.addImage(first.dataUrl, 'PNG', 0, 0, first.width, first.height)

  for (let i = 1; i < ordered.length; i++) {
    const page = await rasterizePage(ordered[i])
    doc.addPage([page.width, page.height], page.width >= page.height ? 'l' : 'p')
    doc.addImage(page.dataUrl, 'PNG', 0, 0, page.width, page.height)
  }

  doc.save(filename)
}
