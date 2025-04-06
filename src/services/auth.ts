import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
  UpdateProfileCredentials,
  UpdatePasswordCredentials,
  NotificationSettings,
  EmailVerificationCredentials,
  TwoFactorVerifyCredentials
} from '../types/auth';
import { api } from './api';

export const authService = {
  // Register new user
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('register', credentials);
    return response;
  },

  // Resend verification email with rate limiting
  async resendVerification(email: string): Promise<void> {
    // Check if we've sent too many emails recently
    const lastAttempt = localStorage.getItem(`verification_${email}`);
    const cooldownPeriod = 60000; // 1 minute cooldown

    if (lastAttempt) {
      const timeSinceLastAttempt = Date.now() - parseInt(lastAttempt);
      if (timeSinceLastAttempt < cooldownPeriod) {
        throw new Error('Please wait a minute before requesting another verification email.');
      }
    }

    await api.post('send-Verify-email', { email });
    
    // Store the timestamp of this attempt
    localStorage.setItem(`verification_${email}`, Date.now().toString());
  },

  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('login', credentials);
    
    // Store the token
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    
    return response;
  },

  // Forgot password request
  async forgotPassword(email: string): Promise<void> {
    await api.post('forgot-password', { email });
  },

  async verifyForgotPassword(credentials: EmailVerificationCredentials): Promise<void> {
    await api.post('forgot-password-verify', credentials);
  },

  async verifyTwoFactor(credentials: TwoFactorVerifyCredentials): Promise<void> {
    await api.post('two-factor-verify-code', credentials);
  },

  async sendTwoFactorCode(email: string): Promise<void> {
    await api.post('send-2facode', { email });
  },

  async resetPassword(credentials: { password: string; email: string }): Promise<void> {
    await api.post('reset-password', credentials);
  },

  async logout(): Promise<void> {
    await api.get('logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>('me');
    localStorage.setItem('user', JSON.stringify(response));
    return response;
  },

  async updateProfile(credentials: UpdateProfileCredentials): Promise<User> {
    const response = await api.post<User>('profile', credentials);
    return response;
  },

  async updatePassword(credentials: UpdatePasswordCredentials): Promise<void> {
    await api.post('update-password', credentials);
  },

  async getNotificationSettings(): Promise<NotificationSettings> {
    const response = await api.get<NotificationSettings>('user-notification-settings');
    return response;
  },

  async updateNotificationSettings(settings: NotificationSettings): Promise<void> {
    await api.post('user-notification-settings', settings);
  }
};