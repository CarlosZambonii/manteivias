import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/customSupabaseClient';
import { useOfflineManager } from '@/contexts/OfflineManager';
import { useAdminPermissions } from '@/hooks/useAdminPermissions'; // Import the new hook

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const offlineManager = useOfflineManager();

  const fetchAndSetUser = useCallback((userProfile) => {
    try {
        if (userProfile) {
            localStorage.setItem('manteivias_user', JSON.stringify(userProfile));
            setUser(userProfile);
        }
    } catch (e) {
        console.error("Error setting user to local storage", e);
    }
  }, []);

  const refreshUserData = useCallback(async (currentUserId) => {
    if (!currentUserId) return null;
    try {
      if (navigator.onLine) {
        const { data, error } = await supabase
            .from('usuarios')
            .select('*')
            .eq('id', currentUserId)
            .single();
        
        if (!error && data) {
            fetchAndSetUser(data);
            return data;
        }
      }
      
      if (offlineManager && offlineManager.getOfflineData) {
          const users = await offlineManager.getOfflineData('usuarios');
          if (users && Array.isArray(users)) {
            const cachedUser = users.find(u => u.id === currentUserId);
            if (cachedUser) {
                setUser(prev => {
                    if (JSON.stringify(prev) !== JSON.stringify(cachedUser)) {
                        return cachedUser;
                    }
                    return prev;
                });
                return cachedUser;
            }
          }
      }
      return null;
    } catch (error) {
      console.warn('Silent error in refreshUserData:', error);
      return null;
    }
  }, [fetchAndSetUser, offlineManager]);

  useEffect(() => {
    const initAuth = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const storedUser = localStorage.getItem('manteivias_user');
            if (storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setUser(parsedUser);
                    if (parsedUser.id) {
                        refreshUserData(parsedUser.id).catch(console.warn);
                    }
                } catch (e) {
                    localStorage.removeItem('manteivias_user');
                }
            } else if (session?.user) {
                const { data: profile } = await supabase
                    .from('usuarios')
                    .select('*')
                    .eq('auth_uuid', session.user.id)
                    .single();
                
                if (profile) {
                    fetchAndSetUser(profile);
                }
            }
        } catch (e) {
            console.error("Auth init error", e);
        } finally {
            setLoading(false);
        }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            setUser(null);
            localStorage.removeItem('manteivias_user');
        }
    });

    return () => {
        subscription.unsubscribe();
    };
  }, [refreshUserData, fetchAndSetUser]);

  const login = async (nif, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('login-user', {
          body: { nif, password }
      });

      if (error || data.error) {
          throw new Error(data.error || error.message);
      }
      
      if (data.session) {
          await supabase.auth.setSession(data.session);
      }

      let userProfile = data.user;
      if (userProfile?.id) {
          const freshProfile = await refreshUserData(userProfile.id);
          userProfile = freshProfile || userProfile;
      }
      
      fetchAndSetUser(userProfile);
      
      if (offlineManager?.syncAll) {
          offlineManager.syncAll().catch(console.warn);
      }

      return userProfile;
      
    } catch (e) {
      console.error('Login error:', e);
      toast({ variant: 'destructive', title: 'Erro de Login', description: e.message || "Erro inesperado." });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    localStorage.removeItem('manteivias_user');
    setUser(null);
    await supabase.auth.signOut();
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((newUserData) => {
    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, ...newUserData };
      localStorage.setItem('manteivias_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const userType = user?.tipo_usuario?.toLowerCase();
  const isReadOnlyAdmin = userType === 'admin_c';
  const isRh = userType === 'rh';
  const isAdminStar = userType === 'admin_star';
  const isAdminSub = userType === 'admin_sub';
  const isEncarregado = userType === 'encarregado';
  const isAdmin = userType === 'admin' || isAdminStar || isReadOnlyAdmin || isAdminSub || isEncarregado;

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isReadOnlyAdmin,
    isRh,
    isAdminStar,
    isAdminSub,
    isEncarregado,
    isAdmin,
    login,
    logout,
    updateUser,
    refreshUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
};

// New wrapper to provide permissions context along with auth
export const AppProviders = ({ children }) => {
    return (
        <AuthProvider>
            <PermissionsProvider>
                {children}
            </PermissionsProvider>
        </AuthProvider>
    );
}

// A simple provider to hold the permissions logic
const PermissionsProvider = ({ children }) => {
    const { user } = useAuth();
    // The useAdminPermissions hook will now work correctly because useAuth() will be available.
    return <>{children}</>;
};