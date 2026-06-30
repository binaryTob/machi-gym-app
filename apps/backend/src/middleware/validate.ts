const { CreateStudentDTO, UpdateStudentDTO, StudentResponseDTO } = require('../schemas/student.zod')

function validateBody(schema) {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      })
    }
  }
}

function validateParams(idSchema) {
  return (req, res, next) => {
    try {
      req.params = idSchema.parse(req.params)
      next()
    } catch (error) {
      return res.status(400).json({
        error: 'Invalid parameters',
        details: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message
        }))
      })
    }
  }
}

module.exports = { validateBody, validateParams }
