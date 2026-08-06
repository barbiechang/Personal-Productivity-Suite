import { useMemo, useState } from 'react'

interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: string
}

const CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Other']

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])

  const total = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses])

  function addExpense() {
    const value = Number(amount)
    if (!description.trim() || !value) return
    setExpenses((prev) => [
      { id: crypto.randomUUID(), description, amount: value, category, date: new Date().toISOString() },
      ...prev,
    ])
    setDescription('')
    setAmount('')
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Expense Tracker</h2>

      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">Total this period</p>
        <p className="text-2xl font-semibold">฿{total.toLocaleString()}</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <select
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          onClick={addExpense}
          className="rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
        >
          Add
        </button>
      </div>

      <table className="w-full overflow-hidden rounded-md border border-gray-200 bg-white text-sm">
        <thead className="bg-gray-50 text-left text-gray-500">
          <tr>
            <th className="px-3 py-2">Description</th>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((e) => (
            <tr key={e.id} className="border-t border-gray-100">
              <td className="px-3 py-2">{e.description}</td>
              <td className="px-3 py-2">{e.category}</td>
              <td className="px-3 py-2">{new Date(e.date).toLocaleDateString()}</td>
              <td className="px-3 py-2 text-right">฿{e.amount.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
