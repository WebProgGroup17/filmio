
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';

// Mock the database connection during tests
const mockQuery = jest.fn();

jest.unstable_mockModule('../helper/db.js', () => ({
  pool: {
    query: mockQuery,
  },
}));

// Import the router after mocking the database
const { default: userRouter } = await import('../routes/userRouter.js');

// Create the Express app for testing
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/users', userRouter);

// Handle errors
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: {
      message: err.message,
    },
  });
});

describe('User logout', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  test('should log out successfully and clear the refresh token', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const response = await request(app)
      .post('/users/logout')
      .set('Cookie', 'refreshToken=test-refresh-token');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logged out successfully');

    expect(mockQuery).toHaveBeenCalledWith(
      'UPDATE users SET refresh_token = NULL WHERE refresh_token = $1',
      ['test-refresh-token'],
    );

    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^refreshToken=/),
      ]),
    );
  });

  test('should log out successfully when no refresh token exists', async () => {
    const response = await request(app).post('/users/logout');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logged out successfully');
    expect(mockQuery).not.toHaveBeenCalled();

    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^refreshToken=/),
      ]),
    );
  });

  test('should return an error if the database query fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .post('/users/logout')
      .set('Cookie', 'refreshToken=test-refresh-token');

    expect(response.status).toBe(500);
    expect(response.body.error.message).toBe('Database error');
  });
});