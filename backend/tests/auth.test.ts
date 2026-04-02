/**
 * Auth Integration Tests
 * ----------------------
 * Tests all auth endpoints: register, login, refresh, logout, /me.
 *
 * Note: These tests use a real database (test schema).
 * Set DATABASE_URL in your test environment to a test DB.
 * For CI, a separate postgres container is spun up via docker-compose.
 */

import request from 'supertest';
import app from '../src/app';
import prisma from '../src/db';

// Test user credentials
const testUser = {
  name: 'Test User',
  email: `test.${Date.now()}@test.com`,
  password: 'Test@1234',
  role: 'STUDENT' as const,
};

let accessToken: string;
let cookies: string[];

afterAll(async () => {
  // Cleanup test data
  await prisma.user.deleteMany({ where: { email: testUser.email } }).catch(() => {});
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('should reject duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONFLICT');
  });

  it('should reject weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, email: 'other@test.com', password: 'weakpassword' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('should reject invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...testUser, email: 'not-an-email' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe('STUDENT');

    // Store for subsequent tests
    accessToken = res.body.data.accessToken;
    cookies = res.headers['set-cookie'] || [];
  });

  it('should set httpOnly refreshToken cookie', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const setCookie = res.headers['set-cookie'] as string[] | undefined;
    const rtCookie = setCookie?.find((c: string) => c.startsWith('refreshToken='));
    expect(rtCookie).toBeDefined();
    expect(rtCookie).toContain('HttpOnly');
    expect(rtCookie).toContain('Path=/api/auth');
  });

  it('should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'WrongPass@123' });

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('should reject non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'Test@1234' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('should return current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it('should reject request without token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  it('should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('should refresh tokens using cookie', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const setCookie = loginRes.headers['set-cookie'] as string[];

    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', setCookie);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.data.accessToken).toBeDefined();

    // Should set a new cookie (token rotation)
    const newCookie = refreshRes.headers['set-cookie'] as string[];
    expect(newCookie).toBeDefined();
  });

  it('should reject refresh without cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('should logout successfully', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    const setCookie = loginRes.headers['set-cookie'];

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', setCookie)
      .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // After logout, refresh should fail
    const refreshRes = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', setCookie);

    expect(refreshRes.status).toBe(401);
  });
});
