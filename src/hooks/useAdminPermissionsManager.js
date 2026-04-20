import { useState, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

// Centralized list of all available permissions in the system
export const AVAILABLE_PERMISSIONS = [
    { id: 'can_view_data_analysis', label: 'Ver Análise de Dados' },
    { id: 'can_view_validations', label: 'Aceder a Validações' },
    { id: 'can_view_fleets', label: 'Aceder a Frota' },
    { id: 'can_view_organizational', label: 'Aceder a Área Organizacional' },
    { id: 'can_add_worksites', label: 'Adicionar Obras' },
    
    // User Management Granular Permissions
    { id: 'can_manage_users', label: 'Gerir Utilizadores (Legado/Geral)' }, 
    { id: 'can_add_users', label: 'Adicionar Utilizadores' },
    { id: 'can_edit_users', label: 'Editar Utilizadores' },
    { id: 'can_delete_users', label: 'Excluir Utilizadores' },

    // Subcontractor Management Granular Permissions
    { id: 'can_manage_subcontractors', label: 'Gerir Subempreiteiros (Legado/Geral)' },
    { id: 'can_add_subcontractors', label: 'Adicionar Subempreiteiros' },
    { id: 'can_edit_subcontractors', label: 'Editar Subempreiteiros' },
    { id: 'can_delete_subcontractors', label: 'Excluir Subempreiteiros' },
    { id: 'can_manage_subcontractor_docs', label: 'Gerir documentos de subempreiteiros' },
    { id: 'can_register_subcontractor_records', label: 'Efetuar registos de subempreiteiros' },

    // Validation Permissions
    { id: 'can_validate_daily_records', label: 'Validar Registos Diários' },
    { id: 'can_validate_monthly_records', label: 'Validar Registos Mensais' },
    { id: 'can_validate_daily_justifications', label: 'Validar Justificações' },
    { id: 'can_validate_holidays', label: 'Gerir Feriados' },
    { id: 'can_validate_daily_corrections', label: 'Validar Correções Diárias' },
    { id: 'can_validate_monthly_corrections', label: 'Validar Correções Mensais' }
];

export const useAdminPermissionsManager = () => {
    const [loading, setLoading] = useState(false);

    const getAdminPermissions = useCallback(async (adminUserId) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('admin_permissions')
                .select('permission_name, enabled')
                .eq('admin_user_id', adminUserId);

            if (error) throw error;

            const perms = (data || []).reduce((acc, p) => {
                acc[p.permission_name] = p.enabled;
                return acc;
            }, {});
            
            return perms;
        } catch (error) {
            console.error("Error fetching permissions for manager:", error);
            return {};
        } finally {
            setLoading(false);
        }
    }, []);

    const updateAdminPermissions = useCallback(async (adminUserId, permissionsMap) => {
        setLoading(true);
        try {
            const upsertData = Object.entries(permissionsMap).map(([permissionName, enabled]) => ({
                admin_user_id: adminUserId,
                permission_name: permissionName,
                enabled: enabled
            }));

            // We iterate because upserting distinct permissions is safer row by row or batch
            // Supabase upsert requires conflict target
            if (upsertData.length > 0) {
                 const { error } = await supabase
                    .from('admin_permissions')
                    .upsert(upsertData, { onConflict: 'admin_user_id, permission_name' });
                 
                 if (error) throw error;
            }
            return true;
        } catch (error) {
            console.error("Error updating permissions:", error);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        getAdminPermissions,
        updateAdminPermissions,
        allPermissions: AVAILABLE_PERMISSIONS
    };
};