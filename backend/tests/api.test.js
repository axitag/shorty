import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/config/database.js';

describe('Auth API', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPass123';
  let agent;

  beforeAll(async () => {
    await prisma.$connect();
    agent = request.agent(app);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { startsWith: 'test-' } } });
    await prisma.$disconnect();
  });

  it('POST /api/auth/register - creates a new user', async () => {
    const res = await agent.post('/api/auth/register').send({ email: testEmail, password: testPassword });
    expect(res.status).toBe(201);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.passwordHash).toBeUndefined();
  });

  it('POST /api/auth/register - rejects duplicate email', async () => {
    const res = await agent.post('/api/auth/register').send({ email: testEmail, password: testPassword });
    expect(res.status).toBe(409);
  });

  it('POST /api/auth/register - rejects weak password', async () => {
    const res = await agent.post('/api/auth/register').send({ email: 'weak@test.com', password: 'weak' });
    expect(res.status).toBe(400);
  });

  it('GET /api/auth/me - returns user profile after login', async () => {
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testEmail);
  });

  it('POST /api/auth/logout - logs out successfully', async () => {
    const res = await agent.post('/api/auth/logout');
    expect(res.status).toBe(204);
  });

  it('GET /api/auth/me - returns 401 after logout', async () => {
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/login - authenticates with valid credentials', async () => {
    const res = await agent.post('/api/auth/login').send({ email: testEmail, password: testPassword });
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testEmail);
  });

  it('POST /api/auth/login - rejects wrong password', async () => {
    const res = await agent.post('/api/auth/login').send({ email: testEmail, password: 'WrongPass123' });
    expect(res.status).toBe(401);
  });
});

describe('Links API', () => {
  const testEmail = `links-test-${Date.now()}@example.com`;
  const testPassword = 'LinkTest123';
  let agent;
  let createdLinkId;

  beforeAll(async () => {
    agent = request.agent(app);
    await agent.post('/api/auth/register').send({ email: testEmail, password: testPassword });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  it('POST /api/links - creates a link', async () => {
    const res = await agent.post('/api/links').send({ originalUrl: 'https://example.com', title: 'Test Link' });
    expect(res.status).toBe(201);
    expect(res.body.data.shortCode).toBeTruthy();
    expect(res.body.data.originalUrl).toBe('https://example.com');
    createdLinkId = res.body.data.id;
  });

  it('POST /api/links - rejects javascript: scheme', async () => {
    const res = await agent.post('/api/links').send({ originalUrl: 'javascript:alert(1)' });
    expect(res.status).toBe(400);
  });

  it('GET /api/links - lists links', async () => {
    const res = await agent.get('/api/links');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('GET /api/links/:id - gets link by id', async () => {
    const res = await agent.get(`/api/links/${createdLinkId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdLinkId);
  });

  it('PATCH /api/links/:id - updates link title', async () => {
    const res = await agent.patch(`/api/links/${createdLinkId}`).send({ title: 'Updated Title' });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
  });

  it('DELETE /api/links/:id - soft deletes link', async () => {
    const res = await agent.delete(`/api/links/${createdLinkId}`);
    expect(res.status).toBe(204);
  });

  it('GET /api/links/:id - returns 404 for deleted link', async () => {
    const res = await agent.get(`/api/links/${createdLinkId}`);
    expect(res.status).toBe(404);
  });

  it('Ownership: cannot access another user\'s link', async () => {
    // Create another user and link
    const agent2 = request.agent(app);
    await agent2.post('/api/auth/register').send({ email: `other-${Date.now()}@test.com`, password: 'OtherPass123' });
    const linkRes = await agent2.post('/api/links').send({ originalUrl: 'https://other.com' });
    const otherId = linkRes.body.data.id;

    // Try to access with original agent
    const res = await agent.get(`/api/links/${otherId}`);
    expect(res.status).toBe(404);

    await prisma.user.deleteMany({ where: { email: { startsWith: 'other-' } } });
  });
});

describe('Analytics API', () => {
  const testEmail = `analytics-test-${Date.now()}@example.com`;
  let agent;

  beforeAll(async () => {
    agent = request.agent(app);
    await agent.post('/api/auth/register').send({ email: testEmail, password: 'Analytics123' });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  it('GET /api/analytics/overview - returns overview', async () => {
    const res = await agent.get('/api/analytics/overview?preset=7d');
    expect(res.status).toBe(200);
    expect(res.body.data.totalClicks).toBeDefined();
  });

  it('GET /api/analytics/timeseries - returns time series', async () => {
    const res = await agent.get('/api/analytics/timeseries?preset=7d');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.data)).toBe(true);
  });

  it('GET /api/analytics/referrers - returns referrers', async () => {
    const res = await agent.get('/api/analytics/referrers?preset=7d');
    expect(res.status).toBe(200);
  });

  it('GET /api/analytics/devices - returns devices', async () => {
    const res = await agent.get('/api/analytics/devices?preset=7d');
    expect(res.status).toBe(200);
  });

  it('GET /api/analytics/overview - requires auth', async () => {
    const res = await request(app).get('/api/analytics/overview');
    expect(res.status).toBe(401);
  });
});

describe('Redirect', () => {
  it('GET /:shortCode - returns 404 for unknown code', async () => {
    const res = await request(app).get('/nonexistent-code-xyz');
    expect(res.status).toBe(404);
  });

  it('GET /:shortCode - redirects active link', async () => {
    const agent = request.agent(app);
    const email = `redirect-test-${Date.now()}@example.com`;
    await agent.post('/api/auth/register').send({ email, password: 'Redirect123' });
    const linkRes = await agent.post('/api/links').send({ originalUrl: 'https://google.com' });
    const { shortCode } = linkRes.body.data;

    const res = await request(app).get(`/${shortCode}`).redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('https://google.com');

    await prisma.user.deleteMany({ where: { email } });
  });
});
