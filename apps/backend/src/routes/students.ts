import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { validateBody, validateParams } from '../middleware/validate'
import { StudentZodSchemas } from '../schemas/student.zod'
import { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent } from '../services/student.service'
import { getRecentSessions } from '../services/history.service'

const router = Router()
const idParamSchema = z.object({ id: z.string() })

router.get('/', async (_req: Request, res: Response) => {
  try {
    const students = await getAllStudents()
    res.json(students)
  } catch (error: unknown) {
    res.status(500).json({ error: (error as Error).message })
  }
})

router.post('/', validateBody(StudentZodSchemas.CreateStudentDTO), async (req: Request, res: Response) => {
  try {
    const student = await createStudent(req.body)
    res.status(201).json(student)
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id/history', validateParams(idParamSchema), async (req: Request, res: Response) => {
  try {
    const history = await getRecentSessions(req.params.id!)
    res.json(history)
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.get('/:id/profile', validateParams(idParamSchema), async (req: Request, res: Response) => {
  try {
    const student = await getStudentById(req.params.id!)
    res.json(student.profile)
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.put('/:id', validateParams(idParamSchema), validateBody(StudentZodSchemas.UpdateStudentDTO), async (req: Request, res: Response) => {
  try {
    const student = await updateStudent(req.params.id!, req.body)
    res.json(student)
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: err.message })
  }
})

router.delete('/:id', validateParams(idParamSchema), async (req: Request, res: Response) => {
  try {
    const student = await deleteStudent(req.params.id!)
    res.json({ message: 'Student deleted successfully', student })
  } catch (error: unknown) {
    const err = error as Error
    if (err.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: err.message })
  }
})

export default router
