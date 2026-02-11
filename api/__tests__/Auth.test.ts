import { login, register, checkEmail, checkPassword } from '../Auth';
import apiClient from '../APIClient';
import * as Storage from '../../hooks/Storage';

// Mock dependencies
jest.mock('../APIClient');
jest.mock('../Storage');

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockedStorage = Storage as jest.Mocked<typeof Storage>;

describe('Auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully and store tokens', async () => {
      const mockResponse = {
        status: 200,
        data: {
          access: 'access-token',
          refresh: 'refresh-token',
        },
      };

      mockedApiClient.post.mockResolvedValue(mockResponse);
      mockedStorage.storeAccessToken.mockResolvedValue(undefined);
      mockedStorage.storeRefreshToken.mockResolvedValue(undefined);

      const result = await login('test@example.com', 'password123');

      expect(result).toEqual({
        access: 'access-token',
        refresh: 'refresh-token',
      });
      expect(mockedStorage.storeAccessToken).toHaveBeenCalledWith('access-token');
      expect(mockedStorage.storeRefreshToken).toHaveBeenCalledWith('refresh-token');
    });

    it('should return error message on 401', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {
            detail: 'Invalid credentials',
          },
        },
      };

      mockedApiClient.post.mockRejectedValue(mockError);

      const result = await login('test@example.com', 'wrongpassword');

      expect(result).toBe('Invalid credentials');
      expect(mockedStorage.storeAccessToken).not.toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      mockedApiClient.post.mockRejectedValue(new Error('Network error'));

      const result = await login('test@example.com', 'password123');

      expect(result).toBe('Network error');
    });
  });

  describe('register', () => {
    it('should register successfully with all fields', async () => {
      const mockResponse = {
        status: 201,
        data: {
          access: 'access-token',
          refresh: 'refresh-token',
        },
      };

      mockedApiClient.post.mockResolvedValue(mockResponse);
      mockedStorage.storeAccessToken.mockResolvedValue(undefined);
      mockedStorage.storeRefreshToken.mockResolvedValue(undefined);

      const result = await register(
        'test@example.com',
        'password123',
        'male',
        180,
        'Test User'
      );

      expect(result).toEqual({
        access: 'access-token',
        refresh: 'refresh-token',
      });
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          email: 'test@example.com',
          password: 'password123',
          gender: 'male',
          height: 180,
          name: 'Test User',
        })
      );
    });

    it('should register with minimal fields', async () => {
      const mockResponse = {
        status: 201,
        data: {
          access: 'access-token',
          refresh: 'refresh-token',
        },
      };

      mockedApiClient.post.mockResolvedValue(mockResponse);
      mockedStorage.storeAccessToken.mockResolvedValue(undefined);
      mockedStorage.storeRefreshToken.mockResolvedValue(undefined);

      const result = await register('test@example.com', 'password123');

      expect(result).toEqual({
        access: 'access-token',
        refresh: 'refresh-token',
      });
      expect(mockedApiClient.post).toHaveBeenCalledWith(
        expect.any(String),
        {
          email: 'test@example.com',
          password: 'password123',
        }
      );
    });

    it('should return error when tokens are missing', async () => {
      const mockResponse = {
        status: 201,
        data: {},
      };

      mockedApiClient.post.mockResolvedValue(mockResponse);

      const result = await register('test@example.com', 'password123');

      expect(result).toBe('Response missing access or refresh token');
    });
  });

  describe('checkEmail', () => {
    it('should validate email successfully', async () => {
      const mockResponse = {
        data: {
          is_valid: true,
          errors: [],
          user_exists: false,
          security_threats: [],
        },
      };

      mockedApiClient.post.mockResolvedValue(mockResponse);

      const result = await checkEmail('test@example.com');

      expect(result.is_valid).toBe(true);
      expect(result.user_exists).toBe(false);
    });

    it('should handle validation errors', async () => {
      const mockResponse = {
        data: {
          is_valid: false,
          errors: ['Invalid email format'],
          user_exists: false,
          security_threats: [],
        },
      };

      mockedApiClient.post.mockResolvedValue(mockResponse);

      const result = await checkEmail('invalid-email');

      expect(result.is_valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });
  });

  describe('checkPassword', () => {
    it('should validate password strength', async () => {
      const mockResponse = {
        data: {
          is_valid: true,
          errors: [],
          security_threats: [],
          strength_score: 80,
          strength_level: 'strong',
        },
      };

      mockedApiClient.post.mockResolvedValue(mockResponse);

      const result = await checkPassword('StrongPassword123!');

      expect(result.is_valid).toBe(true);
      expect(result.strength_level).toBe('strong');
      expect(result.strength_score).toBe(80);
    });
  });
});
