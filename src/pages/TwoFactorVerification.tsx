import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Shield } from 'lucide-react';

export default function TwoFactorVerification() {
  const { verifyTwoFactor, sendTwoFactorCode, user, loading, error } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Extract email from location state or use user email
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    } else if (user?.email) {
      setEmail(user.email);
    }
  }, [location.state, user]);

  const handleSendCode = async () => {
    if (email) {
      try {
        await sendTwoFactorCode(email);
        setCodeSent(true);
      } catch (err) {
        // Error is handled by useAuth
      }
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode.trim()) {
      return; // Don't submit if code is empty
    }
    
    try {
      // Use the correct API parameter name as expected by the backend
      await verifyTwoFactor({ code: verificationCode });
      navigate('/');
    } catch (err) {
      // Error is handled by useAuth
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Two-Factor Authentication
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Please verify your identity to continue
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleVerify}>
            {!codeSent ? (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  Click the button below to receive a verification code via email
                </p>
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={loading || !email}
                  className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                    loading || !email 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>
                {!email && (
                  <p className="mt-2 text-xs text-red-600">
                    No email available. Please log in again.
                  </p>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                    Verification Code
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter verification code"
                      autoComplete="one-time-code"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Enter the 6-digit code that was sent to {email}
                  </p>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading || !verificationCode.trim()}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      loading || !verificationCode.trim() 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {loading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    className={`text-sm ${
                      loading 
                        ? 'text-blue-400 cursor-not-allowed' 
                        : 'text-blue-600 hover:text-blue-500'
                    }`}
                  >
                    {loading ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6">
            <div className="flex items-center justify-center">
              <div className="text-xs text-gray-500">
                Not receiving the code? Check your spam folder or try again in a few minutes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}