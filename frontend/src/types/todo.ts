export interface Todo {
  id: string
  title: string
  isDone: boolean
  dueDate: string | null
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}
