import React from 'react';
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      DialogFooter,
    } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Loader2 } from 'lucide-react';

    const FiscalizationExportDialog = ({ isOpen, onClose, onExportWithAV, onExportWithoutAV, isLoading }) => {
      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exportar Folha de Ponto (Fiscalização)</DialogTitle>
              <DialogDescription>
                Deseja incluir a coluna "AV" no seu relatório?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center pt-4">
              <Button onClick={onExportWithAV} disabled={isLoading} variant="default">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Com AV
              </Button>
              <Button onClick={onExportWithoutAV} disabled={isLoading} variant="secondary">
                 {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sem AV
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };

    export default FiscalizationExportDialog;