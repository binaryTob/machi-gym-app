import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { History } from './pages/History'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/students/:studentId/history" element={<History />} />
        <Route path="*" element={<Navigate to="/students/current-student/history" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
