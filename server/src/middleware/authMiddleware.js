import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'mellow_dev_secret')
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'mellow_dev_secret')
    } catch { /* ignore */ }
  }
  next()
}
