import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MapPin, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const LocationPermissionDialog = ({ open, onOpenChange, onRequestPermission }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGrantPermission = async () => {
    setIsLoading(true);
    try {
      await onRequestPermission();
      toast({
        title: "Localização Ativada",
        description: "Permissão de localização concedida com sucesso.",
        variant: "success",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Permissão Negada",
        description: error.message || "Não foi possível obter a sua localização.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto bg-blue-100 p-3 rounded-full mb-4 w-fit">
            <MapPin className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-center text-xl">Acesso à Localização Necessário</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Para registar o ponto, precisamos de validar se se encontra no local da obra.
            <br/><br/>
            Por favor, permita o acesso à sua localização para continuar.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 my-2 flex gap-3 text-sm text-amber-800">
           <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
           <p>Sem localização, não será possível validar a sua presença na obra.</p>
        </div>

        <DialogFooter className="sm:justify-center gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGrantPermission}
            disabled={isLoading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> A obter localização...
              </>
            ) : (
              "Permitir Acesso"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LocationPermissionDialog;