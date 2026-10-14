import { jest, describe, test, expect, beforeEach, beforeAll } from '@jest/globals';
import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// replace db connetion for the duration of the test
// sql requests
const mockClientQuery = jest.fn(); 
// return connection = release
const mockRelease = jest.fn(); 
// take connection = connect
const mockConnect = jest.fn();

// when code asks for helper/db.js, give a fake one
// no requests to real db
jest.unstable_mockModule('../helper/db.js', () => ({
  pool: {
    query: jest.fn(),
    connect: mockConnect
  }
}));

// router connects later so it receives a fake db
const { default: userRouter } = await import('../routes/userRouter.js');

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use('/users', userRouter);

// errors handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    error: {
      message: err.message
    }
  });
});

// folder for tests
describe('Account deletion', () => {

  let token;
// do once before tests: set the secret, create a token
  beforeAll(() => {
    process.env.JWT_SECRET = 'test_secret';
    token = jwt.sign(
      { userId: 5, email: 'test@example.com' },
      process.env.JWT_SECRET
    );
  });
// do before each test
// clear call history -> test dont affect each other
  beforeEach(() => {
    mockClientQuery.mockReset();
    mockRelease.mockReset();
    mockConnect.mockReset();
    // when pool.connect() is called -> return fake query and release
    mockConnect.mockResolvedValue({
      query: mockClientQuery,
      release: mockRelease
    });
  });

// POSITIVE TESTS
// 1

  test('should delete the account and move data to "deleted user"', async () => {
    mockClientQuery
    // each call of query returns the next answer in this order:
        // Begin
      .mockResolvedValueOnce({ rows: [] })      
        // search for deleted user: db answered with id=99
      .mockResolvedValueOnce({ rows: [{ user_id: 99 }] })    
        // update groups
      .mockResolvedValueOnce({ rows: [] })     
        // update chat                
      .mockResolvedValueOnce({ rows: [] })     
        // update group_movies                
      .mockResolvedValueOnce({ rows: [] })  
        // delete user                  
      .mockResolvedValueOnce({ rows: [] })             
        // Commit     
      .mockResolvedValueOnce({ rows: [] });                 

    // send request = push delete button  
    const response = await request(app)
      .delete('/users/me')
      .set('Authorization', `Bearer ${token}`);

    // expect(what we got).toBe(what we want)
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Account deleted successfully');

    // check if groups from user 5 were given to user 99 (deleted user)
    expect(mockClientQuery).toHaveBeenCalledWith(
      'UPDATE groups SET owner_id = $1 WHERE owner_id = $2',
      [99, 5]
    );
    // check if chat from user 5 was given to user 99 (deleted user)
    expect(mockClientQuery).toHaveBeenCalledWith(
      'UPDATE chat SET user_id = $1 WHERE user_id = $2',
      [99, 5]
    );
    // check if movies added to group from user 5 were given to user 99 (deleted user)
    expect(mockClientQuery).toHaveBeenCalledWith(
      'UPDATE group_movies SET added_by = $1 WHERE added_by = $2',
      [99, 5]
    );
    // check if the user is deleted from db
    expect(mockClientQuery).toHaveBeenCalledWith(
      'DELETE FROM users WHERE user_id = $1',
      [5]
    );

    // check all requests: take only request text
    // then check that the first was BEGIN, COMMIT was called and no ROLLBACK
    const calls = mockClientQuery.mock.calls.map(call => call[0]);
    expect(calls[0]).toBe('BEGIN');
    expect(calls).toContain('COMMIT');
    expect(calls).not.toContain('ROLLBACK');
  });

// 2
  test('should clear the refresh cookie and release the db connection', async () => {
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })                    
      .mockResolvedValueOnce({ rows: [{ user_id: 99 }] })     
      .mockResolvedValueOnce({ rows: [] })                    
      .mockResolvedValueOnce({ rows: [] })                    
      .mockResolvedValueOnce({ rows: [] })                    
      .mockResolvedValueOnce({ rows: [] })                    
      .mockResolvedValueOnce({ rows: [] });                   

    const response = await request(app)
      .delete('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .set('Cookie', 'refreshToken=test-refresh-token');

    expect(response.status).toBe(200);

    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^refreshToken=/)
      ])
    );

    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

// NEGATIVE TESTS
// 1

  test('should reject a request without a token', async () => {
    const response = await request(app).delete('/users/me');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Authentication required');
    expect(mockConnect).not.toHaveBeenCalled();
    expect(mockClientQuery).not.toHaveBeenCalled();
  });

// 2
  test('should reject an invalid token', async () => {
    const response = await request(app)
      .delete('/users/me')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Invalid or expired token');
    expect(mockConnect).not.toHaveBeenCalled();
    expect(mockClientQuery).not.toHaveBeenCalled();
  });

// 3

  test('should roll back and return 500 when the database fails', async () => {
    mockClientQuery
      .mockResolvedValueOnce({ rows: [] })                    
      .mockResolvedValueOnce({ rows: [{ user_id: 99 }] })     
      .mockRejectedValueOnce(new Error('Database error'))     
      .mockResolvedValueOnce({ rows: [] });                   

    const response = await request(app)
      .delete('/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.error.message).toBe('Database error');

    const calls = mockClientQuery.mock.calls.map(call => call[0]);
    expect(calls).toContain('ROLLBACK');
    expect(calls).not.toContain('COMMIT');
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(mockRelease).toHaveBeenCalledTimes(1);
  });

});