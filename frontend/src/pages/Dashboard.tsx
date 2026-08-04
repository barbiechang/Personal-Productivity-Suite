export default function Dashboard() {
  const cards = [
    { label: 'Todos due today', value: '—' },
    { label: 'Notes', value: '—' },
    { label: "This month's expenses", value: '—' },
    { label: 'Upcoming events', value: '—' },
  ]

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Dashboard</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
