import type { Request, Response, NextFunction } from 'express'
import type { ZodSchema } from 'zod'

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error: unknown) {
      const zodError = error as { errors: Array<{ path: (string | number)[]; message: string }> }
      return res.status(400).json({
        error: 'Validation error',
        details: zodError.errors.map((e: { path: (string | number)[]; message: string }) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      })
    }
  }
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params) as any
      next()
    } catch (error: unknown) {
      const zodError = error as { errors: Array<{ path: (string | number)[]; message: string }> }
      return res.status(400).json({
        error: 'Invalid parameters',
        details: zodError.errors.map((e: { path: (string | number)[]; message: string }) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      })
    }
  }
}
