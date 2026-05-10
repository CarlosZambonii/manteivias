import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { MANAGED_ADMIN_TYPES } from '@/hooks/useAdminPermissionsManager';

export const useAdminPermissions = () => {
    const { user, isAdminStar } = useAuth();
    const [permissions, setPermissions] = useState({});
    const [loading, setLoading] = useState(true);
    const channelRef = useRef(null);

    const fetchPermissions = useCallback(async () => {
        if (!user) {
            setPermissions({});
            setLoading(false);
            return;
        }

        // Admin Star always has all permissions implicitly
        if (isAdminStar) {
            setPermissions({}); // Or a specific object indicating all? 
            // Better to handle isAdminStar in the check functions.
            setLoading(false);
            return;
        }

        // Only managed admin types need permissions checked against DB
        if (!MANAGED_ADMIN_TYPES.includes(user.tipo_usuario)) {
             setPermissions({});
             setLoading(false);
             return;
        }
        
        setLoading(true);
        const { data, error } = await supabase
            .from('admin_permissions')
            .select('permission_name, enabled')
            .eq('admin_user_id', user.id);

        if (error) {
            console.error('Error fetching admin permissions:', error);
            setPermissions({});
        } else {
            const perms = (data || []).reduce((acc, p) => {
                acc[p.permission_name] = p.enabled;
                return acc;
            }, {});
            setPermissions(perms);
        }
        setLoading(false);
    }, [user, isAdminStar]);

    useEffect(() => {
        fetchPermissions();

        if (user && MANAGED_ADMIN_TYPES.includes(user.tipo_usuario)) {
            // Subscribe to changes for this user's permissions
            channelRef.current = supabase
                .channel(`admin_permissions:${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'admin_permissions',
                        filter: `admin_user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        // Optimistic update or refetch
                        // Since payload gives us the changed row, we can update state directly
                        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                            setPermissions(prev => ({
                                ...prev,
                                [payload.new.permission_name]: payload.new.enabled
                            }));
                        } else if (payload.eventType === 'DELETE') {
                             setPermissions(prev => {
                                 const newPerms = { ...prev };
                                 // We might not have permission_name in old record for delete sometimes depending on replica identity
                                 // Safest to refetch or assume we iterate keys. 
                                 // For now, simpler to refetch to ensure consistency on delete
                                 fetchPermissions(); 
                                 return newPerms;
                             });
                        }
                    }
                )
                .subscribe();
        }

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [user, isAdminStar, fetchPermissions]);
    
    // Check if user has a specific permission
    const hasPermission = (permissionName) => {
        if (!user) return false;
        if (isAdminStar) return true;
        if (!MANAGED_ADMIN_TYPES.includes(user.tipo_usuario)) return false;

        return !!permissions[permissionName];
    };

    // Check if user has ANY of the permissions in the provided array
    const hasAnyPermission = (permissionNames = []) => {
        if (!user) return false;
        if (isAdminStar) return true;
        if (user.tipo_usuario !== 'admin') return false;

        if (!Array.isArray(permissionNames) || permissionNames.length === 0) return false;

        return permissionNames.some(name => !!permissions[name]);
    };

    // Check if user has ALL of the permissions in the provided array
    const hasAllPermissions = (permissionNames = []) => {
        if (!user) return false;
        if (isAdminStar) return true;
        if (user.tipo_usuario !== 'admin') return false;

        if (!Array.isArray(permissionNames) || permissionNames.length === 0) return false;

        return permissionNames.every(name => !!permissions[name]);
    };

    return { 
        hasPermission, 
        hasAnyPermission,
        hasAllPermissions,
        loading, 
        permissions 
    };
};