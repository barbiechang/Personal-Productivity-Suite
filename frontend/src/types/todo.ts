export interface Todo {
  id: string
  projectId: string
  title: string
  section: string
  isDone: boolean
  dueDate: string | null
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}
