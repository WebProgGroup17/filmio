import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// replace db connetion for the duration of the test
const mockQuery = jest.fn();

jest.unstable_mockModule('../helper/db.js', () => ({
  pool: {
    query: mockQuery
  }
}));

const { default: userRouter } = await import('../routes/userRouter.js');

const app = express();

app.use(express.json());
app.use('/users', userRouter);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: {
      message: err.message
    }
  });
});

describe('User registration', () => {

  beforeEach(() => {
    mockQuery.mockReset();
  });

  test('should register a new user', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{
          user_id: 1,
          email: 'test@example.com'
        }]
      });

    const response = await request(app)
      .post('/users/signup')
      .send({
        user: {
          email: 'test@example.com',
          password: 'Test12345'
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe('test@example.com');
    expect(response.body.user_id).toBe(1);
  });

  test('should reject an already registered email', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ user_id: 1 }]
    });

    const response = await request(app)
      .post('/users/signup')
      .send({
        user: {
          email: 'test@example.com',
          password: 'Test12345'
        }
      });

    expect(response.status).toBe(409);
  });

  test('should reject missing email', async () => {
    const response = await request(app)
      .post('/users/signup')
      .send({
        user: {
          password: 'Test12345'
        }
      });

    expect(response.status).toBe(400);
  });

  test('should reject missing password', async () => {
    const response = await request(app)
      .post('/users/signup')
      .send({
        user: {
          email: 'test@example.com'
        }
      });

    expect(response.status).toBe(400);
  });

  test('should reject a weak password', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post('/users/signup')
      .send({
        user: {
          email: 'test@example.com',
          password: 'password'
        }
      });

    expect(response.status).toBe(400);
  });

});