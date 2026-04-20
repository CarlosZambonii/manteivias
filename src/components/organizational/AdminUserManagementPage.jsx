import React from 'react';
import UserDataTable from '@/components/organizational/UserDataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { ShieldAlert, Loader2 } from 'lucide-react';

const AdminUserManagementPage = () => {
  const { hasAnyPermission, loading: permissionsLoading } = useAdminPermissions();

  const canManageUsers = hasAnyPermission([
      'can_add_users', 
      'can_edit_users', 
      'can_delete_users',
      'can_manage_users' // Include legacy permission for backward compatibility
  ]);

  if (permissionsLoading) {
      return (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  if (!canManageUsers) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">
        <ShieldAlert className="h-12 w-12 mb-4 text-destructive" />
        <h2 className="text-xl font-semibold text-foreground">Acesso Restrito</h2>
        <p className="max-w-md mx-auto mt-2">
            Não tem permissão para gerir utilizadores internos. Contacte um administrador STAR se necessitar de acesso.
        </p>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Gestão de Utilizadores Internos</CardTitle>
        <CardDescription>
          Gerir utilizadores da empresa Manteivias. Adicionar, editar ou remover acessos.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {/* Changed filter logic: Exclude 'subempreiteiro' role to accurately show internal users, while passing 'Manteivias' as filterCompany so new blank ones show up */}
        <UserDataTable filterCompany="Manteivias" filterMode="include" excludeRole="subempreiteiro" />
      </CardContent>
    </Card>
  );
};

export default AdminUserManagementPage;