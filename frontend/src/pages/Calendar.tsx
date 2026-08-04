import { useMemo, useState } from 'react'
import { addMonths, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns'

export default function Calendar() {
  const [month, setMonth] = useState(new Date())

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month))
    const end = endOfWeek(endOfMonth(month))
    const list: Date[] = []
    for (let d = start; d <= end; d = new Date(d.getTime() + 86400000)) {
      list.push(d)
    }
    return list
  }, [month])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{format(month, 'MMMM yyyy')}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setMonth((m) => addMonths(m, -1))}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Prev
          </button>
          <button
            onClick={() => setMonth(new Date())}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={() => setMonth((m) => addMonths(m, 1))}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-gray-200 bg-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="bg-gray-50 px-2 py-1 text-center text-xs font-medium text-gray-500">
            {d}
          </div>
        ))}
        {days.map((d) => (
          <div
            key={d.toISOString()}
            className={`min-h-[90px] bg-white p-2 text-sm ${
              isSameMonth(d, month) ? 'text-gray-900' : 'text-gray-300'
            }`}
          >
            {format(d, 'd')}
          </div>
        ))}
      </div>
    </div>
  )
}
