const express = require('express')
const { validateBody, validateParams } = require('../middleware/validate')
const { StudentZodSchemas } = require('../schemas/student.zod')
const { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent } = require('../services/student.service')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const students = await getAllStudents()
    res.json(students)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/', validateBody(StudentZodSchemas.CreateStudentDTO), async (req, res) => {
  try {
    const student = await createStudent(req.body)
    res.status(201).json(student)
  } catch (error) {
    if (error.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id/profile', validateParams({ id: StudentZodSchemas.CreateStudentDTO.shape.id }), async (req, res) => {
  try {
    const student = await getStudentById(req.params.id)
    res.json(student.profile)
  } catch (error) {
    if (error.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: error.message })
  }
})

router.put('/:id', validateParams({ id: StudentZodSchemas.CreateStudentDTO.shape.id }), validateBody(StudentZodSchemas.UpdateStudentDTO), async (req, res) => {
  try {
    const student = await updateStudent(req.params.id, req.body)
    res.json(student)
  } catch (error) {
    if (error.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', validateParams({ id: StudentZodSchemas.CreateStudentDTO.shape.id }), async (req, res) => {
  try {
    const student = await deleteStudent(req.params.id)
    res.json({ message: 'Student deleted successfully', student })
  } catch (error) {
    if (error.message === 'Student not found') {
      return res.status(404).json({ error: 'Student not found' })
    }
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
