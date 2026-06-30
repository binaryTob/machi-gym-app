// Global error handling middleware
import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import crypto from 'crypto'

// Request ID middleware (should be in a separate file)
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  req.headers['x-request-id'] = crypto.randomUUID()
  next()
}

// Global error handling middleware
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

  // Handle Zod validation errors
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

  // Handle Prisma known errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'Conflict',
        requestId,
        message: 'A unique constraint was violated'
      })
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Not found',
        requestId,
        message: 'The requested record does not exist'
      })
    }
    return res.status(400).json({
      error: 'Database error',
      requestId,
      message: err.message
    })
  }

  // Default error
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    requestId,
    timestamp: new Date().toISOString()
  })
}