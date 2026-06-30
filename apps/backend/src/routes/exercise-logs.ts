const express = require('express')
const { validateBody, validateParams } = require('../middleware/validate')
const { ExerciseCompletion } = require('../schemas/exercise-log.zod')
const { createExerciseLog, getExerciseLogById, updateExerciseLog, getAllExerciseLogs, deleteExerciseLog } = require('../services/exercise-log.service')

const router = express.Router()

router.post('/', validateBody(ExerciseCompletion), async (req, res) => {
  try {
    const exerciseLog = await createExerciseLog(req.body)
    res.status(201).json(exerciseLog)
  } catch (error) {
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
})

router.get('/:id', validateParams({ id: ExerciseCompletion.shape.id }), async (req, res) => {
  try {
    const exerciseLog = await getExerciseLogById(req.params.id, req.body.studentId)
    res.json(exerciseLog)
  } catch (error) {
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message })
    }
    if (error.message === 'Exercise log not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
})

router.patch('/:id', validateParams({ id: ExerciseCompletion.shape.id }), async (req, res) => {
  try {
    const exerciseLog = await updateExerciseLog(req.params.id, req.body.studentId, req.body)
    res.json(exerciseLog)
  } catch (error) {
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message })
    }
    if (error.message === 'Exercise log not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const { studentId, routineId } = req.query
    const exerciseLogs = await getAllExerciseLogs(studentId, routineId)
    res.json(exerciseLogs)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/:id', validateParams({ id: ExerciseCompletion.shape.id }), async (req, res) => {
  try {
    const exerciseLog = await deleteExerciseLog(req.params.id, req.body.studentId)
    res.json({ message: 'Exercise log deleted successfully', exerciseLog })
  } catch (error) {
    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message })
    }
    if (error.message === 'Exercise log not found') {
      return res.status(404).json({ error: error.message })
    }
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
