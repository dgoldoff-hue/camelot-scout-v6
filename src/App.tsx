import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Toaster } from 'react-hot-toast';

// Auth pages
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { ResetPassword } from '@/pages/ResetPassword';

// Main pages
import Dashboard from '@/pages/Dashboard';
import Layout from '@/components/Layout';

// Protected Route Component
interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
          return (
                  <div className="h-screen w-screen flex items-center justify-center bg-camelot-navy">
                          <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>div>
                                    <p className="text-white">Loading...</p>p>
                          </div>div>
                  </div>div>
                );
    }
  
    if (!isAuthenticated) {
          return <Navigate to="/login" replace />;
    }
  
    return <>{children}</>>;
};

export default function App() {
    const { isAuthenticated, isLoading } = useAuth();
  
    // Show loading screen while checking auth state
    if (isLoading) {
          return (
                  <div className="h-screen w-screen flex items-center justify-center bg-camelot-navy">
                          <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>div>
                                    <p className="text-white">Loading...</p>p>
                          </div>div>
                  </div>div>
                );
    }
  
    return (
          <>
        <Toaster position="top-right" />
                <Routes>
                  {/* Auth Routes */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                
                  {/* Protected Routes */}
                        <Route
                                    path="/dashboard"
                                    element={
                                                  <ProtectedRoute>
                                                                <Layout>
                                                                                <Dashboard />
                                                                </Layout>Layout>
                                                  </ProtectedRoute>ProtectedRoute>
                          }
                                />
                        
                          {/* Catch all - redirect to login or dashboard based on auth state */}
                                <Route
                                            path="/"
                                            element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
                                          />
                                <Route path="*" element={<Navigate to="/" replace />} />
                        </Route>Routes>
                </Routes>>
            );
            }</></></div>
