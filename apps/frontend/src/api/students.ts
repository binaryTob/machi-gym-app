import type { Student, CreateStudentDTO, UpdateStudentDTO } from '../types/student'

const BASE = '/api/students'

export async function fetchStudents(): Promise<Student[]> {
  const res = await fetch(BASE)
  if (!res.ok) throw new Error('Failed to fetch students')
  return res.json()
}

export async function fetchStudent(id: string): Promise<Student> {
  const res = await fetch(`${BASE}/${id}`)
  if (!res.ok) throw new Error('Failed to fetch student')
  return res.json()
}

export async function createStudent(data: CreateStudentDTO): Promise<Student> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to create student')
  }
  return res.json()
}

export async function updateStudent(id: string, data: UpdateStudentDTO): Promise<Student> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to update student')
  }
  return res.json()
}

export async function deleteStudent(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to delete student')
  }
}
