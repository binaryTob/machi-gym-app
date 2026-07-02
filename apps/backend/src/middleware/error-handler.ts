import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import crypto from 'crypto'

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = crypto.randomUUID()
  next()
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || 'unknown'

  console.error('Error:', {
    requestId,
    method: req.method,
    url: req.url,
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  })

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      requestId,
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    })
  }

  const prismaErr = err as { code?: string; message: string }
  if (prismaErr.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflict',
      requestId,
      message: 'A unique constraint was violated'
    })
  }
  if (prismaErr.code === 'P2025') {
    return res.status(404).json({
      error: 'Not found',
      requestId,
      message: 'The requested record does not exist'
    })
  }
  if (prismaErr.code) {
    return res.status(400).json({
      error: 'Database error',
      requestId,
      message: err.message
    })
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    requestId,
    timestamp: new Date().toISOString()
  })
}
