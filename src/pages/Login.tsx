import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { AlertCircle, LogIn } from 'lucide-react';

export function Login() {
    const navigate = useNavigate();
    const { signin, error, setError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!email.trim() || !password.trim()) {
                setError('Email and password are required');
                return;
        }

        setIsLoading(true);
        try {
                const result = await signin(email, password);
                if (result.error) {
                          setError(result.error);
                } else {
                          navigate('/dashboard');
                }
        } catch (err) {
                setError(err instanceof Error ? err.message : 'Sign in failed');
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
                                                          <LogIn className="h-12 w-12 text-blue-600" />
                                            </div>div>
                                            <h1 className="text-3xl font-bold text-gray-800 mb-2">Sign In</h1>h1>
                                            <p className="text-gray-600">Enter your credentials to access Scout</p>p>
                                </div>div>
                      
                        {error && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-800 text-sm">{error}</p>p>
                      </div>div>
                                )}
                      
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
                                                                            placeholder="you@camelot.nyc"
                                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                            disabled={isLoading}
                                                                          />
                                            </div>div>
                                
                                            <div>
                                                          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                                                          Password
                                                          </label>label>
                                                          <input
                                                                            id="password"
                                                                            type="password"
                                                                            value={password}
                                                                            onChange={(e) => setPassword(e.target.value)}
                                                                            placeholder="••••••••"
                                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                            disabled={isLoading}
                                                                          />
                                            </div>div>
                                
                                            <button
                                                            type="submit"
                                                            disabled={isLoading}
                                                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                                                          >
                                              {isLoading ? 'Signing in...' : 'Sign In'}
                                            </button>button>
                                </form>form>
                      
                                <div className="mt-6 space-y-3 text-sm text-center">
                                            <div>
                                                          <p className="text-gray-600">
                                                                          Don't have an account?{' '}
                                                                          <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                                                                                            Sign up here
                                                                          </Link>Link>
                                                          </p>p>
                                            </div>div>
                                            <div>
                                                          <p className="text-gray-600">
                                                                          <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                                                                                            Forgot your password?
                                                                          </Link>Link>
                                                          </p>p>
                                            </div>div>
                                </div>div>
                      </div>div>
              </div>div>
        </div>div>
      );
}

export default Login;</div>
