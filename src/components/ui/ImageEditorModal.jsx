import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageEditor from './ImageEditor';
import { useImageEditor } from '@/hooks/useImageEditor';
import { Loader2, Save, X, Image as ImageIcon } from 'lucide-react';

const ImageEditorModal = ({ isOpen, onClose, imageSrc, onSave, fileName = "image" }) => {
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [rotation, setRotation] = useState(0); 
  const { generateOutput, loading } = useImageEditor();
  const [previewBlob, setPreviewBlob] = useState(null);
  const [activeTab, setActiveTab] = useState("edit");
  const [generatingPreview, setGeneratingPreview] = useState(false);

  // Reset state when opening new image
  useEffect(() => {
    if (isOpen) {
      setPreviewBlob(null);
      setActiveTab("edit");
      setRotation(0);
      setGeneratingPreview(false);
    }
  }, [isOpen, imageSrc]);

  const handleCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handlePreview = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    
    setGeneratingPreview(true);
    try {
      const blob = await generateOutput(imageSrc, croppedAreaPixels, rotation);
      
      // Clean up previous preview URL to avoid memory leaks
      if (previewBlob) {
        URL.revokeObjectURL(previewBlob);
      }
      
      const previewUrl = URL.createObjectURL(blob);
      setPreviewBlob(previewUrl);
    } catch (e) {
      console.error("Error generating preview:", e);
      // Fallback or error handling could go here
    } finally {
      setGeneratingPreview(false);
    }
  };

  const onTabChange = (value) => {
    setActiveTab(value);
    if (value === 'preview') {
      handlePreview();
    }
  };

  const onSaveClick = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const blob = await generateOutput(imageSrc, croppedAreaPixels, rotation);
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      onSave(file);
      // Clean up acts as closure, but we can do it explicitly if needed
      if (previewBlob) {
        URL.revokeObjectURL(previewBlob);
      }
    } catch (e) {
      console.error(e);
    }
  };
  
  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewBlob) {
        URL.revokeObjectURL(previewBlob);
      }
    };
  }, [previewBlob]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            onClose();
            if (previewBlob) {
                URL.revokeObjectURL(previewBlob); 
            }
        }
    }}>
      <DialogContent className="max-w-[95vw] sm:max-w-[440px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-lg">
        <DialogHeader className="px-3.5 py-2.5 shrink-0 border-b">
          <DialogTitle className="flex items-center gap-1.5 text-sm">
            <ImageIcon className="w-4 h-4" /> Editor
          </DialogTitle>
          <DialogDescription className="sr-only">
            Editor de imagem compacto
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-2.5 min-h-0">
           <Tabs value={activeTab} onValueChange={onTabChange} className="w-full h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-2 h-7">
              <TabsTrigger value="edit" className="text-xs h-5.5 px-1">Editar</TabsTrigger>
              <TabsTrigger value="preview" className="text-xs h-5.5 px-1">Pré-visualizar</TabsTrigger>
            </TabsList>
            
            <TabsContent value="edit" className="flex-1 mt-0 flex flex-col min-h-0">
               <div className="flex-1 min-h-0 relative">
                 <ImageEditor 
                    imageSrc={imageSrc} 
                    onCropComplete={handleCropComplete}
                    exposedRotation={rotation}
                    onExposedRotationChange={setRotation}
                 />
               </div>
            </TabsContent>
            
            <TabsContent value="preview" className="flex-1 mt-0 flex items-center justify-center bg-slate-900 rounded-lg min-h-[165px] relative overflow-hidden">
              {generatingPreview ? (
                 <div className="flex flex-col items-center gap-2 text-muted-foreground z-10 text-[10px]">
                   <Loader2 className="w-5 h-5 animate-spin" />
                   <span>Gerando...</span>
                </div>
              ) : previewBlob ? (
                <img src={previewBlob} alt="Preview" className="w-full h-full object-contain absolute inset-0 p-2" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground z-10 text-[10px]">
                   <span>Nenhuma pré-visualização</span>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="px-3.5 py-2.5 border-t bg-muted/10 shrink-0 gap-2 sm:gap-0 flex-row justify-end">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading} className="h-8 text-xs px-2.5 mr-2">
            <X className="w-3.5 h-3.5 mr-1" /> Cancelar
          </Button>
          <Button onClick={onSaveClick} size="sm" disabled={loading} className="h-8 text-xs px-2.5">
            {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageEditorModal;