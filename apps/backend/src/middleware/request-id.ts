export const requestIdMiddleware = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || crypto.randomUUID()
  req.headers['x-request-id'] = requestId
  res.setHeader('x-request-id', requestId)
  next()
}

module.exports = { requestIdMiddleware }