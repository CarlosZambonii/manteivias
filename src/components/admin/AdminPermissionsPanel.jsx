import React, { useState, useEffect } from 'react';
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
  const { loading: managerLoading, getAdminPermissions, updateAdminPermissions, permissionGroups } = useAdminPermissionsManager();
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

  const handleGroupToggle = (group) => {
    const allEnabled = group.permissions.every(p => permissions[p.id]);
    const next = !allEnabled;
    setPermissions(prev => {
      const updated = { ...prev };
      group.permissions.forEach(p => { updated[p.id] = next; });
      return updated;
    });
  };

  const handleSave = async () => {
    const success = await updateAdminPermissions(admin.id, permissions);
    if (success) onOpenChange(false);
  };

  if (!admin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerir Permissões</DialogTitle>
          <DialogDescription>
            Controle o acesso de <span className="font-semibold">{admin.nome}</span> às funcionalidades da plataforma.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-2">
          {isFetching ? (
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <div className="grid grid-cols-2 gap-3 pl-2">
                    {[1, 2, 3, 4].map(j => (
                      <div key={j} className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="space-y-6">
                {permissionGroups.map(group => {
                  const allEnabled = group.permissions.every(p => permissions[p.id]);
                  const someEnabled = !allEnabled && group.permissions.some(p => permissions[p.id]);

                  return (
                    <div key={group.id}>
                      {/* Group header */}
                      <div className="flex items-center gap-3 mb-3 pb-1.5 border-b border-border/60">
                        <Checkbox
                          id={`group-${group.id}`}
                          checked={allEnabled}
                          data-state={someEnabled ? 'indeterminate' : undefined}
                          onCheckedChange={() => handleGroupToggle(group)}
                          className={someEnabled ? 'opacity-70' : ''}
                        />
                        <Label
                          htmlFor={`group-${group.id}`}
                          className="text-sm font-semibold text-foreground cursor-pointer select-none"
                        >
                          {group.label}
                        </Label>
                      </div>

                      {/* Group permissions */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 pl-2">
                        {group.permissions.map(p => (
                          <div
                            key={p.id}
                            className="flex items-center gap-2.5 p-1.5 hover:bg-muted/50 rounded-md transition-colors"
                          >
                            <Checkbox
                              id={p.id}
                              checked={permissions[p.id] || false}
                              onCheckedChange={(checked) => handlePermissionChange(p.id, checked)}
                            />
                            <Label
                              htmlFor={p.id}
                              className="text-sm font-normal cursor-pointer flex-grow select-none"
                            >
                              {p.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="mt-auto pt-3 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={managerLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={managerLoading || isFetching}>
            {managerLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A guardar...
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
