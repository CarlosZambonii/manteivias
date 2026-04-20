import React from 'react';
import SubcontractorDataTable from '@/components/organizational/SubcontractorDataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { ShieldAlert, Loader2 } from 'lucide-react';

const AdminSubcontractorManagementPage = () => {
  const { hasAnyPermission, loading: permissionsLoading } = useAdminPermissions();

  const canManageSubcontractors = hasAnyPermission([
      'can_add_subcontractors',
      'can_edit_subcontractors',
      'can_delete_subcontractors',
      'can_manage_subcontractors' // Include legacy/general permission
  ]);

  if (permissionsLoading) {
      return (
          <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  if (!canManageSubcontractors) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/10 rounded-lg border-2 border-dashed">
        <ShieldAlert className="h-12 w-12 mb-4 text-destructive" />
        <h2 className="text-xl font-semibold text-foreground">Acesso Restrito</h2>
        <p className="max-w-md mx-auto mt-2">
            Não tem permissão para gerir subempreiteiros. Contacte um administrador STAR se necessitar de acesso.
        </p>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Gestão de Subempreiteiros</CardTitle>
        <CardDescription>
          Gerir empresas externas e colaboradores subcontratados.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <SubcontractorDataTable />
      </CardContent>
    </Card>
  );
};

export default AdminSubcontractorManagementPage;