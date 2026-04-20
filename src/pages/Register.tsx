import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { AlertCircle, CheckCircle } from 'lucide-react';

export function Register() {
    const navigate = useNavigate();
    const { register, error, setError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setError(null);
          setSuccessMessage('');

          // Validation
          if (!email.trim()) {
                  setError('Email is required');
                  return;
                }

          if (!password.trim()) {
                  setError('Password is required');
                  return;
                }

          if (password.length < 8) {
                  setError('Password must be at least 8 characters');
                  return;
                }

          if (password !== confirmPassword) {
                  setError('Passwords do not match');
                  return;
                }

          // Check if email is from Camelot domain
          if (!email.includes('@camelot.nyc')) {
                  setError('You must use a @camelot.nyc email address');
                  return;
                }

          setIsLoading(true);
          try {
                  const result = await register(email, password, name);
                  if (result.error) {
                            setError(result.error);
                          } else {
                            setSuccessMessage('Account created! Please check your email to confirm your account, then you can sign in.');
                            setTimeout(() => navigate('/login'), 3000);
                          }
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Registration failed');
                } finally {
                  setIsLoading(false);
                }
        };

    return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">Scout</h1>
                  <p className="text-gray-600">Create your account</p>
                </div>

                {error && (
                              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-red-800 text-sm">{error}</p>
                              </div>
                            )}

                {successMessage && (
                              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <p className="text-green-800 text-sm">{successMessage}</p>
                              </div>
                            )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name (Optional)
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@camelot.nyc"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500 mt-1">Must be a @camelot.nyc email address</p>
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="te
