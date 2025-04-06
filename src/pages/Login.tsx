import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { Eye, EyeOff } from 'lucide-react';
import { validatePassword, validateEmail, sanitizeInput, isStrongPassword } from '../utils/validation';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import type { FormSubmitEvent, PasswordRequirements } from '../types/auth';

export default function Login() {
  // Use both auth systems
  const legacyAuth = useAuth();
  const supabaseAuth = useSupabaseAuth();
  
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirements>({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  // Redirect to dashboard if already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      // If authenticated with either system, redirect to dashboard
      if (supabaseAuth.session || legacyAuth.user) {
        navigate('/', { replace: true });
      }
    };
    
    checkAuthStatus();
  }, [supabaseAuth.session, legacyAuth.user, navigate]);

  // Form validation
  const validateForm = useCallback(() => {
    if (!email || !password) {
      setError('All fields are required');
      return false;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (mode === 'register' && !isStrongPassword(passwordRequirements)) {
      setError('Please meet all password requirements');
      return false;
    }
    
    if (mode === 'register') {
      if (!name) {
        setError('Name is required');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    
    return true;
  }, [email, password, name, confirmPassword, mode, passwordRequirements]);

  // Handle password input changes and validate requirements
  const handlePasswordChange = (value: string) => {
    const sanitizedValue = sanitizeInput(value);
    setPassword(sanitizedValue);
    setPasswordRequirements(validatePassword(sanitizedValue));
  };

  // Form submission handler
  const handleSubmit = async (e: FormSubmitEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'register') {
        // Register user with Supabase
        await supabaseAuth.signUp(email, password, name);
        setSuccess('Registration successful! Please check your email to verify your account.');
        setEmail('');
        setPassword('');
        setName('');
        setConfirmPassword('');
      } else {
        // Login user with Supabase
        await supabaseAuth.signIn(email, password);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(mode === 'register' ? 'Registration failed' : 'Invalid credentials');
      }
    }
  };

  // Toggle between login and register modes
  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
  };

  // Handle forgot password link click
  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  // Determine loading state and error message
  const loading = supabaseAuth.loading;
  const errorMessage = error || supabaseAuth.error;

  return (
    <div className="min-h-screen flex">
      {/* Left Column */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-md w-full mx-auto">
          <div className="flex items-center mb-8">
            <img src="/elroi-logo.svg" alt="Elroi" className="h-8 w-auto" />
            <span className="ml-2 text-2xl font-medium">Health</span>
          </div>

          <h2 className="text-3xl font-bold mb-2">{mode === 'login' ? 'Login' : 'Create Account'}</h2>
          
          <p className="text-gray-600 mb-4">
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
            <button onClick={toggleMode} className="text-blue-600 hover:text-blue-700 font-medium">
              {mode === 'login' ? "Get Elroi Now" : "Sign In"}
            </button>
          </p>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {errorMessage && (
              <div className="px-4 py-3 rounded-md text-sm bg-red-50 border border-red-200 text-red-600">
                {errorMessage}
              </div>
            )}
            
            {success && (
              <div className="px-4 py-3 rounded-md text-sm bg-green-50 border border-green-200 text-green-600">
                {success}
              </div>
            )}
            
            {mode === 'register' && (
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-900">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-900">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Forgot your password?
                  </button>
                )}
              </div>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === 'register' ? "new-password" : "current-password"}
                  required
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
              {mode === 'register' && <PasswordStrengthIndicator requirements={passwordRequirements} />}
            </div>

            {mode === 'register' && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-900">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    aria-label="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4 text-gray-500" /> : <Eye className="w-4 h-4 text-gray-500" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember Me
                </label>
              </div>
            )}

            <div>
              <button
                type="submit"
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg text-sm font-medium text-white ${
                  loading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-[#2E3B8C] hover:bg-[#1E2A7B]'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                disabled={loading}
              >
                {loading ? 'Processing...' : mode === 'login' ? 'Log In' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Copyright © 2025 Elroi, LLC. Elroi is a trademark of Elroi, LLC.</p>
            <div className="mt-2 space-x-4">
              <a href="#" className="text-gray-600 hover:text-gray-900">Terms of Service</a>
              <span>|</span>
              <a href="#" className="text-gray-600 hover:text-gray-900">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Column - Background Image */}
      <div className="hidden lg:block lg:w-1/2">
        <img
          className="h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80"
          alt="Healthcare professionals"
        />
      </div>
    </div>
  );
}