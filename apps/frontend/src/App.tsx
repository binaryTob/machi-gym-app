import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import theme from './theme'
import AppLayout from './components/AppLayout'
import Dashboard from './pages/Dashboard'
import { History } from './pages/History'
import StudentsList from './pages/StudentsList'
import Routines from './pages/Routines'
import N8nPanel from './pages/N8nPanel'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<StudentsList />} />
            <Route path="/students/:studentId/history" element={<History />} />
            <Route path="/routines" element={<Routines />} />
            <Route path="/n8n" element={<N8nPanel />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
