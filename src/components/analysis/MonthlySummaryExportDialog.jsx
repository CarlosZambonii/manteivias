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
    import { Loader2, FileText, HardHat } from 'lucide-react';

    const MonthlySummaryExportDialog = ({ isOpen, onClose, onExportWorks, onExportJustification, isLoading }) => {
      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exportar Resumo Mensal Pessoal</DialogTitle>
              <DialogDescription>
                Selecione o tipo de resumo que deseja exportar.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-center pt-4 flex-col sm:flex-row gap-2">
              <Button onClick={onExportWorks} disabled={isLoading} variant="default">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <HardHat className="mr-2 h-4 w-4" />}
                Pessoal Obras
              </Button>
              <Button onClick={onExportJustification} disabled={isLoading} variant="secondary">
                 {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                Pessoal Justificações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
    };

    export default MonthlySummaryExportDialog;