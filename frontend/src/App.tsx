import { Routes, Route } from 'react-router-dom'
import AppLayout from './layout/AppLayout'
import Dashboard from './pages/Dashboard'
import TodoProjectGallery from './pages/todos/TodoProjectGallery'
import TodoProjectDetail from './pages/todos/TodoProjectDetail'
import NotebookGallery from './pages/notebook/NotebookGallery'
import NotebookEditor from './pages/notebook/NotebookEditor'
import Calendar from './pages/calendar/CalendarPage'
import ExpenseTracker from './pages/ExpenseTracker'
import FileManager from './pages/FileManager'
import EnglishPractice from './pages/english/EnglishPractice'
import TripGallery from './pages/travel/TripGallery'
import TripDetail from './pages/travel/TripDetail'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/todos" element={<TodoProjectGallery />} />
        <Route path="/todos/:projectId" element={<TodoProjectDetail />} />
        <Route path="/notebook" element={<NotebookGallery />} />
        <Route path="/notebook/:notebookId" element={<NotebookEditor />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/expenses" element={<ExpenseTracker />} />
        <Route path="/files" element={<FileManager />} />
        <Route path="/english" element={<EnglishPractice />} />
        <Route path="/travel" element={<TripGallery />} />
        <Route path="/travel/:tripId" element={<TripDetail />} />
      </Route>
    </Routes>
  )
}

export default App
