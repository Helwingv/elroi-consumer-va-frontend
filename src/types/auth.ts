// Form Events
export interface FormSubmitEvent extends React.FormEvent<HTMLFormElement> {
  preventDefault: () => void;
}

// User type
export interface User {
  id: string;
  email: string;
  name: string;
  tenant: string;
  isEmailVerified: boolean;
  phone?: string;
  twoFactorEnabled?: boolean;
}

// Password validation
export interface PasswordRequirements {
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

// Error types
export interface AuthError extends Error {
  code?: string;
  status?: number;
}

// Credentials interfaces
export interface LoginCredentials {
  email: string;
  password: string;
  redirectTo?: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  redirectTo?: string;
}

export interface EmailVerificationCredentials {
  email: string;
  verification_code: string;
}

export interface ResetPasswordCredentials {
  email: string;
  password: string;
}

export interface TwoFactorVerifyCredentials {
  verification_code: string;
}

export interface UpdateProfileCredentials {
  name?: string;
  email?: string;
  phone?: string;
}

export interface UpdatePasswordCredentials {
  current_password: string;
  new_password: string;
}

export interface NotificationSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}