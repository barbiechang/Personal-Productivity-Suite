import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { Todo } from '../types/todo'

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<Todo[]>('/todos')
      .then((res) => setTodos(res.data))
      .catch(() => setTodos([]))
      .finally(() => setLoading(false))
  }, [])

  async function addTodo() {
    if (!title.trim()) return
    const res = await api.post<Todo>('/todos', { title, priority: 'medium' })
    setTodos((prev) => [...prev, res.data])
    setTitle('')
  }

  async function toggleTodo(todo: Todo) {
    const res = await api.put<Todo>(`/todos/${todo.id}`, {
      ...todo,
      isDone: !todo.isDone,
    })
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? res.data : t)))
  }

  async function deleteTodo(id: string) {
    await api.delete(`/todos/${id}`)
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Todo List</h2>
      <div className="mb-4 flex gap-2">
        <input
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="New task..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
        />
        <button
          onClick={addTodo}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500">Loading...</p>}

      <ul className="flex flex-col gap-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2"
          >
            <input
              type="checkbox"
              checked={todo.isDone}
              onChange={() => toggleTodo(todo)}
            />
            <span className={`flex-1 text-sm ${todo.isDone ? 'text-gray-400 line-through' : ''}`}>
              {todo.title}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-xs text-red-500 hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
