import { ApiResponse, User } from '../types';
import { simulateDelay, mockResponse } from './client';
import { mockUser } from '../data/mockUser';

interface LoginRequest {
  phone: string;
}

interface VerifyOTPRequest {
  phone: string;
  otp: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

// Mock OTP for development
const MOCK_OTP = '123456';

export const authApi = {
  /** Send OTP to phone number */
  sendOTP: async (request: LoginRequest): Promise<ApiResponse<{ sent: boolean }>> => {
    await simulateDelay(800);
    // Simulate OTP sending
    console.log(`[Mock] OTP sent to ${request.phone}: ${MOCK_OTP}`);
    return mockResponse({ sent: true });
  },

  /** Verify OTP and login */
  verifyOTP: async (request: VerifyOTPRequest): Promise<ApiResponse<AuthResponse>> => {
    await simulateDelay(1000);
    if (request.otp === MOCK_OTP) {
      return mockResponse({
        user: mockUser,
        token: 'mock_jwt_token_' + Date.now(),
      });
    }
    return {
      data: { user: mockUser, token: '' },
      success: false,
      error: 'Invalid OTP. Please try again.',
    };
  },

  /** Logout */
  logout: async (): Promise<ApiResponse<null>> => {
    await simulateDelay(300);
    return mockResponse(null);
  },

  /** Refresh token */
  refreshToken: async (token: string): Promise<ApiResponse<{ token: string }>> => {
    await simulateDelay(500);
    return mockResponse({ token: 'refreshed_mock_token_' + Date.now() });
  },
};
