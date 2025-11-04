import { describe, it, expect } from 'vitest'
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'
import { authenticateToken } from '../../../src/middleware/auth'

const app = express()
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ ok: true })
})

describe('authenticateToken middleware', () => {
  it('returns 401 if no token provided', async () => {
    const res = await request(app).get('/protected')
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Token de autenticación requerido')
  })

  it('returns 403 if token is invalid', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid')

    expect(res.status).toBe(403)
    expect(res.body.error).toBe('Token inválido o expirado')
  })

  it('allows access with valid token using default secret', async () => {
    delete process.env.JWT_SECRET

    const token = jwt.sign(
      { userId: 1, username: 'test', email: 't@test.com', roles: [] },
      'default-secret'
    )

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('allows access with valid token using env secret', async () => {
    process.env.JWT_SECRET = 'MY_SECRET'

    const token = jwt.sign(
      { userId: 1, username: 'test', email: 't@test.com', roles: [] },
      'MY_SECRET'
    )

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })
})
