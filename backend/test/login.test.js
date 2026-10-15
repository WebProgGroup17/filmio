import { jest, describe, test, expect, beforeEach, beforeAll } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import { hash } from 'bcrypt';

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

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: {
      message: err.message
    }
  });
});

describe('User login', () => {

  let passwordHash;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test_secret';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
    passwordHash = await hash('Test12345', 4);
  });

  beforeEach(() => {
    mockQuery.mockReset();
  });

  test('should login successfully with valid credentials', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{
          user_id: 1,
          email: 'test@example.com',
          password_hash: passwordHash
        }]
      })
      .mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post('/users/login')
      .send({
        user: {
          email: 'test@example.com',
          password: 'Test12345'
        }
      });

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
    expect(response.body.email).toBe('test@example.com');
    expect(response.body.token).toBeDefined();
    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('refreshToken=');
    expect(cookie).toContain('HttpOnly');
    // refresh token is saved to db
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  test('should normalize email before searching user', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{
          user_id: 1,
          email: 'test@example.com',
          password_hash: passwordHash
        }]
      })
      .mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post('/users/login')
      .send({
        user: {
          email: '  TEST@Example.com ',
          password: 'Test12345'
        }
      });

    expect(response.status).toBe(200);
    expect(mockQuery.mock.calls[0][1]).toEqual(['test@example.com']);
  });

  test('should reject wrong password', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{
        user_id: 1,
        email: 'test@example.com',
        password_hash: passwordHash
      }]
    });

    const response = await request(app)
      .post('/users/login')
      .send({
        user: {
          email: 'test@example.com',
          password: 'WrongPass1'
        }
      });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Invalid email or password');
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  test('should reject unknown email', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .post('/users/login')
      .send({
        user: {
          email: 'unknown@example.com',
          password: 'Test12345'
        }
      });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Invalid email or password');
  });

  test('should reject missing email', async () => {
    const response = await request(app)
      .post('/users/login')
      .send({
        user: {
          password: 'Test12345'
        }
      });

    expect(response.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('should reject missing password', async () => {
    const response = await request(app)
      .post('/users/login')
      .send({
        user: {
          email: 'test@example.com'
        }
      });

    expect(response.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('should return 500 when database fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('db error'));

    const response = await request(app)
      .post('/users/login')
      .send({
        user: {
          email: 'test@example.com',
          password: 'Test12345'
        }
      });

    expect(response.status).toBe(500);
  });

});
