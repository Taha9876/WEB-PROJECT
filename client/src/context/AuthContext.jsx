import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from profiles table
  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (data) setProfile(data);
    return data;
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, metadata) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: metadata.name || '',
          role: metadata.role || 'user',
        }
      }
    });

    if (error) return { data: null, error };

    // Update profile with additional fields after signup
    if (data.user) {
      const profileUpdate = {
        age: metadata.age ? parseInt(metadata.age) : null,
        weight: metadata.weight ? parseFloat(metadata.weight) : null,
        height: metadata.height ? parseFloat(metadata.height) : null,
      };

      // Wait a moment for the trigger to create the profile first
      await new Promise(resolve => setTimeout(resolve, 1000));

      await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', data.user.id);

      const p = await fetchProfile(data.user.id);
      return { data: { ...data, profile: p }, error: null };
    }

    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { data: null, error };

    if (data.user) {
      const p = await fetchProfile(data.user.id);
      return { data: { ...data, role: p?.role, profile: p }, error: null };
    }
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
    if (data) setProfile(data);
    return { data, error };
  };

  const value = { user, profile, loading, signUp, signIn, signOut, updateProfile, fetchProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
