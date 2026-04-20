import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function ResetPassword() {
    const navigate = useNavigate();
    const { resetPassword, error, setError } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isValidToken, setIsValidToken] = useState(true);
    const [checkingToken, setCheckingToken] = useState(true);

    useEffect(() => {
          const checkToken = async () => {
                  try {
                            const { data: { session } } = await supabase.auth.getSession();
                            if (!session) {
                                        setIsValidToken(false);
                                        setError('Invalid or expired password reset link. Please request a new one.');
                                      }
                          } catch (err) {
                            setIsValidToken(false);
                            setError('Error validating reset link');
                          } finally {
                            setCheckingToken(false);
                          }
                };

          checkToken();
        }, [setError]);

    const handleSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          setError(null);
          setSuccessMessage('');

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

          setIsLoading(true);
          try {
                  const result = await resetPassword(password);
                  if (result.error) {
                            setError(result.error);
                          } else {
                            setSuccessMessage('Password reset successfully! Redirecting to login...');
                            setTimeout(() => {
                                        supabase.auth.signOut();
                                        navigate('/login');
                                      }, 2000);
                          }
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Password reset failed');
                } finally {
                  setIsLoading(false);
                }
        };

    if (checkingToken) {
          return (
                  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                    <div className="w-full max-w-md">
                      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                        <p className="text-gray-600">Validating reset link...</p>
                      </div>
                    </div>
                  </div>
                );
        }

    if (!isValidToken) {
          return (
                  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                    <div className="w-full max-w-md">
                      <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="text-center mb-8">
                          <div className="flex justify-center mb-4">
                            <AlertCircle className="h-12 w-12 text-red-600" />
                          </div>
                          <h1 className="text-2xl font-bold text-gray-800 mb-2">Invalid Link</h1>
                        </div>

                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                          <p className="text-red-800 text-sm">{error}</p>
                        </div>

                        <button
                          onClick={() => navigate('/forgot-password')}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                        >
                          Request New Reset Link
                        </button>
                      </div>
                    </div>
                  </div>
                );
        }

    return (
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                  <div className="flex justify-center mb-4">
                    <Lock className="h-12 w-12 text-blue-600" />
                  </div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Password</h1>
                  <p className="text-gray-600">Enter your new password below</p>
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
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
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
       
