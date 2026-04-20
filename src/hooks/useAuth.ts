import { useState, useCallback, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: string;
    initials: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CurrentUser {
    id: string;
    email: string;
    user_metadata?: {
      name?: string;
    };
}

export function useAuth() {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
        const init = async () => {
                try {
                          if (isSupabaseConfigured()) {
                                      // Check for existing session
                            const { data: { session } } = await supabase.auth.getSession();
                                      if (session) {
                                                    setCurrentUser({
                                                                    id: session.user.id,
                                                                    email: session.user.email || '',
                                                                    user_metadata: session.user.user_metadata
                                                    });
                                                    setIsAuthenticated(true);
                                      }
                          }
                } catch (err) {
                          console.error('Auth init error:', err);
                } finally {
                          setIsLoading(false);
                }
        };

                init();

                // Listen for auth changes
                if (isSupabaseConfigured()) {
                        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                                  if (session) {
                                              setCurrentUser({
                                                            id: session.user.id,
                                                            email: session.user.email || '',
                                                            user_metadata: session.user.user_metadata
                                              });
                                              setIsAuthenticated(true);
                                  } else {
                                              setCurrentUser(null);
                                              setIsAuthenticated(false);
                                  }
                        });

          return () => subscription?.unsubscribe();
                }
  }, []);

  // Register new user
  const register = useCallback(async (email: string, password: string, name?: string) => {
        setError(null);
        try {
                if (!isSupabaseConfigured()) {
                          throw new Error('Authentication not configured');
                }

          const { data, error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                                data: {
                                              name: name || email.split('@')[0]
                                }
                    }
          });

          if (signUpError) throw signUpError;

          return { user: data.user, error: null };
        } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Registration failed';
                setError(errorMessage);
                return { user: null, error: errorMessage };
        }
  }, []);

  // Sign in with email and password
  const signin = useCallback(async (email: string, password: string) => {
        setError(null);
        try {
                if (!isSupabaseConfigured()) {
                          throw new Error('Authentication not configured');
                }

          const { data, error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password
          });

          if (signInError) throw signInError;

          if (data.session) {
                    setCurrentUser({
                                id: data.user.id,
                                email: data.user.email || '',
                                user_metadata: data.user.user_metadata
                    });
                    setIsAuthenticated(true);
          }

          return { user: data.user, error: null };
        } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
                setError(errorMessage);
                return { user: null, error: errorMessage };
        }
  }, []);

  // Request password reset
  const requestPasswordReset = useCallback(async (email: string) => {
        setError(null);
        try {
                if (!isSupabaseConfigured()) {
                          throw new Error('Authentication not configured');
                }

          const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/#/reset-password`
          });

          if (resetError) throw resetError;

          return { success: true, error: null };
        } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Password reset request failed';
                setError(errorMessage);
                return { success: false, error: errorMessage };
        }
  }, []);

  // Reset password with token
  const resetPassword = useCallback(async (newPassword: string) => {
        setError(null);
        try {
                if (!isSupabaseConfigured()) {
                          throw new Error('Authentication not configured');
                }

          const { error: updateError } = await supabase.auth.updateUser({
                    password: newPassword
          });

          if (updateError) throw updateError;

          return { success: true, error: null };
        } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Password reset failed';
                setError(errorMessage);
                return { success: false, error: errorMessage };
        }
  }, []);

  // Sign out
  const signout = useCallback(async () => {
        setError(null);
        try {
                const { error: signOutError } = await supabase.auth.signOut();
                if (signOutError) throw signOutError;

          setCurrentUser(null);
                setIsAuthenticated(false);
                return { error: null };
        } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Sign out failed';
                setError(errorMessage);
                return { error: errorMessage };
        }
  }, []);

  return {
        currentUser,
        members,
        isAuthenticated,
        isLoading,
        error,
        register,
        signin,
        requestPasswordReset,
        resetPassword,
        signout,
        setError
  };
}
