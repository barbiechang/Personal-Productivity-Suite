import { getStroke } from 'perfect-freehand'
import { Path } from 'fabric'

export interface StrokePoint {
  x: number
  y: number
  pressure: number
}

export interface StrokeOptions {
  size: number
  color: string
  opacity?: number
  thinning?: number
  smoothing?: number
  compositeOperation?: GlobalCompositeOperation
}

// Standard perfect-freehand -> SVG path conversion (from the library's own docs):
// turns the outline point list into a closed, filled path via quadratic curves.
function getSvgPathFromStroke(points: number[][]): string {
  if (!points.length) return ''

  const d = points.reduce<(string | number)[]>(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...points[0], 'Q'],
  )

  d.push('Z')
  return d.join(' ')
}

export function pointsToOutline(points: StrokePoint[], size: number, thinning: number, smoothing: number): number[][] {
  return getStroke(
    points.map((p) => [p.x, p.y, p.pressure]),
    {
      size,
      thinning,
      smoothing,
      streamline: 0.5,
      simulatePressure: false,
    },
  )
}

export function createStrokePath(points: StrokePoint[], options: StrokeOptions): Path | null {
  if (points.length < 2) return null

  const outline = pointsToOutline(points, options.size, options.thinning ?? 0.5, options.smoothing ?? 0.5)
  const pathData = getSvgPathFromStroke(outline)
  if (!pathData) return null

  const path = new Path(pathData, {
    fill: options.color,
    stroke: undefined,
    opacity: options.opacity ?? 1,
    selectable: false,
    evented: false,
    objectCaching: false,
  })

  if (options.compositeOperation) {
    path.globalCompositeOperation = options.compositeOperation
  }

  return path
}
