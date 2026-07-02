import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Home.css'

type Student = {
  id: string
  firstName: string
  lastName: string
  email: string
  age: number
  lifestyle: string
}

function Home() {
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/students')
      .then(res => {
        if (!res.ok) throw new Error(res.statusText)
        return res.json()
      })
      .then(data => {
        setStudents(data)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setIsLoading(false)
      })
  }, [])

  if (isLoading) {
    return <div className="home-page"><div className="loading">Cargando estudiantes...</div></div>
  }

  if (error) {
    return (
      <div className="home-page">
        <div className="error">Error al conectar con el backend: {error}</div>
        <p className="hint">Asegurate de que el backend este corriendo en localhost:4000</p>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="home-page">
        <div className="empty">No hay estudiantes registrados</div>
        <p className="hint">
          Corre el seed: <code>cd apps/backend && yarn ts-node src/scripts/seed.ts</code>
        </p>
      </div>
    )
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Panel de Estudiantes</h1>
        <p className="subtitle">Selecciona un estudiante para ver su historial</p>
      </header>
      <div className="student-grid">
        {students.map(student => (
          <div
            key={student.id}
            className="student-card"
            onClick={() => navigate(`/students/${student.id}/history`)}
          >
            <div className="student-name">
              {student.firstName} {student.lastName}
            </div>
            <div className="student-details">
              <span>{student.email}</span>
              <span>{student.age} años</span>
              <span>{student.lifestyle}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Home
