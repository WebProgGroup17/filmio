import { jest, describe, test, expect, beforeEach, beforeAll } from '@jest/globals';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// replace db connetion for the duration of the test
const mockQuery = jest.fn();

jest.unstable_mockModule('../helper/db.js', () => ({
  pool: {
    query: mockQuery
  }
}));

const { default: moviesRouter } = await import('../routes/movies.js');

const app = express();

app.use(express.json());
app.use('/movies', moviesRouter);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: {
      message: err.message
    }
  });
});

describe('Movie reviews', () => {

  let token;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret';
    token = jwt.sign(
      { userId: 1, email: 'test@example.com' },
      process.env.JWT_SECRET
    );
  });

  beforeEach(() => {
    mockQuery.mockReset();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('GET /movies/:id/reviews', () => {

    test('should return reviews of a movie', async () => {
      const reviews = [
        {
          review_id: 2,
          review_text: 'Great movie',
          stars: 5,
          created_at: '2025-01-02T10:00:00.000Z',
          username: 'test'
        },
        {
          review_id: 1,
          review_text: 'Okay',
          stars: 3,
          created_at: '2025-01-01T10:00:00.000Z',
          username: 'other'
        }
      ];
      mockQuery.mockResolvedValueOnce({ rows: reviews });

      const response = await request(app).get('/movies/550/reviews');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(reviews);
      expect(mockQuery.mock.calls[0][1]).toEqual(['550']);
    });

    test('should return empty list when movie has no reviews', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/movies/550/reviews');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return 500 when database fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('db error'));

      const response = await request(app).get('/movies/550/reviews');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to fetch reviews');
    });

  });

  describe('POST /movies/:id/reviews', () => {

    test('should add a review', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          review_id: 1,
          user_id: 1,
          tmdb_movie_id: 550,
          review_text: 'Great movie',
          stars: 5
        }]
      });

      const response = await request(app)
        .post('/movies/550/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ review_text: 'Great movie', stars: 5 });

      expect(response.status).toBe(201);
      expect(response.body.review_id).toBe(1);
      expect(response.body.review_text).toBe('Great movie');
      expect(response.body.stars).toBe(5);
      expect(response.body.username).toBe('test');
      expect(mockQuery.mock.calls[0][1]).toEqual([1, '550', 'Great movie', 5]);
    });

    test('should reject request without token', async () => {
      const response = await request(app)
        .post('/movies/550/reviews')
        .send({ review_text: 'Great movie', stars: 5 });

      expect(response.status).toBe(401);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    test('should reject invalid token', async () => {
      const response = await request(app)
        .post('/movies/550/reviews')
        .set('Authorization', 'Bearer invalid.token')
        .send({ review_text: 'Great movie', stars: 5 });

      expect(response.status).toBe(401);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    test('should reject missing review text', async () => {
      const response = await request(app)
        .post('/movies/550/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ stars: 5 });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Review text is required');
      expect(mockQuery).not.toHaveBeenCalled();
    });

    test('should reject blank review text', async () => {
      const response = await request(app)
        .post('/movies/550/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ review_text: '   ', stars: 5 });

      expect(response.status).toBe(400);
      expect(mockQuery).not.toHaveBeenCalled();
    });

    test.each([0, 6, 3.5, '4', null])('should reject invalid stars: %p', async (stars) => {
      const response = await request(app)
        .post('/movies/550/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ review_text: 'Great movie', stars });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Stars must be between 1 and 5');
      expect(mockQuery).not.toHaveBeenCalled();
    });

    test('should return 500 when database fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('db error'));

      const response = await request(app)
        .post('/movies/550/reviews')
        .set('Authorization', `Bearer ${token}`)
        .send({ review_text: 'Great movie', stars: 5 });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to create review');
    });

  });

});
