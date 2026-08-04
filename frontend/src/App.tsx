import { Routes, Route } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import Dashboard from './pages/Dashboard'
import TodoList from './pages/TodoList'
import Notes from './pages/Notes'
import DigitalNotebook from './pages/DigitalNotebook'
import Calendar from './pages/Calendar'
import ExpenseTracker from './pages/ExpenseTracker'
import FileManager from './pages/FileManager'
import AiAssistant from './pages/AiAssistant'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/todos" element={<TodoList />} />
        <Route path="/notes" element={<Notes />} />
        <Route path="/notebook" element={<DigitalNotebook />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/expenses" element={<ExpenseTracker />} />
        <Route path="/files" element={<FileManager />} />
        <Route path="/assistant" element={<AiAssistant />} />
      </Route>
    </Routes>
  )
}

export default App
