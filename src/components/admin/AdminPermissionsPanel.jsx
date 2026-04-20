import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdminPermissionsManager } from '@/hooks/useAdminPermissionsManager';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

const AdminPermissionsPanel = ({ admin, isOpen, onOpenChange }) => {
  const { loading: managerLoading, getAdminPermissions, updateAdminPermissions, allPermissions } = useAdminPermissionsManager();
  const [permissions, setPermissions] = useState({});
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (isOpen && admin) {
      setIsFetching(true);
      getAdminPermissions(admin.id).then(perms => {
        setPermissions(perms);
        setIsFetching(false);
      });
    }
  }, [admin, isOpen, getAdminPermissions]);

  const handlePermissionChange = (permissionId, checked) => {
    setPermissions(prev => ({ ...prev, [permissionId]: checked }));
  };

  const handleSave = async () => {
    const success = await updateAdminPermissions(admin.id, permissions);
    if (success) {
      onOpenChange(false);
    }
  };

  if (!admin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerir Permissões de Administrador</DialogTitle>
          <DialogDescription>
            Controle o acesso de <span className="font-semibold">{admin.nome}</span> às funcionalidades da plataforma.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden py-4">
            {isFetching ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 14 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-3/4" />
                    </div>
                ))}
                </div>
            ) : (
                <ScrollArea className="h-full pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        {allPermissions.map(p => (
                            <div key={p.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded-md transition-colors">
                                <Checkbox
                                    id={p.id}
                                    checked={permissions[p.id] || false}
                                    onCheckedChange={(checked) => handlePermissionChange(p.id, checked)}
                                />
                                <Label htmlFor={p.id} className="text-sm font-normal cursor-pointer flex-grow select-none">
                                    {p.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            )}
        </div>

        <DialogFooter className="mt-auto pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={managerLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={managerLoading || isFetching}>
            {managerLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Permissões'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPermissionsPanel;