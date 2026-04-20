import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';

export function ForgotPassword() {
    const { requestPasswordReset, error, setError } = useAuth();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage('');

        if (!email.trim()) {
                setError('Email is required');
                return;
        }

        setIsLoading(true);
        try {
                const result = await requestPasswordReset(email);
                if (result.error) {
                          setError(result.error);
                } else {
                          setSuccessMessage(
                                      'Password reset link has been sent to your email. Check your inbox and click the link to reset your password.'
                                    );
                          setEmailSent(true);
                          setEmail('');
                }
        } catch (err) {
                setError(err instanceof Error ? err.message : 'Password reset request failed');
        } finally {
                setIsLoading(false);
        }
  };

  return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
              <div className="w-full max-w-md">
                      <div className="bg-white rounded-lg shadow-lg p-8">
                                <div className="text-center mb-8">
                                            <div className="flex justify-center mb-4">
                                                          <Mail className="h-12 w-12 text-blue-600" />
                                            </div>div>
                                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Reset Password</h1>h1>
                                            <p className="text-gray-600">Enter your email to receive a password reset link</p>p>
                                </div>div>
                      
                        {error && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-800 text-sm">{error}</p>p>
                      </div>div>
                                )}
                      
                        {successMessage && (
                      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-green-800 text-sm">{successMessage}</p>p>
                      </div>div>
                                )}
                      
                        {!emailSent ? (
                      <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                                                      Email Address
                                                    </label>label>
                                                    <input
                                                                        id="email"
                                                                        type="email"
                                                                        value={email}
                                                                        onChange={(e) => setEmail(e.target.value)}
                                                                        placeholder="you@example.com"
                                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        disabled={isLoading}
                                                                      />
                                    </div>div>
                      
                                    <button
                                                      type="submit"
                                                      disabled={isLoading}
                                                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                                                    >
                                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                                    </button>button>
                      </form>form>
                    ) : (
                      <div className="space-y-4">
                                    <p className="text-center text-gray-600 text-sm">
                                                    Please check your email inbox (and spam folder) for the password reset link.
                                    </p>p>
                                    <button
                                                      onClick={() => {
                                                                          setEmailSent(false);
                                                                          setSuccessMessage('');
                                                      }}
                                                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition duration-200"
                                                    >
                                                    Send Another Link
                                    </button>button>
                      </div>div>
                                )}
                      
                                <div className="mt-6 text-center">
                                            <p className="text-sm text-gray-600">
                                                          Remember your password?{' '}
                                                          <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                                                                          Sign in here
                                                          </Link>Link>
                                            </p>p>
                                </div>div>
                      </div>div>
              </div>div>
        </div>div>
      );
}

export default ForgotPassword;</div>
