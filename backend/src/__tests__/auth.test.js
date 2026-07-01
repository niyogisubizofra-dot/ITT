const request = require('supertest');
const app = require('../app');
const { User } = require('../models');

// Mock User model methods to prevent hit to live DB during unit testing
jest.mock('../models', () => {
  const SequelizeMock = require('sequelize');
  return {
    User: {
      findOne: jest.fn(),
      create: jest.fn(),
      findByPk: jest.fn()
    },
    Transaction: {
      create: jest.fn()
    },
    ActivityLog: {
      create: jest.fn()
    },
    sequelize: {
      transaction: () => ({
        commit: jest.fn(),
        rollback: jest.fn(),
        finished: false
      })
    }
  };
});

describe('Authentication API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return tokens', async () => {
      User.findOne.mockResolvedValue(null); // User does not exist
      User.create.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'Client',
        balance: 0.0,
        save: jest.fn().mockResolvedValue(true)
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.username).toBe('testuser');
    });

    it('should fail registration with invalid input schema', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'u', // too short
          email: 'not-an-email',
          password: '12' // too short
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid email and password', async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 10);

      User.findOne.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        role: 'Client',
        balance: 50.0,
        is2FAEnabled: false,
        save: jest.fn().mockResolvedValue(true)
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.username).toBe('testuser');
    });

    it('should return error for invalid credentials', async () => {
      User.findOne.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(400);
      expect(res.body.msg).toBe('Invalid Credentials');
    });
  });
});
