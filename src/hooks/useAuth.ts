import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useTeamStore } from '@/lib/store';
import type { TeamMember } from '@/types';

// Default team for demo mode
const DEFAULT_USER: TeamMember = {
  id: '1',
  name: 'David Goldoff',
  email: 'dgoldoff@camelot.nyc',
  role: 'owner',
  initials: 'DG',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEFAULT_TEAM: TeamMember[] = [
  DEFAULT_USER,
  { id: '2', name: 'Sam Lodge', email: 'sam@camelot.nyc', role: 'tech_lead', initials: 'SL', is_active: true, created_at: '', updated_at: '' },
  { id: '3', name: 'Carl', email: 'carl@camelot.nyc', role: 'cold_caller', initials: 'CA', is_active: true, created_at: '', updated_at: '' },
  { id: '4', name: 'Luigi', email: 'luigi@camelot.nyc', role: 'operations', initials: 'LU', is_active: true, created_at: '', updated_at: '' },
  { id: '5', name: 'Jake', email: 'jake@camelot.nyc', role: 'team', initials: 'JK', is_active: true, created_at: '', updated_at: '' },
  { id: '6', name: 'Valerie', email: 'valerie@camelot.nyc', role: 'team', initials: 'VA', is_active: true, created_at: '', updated_at: '' },
  { id: '7', name: 'Spencer', email: 'spencer@camelot.nyc', role: 'team', initials: 'SP', is_active: true, created_at: '', updated_at: '' },
  { id: '8', name: 'Danielle', email: 'danielle@camelot.nyc', role: 'team', initials: 'DA', is_active: true, created_at: '', updated_at: '' },
  { id: '9', name: 'Merlin', email: 'merlin@camelot.nyc', role: 'tech_lead', initials: 'ME', is_active: true, created_at: '', updated_at: '' },
];

export function useAuth() {
  const { currentUser, setCurrentUser, members, setMembers } = useTeamStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!isSupabaseConfigured()) {
        // Demo mode
        setCurrentUser(DEFAULT_USER);
        setMembers(DEFAULT_TEAM);
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsAuthenticated(true);
          // Load team members
          const { data: team } = await supabase
            .from('scout_team')
            .select('*')
            .eq('is_active', true);
          if (team) {
            setMembers(team);
            const user = team.find((m) => m.user_id === session.user.id) || team[0];
            setCurrentUser(user);
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
        // Fallback to demo mode
        setCurrentUser(DEFAULT_USER);
        setMembers(DEFAULT_TEAM);
        setIsAuthenticated(true);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    if (isSupabaseConfigured()) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setIsAuthenticated(!!session);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      setCurrentUser(DEFAULT_USER);
      setIsAuthenticated(true);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
    setCurrentUser(null);
  }, []);

  return {
    currentUser,
    members,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
  };
}
