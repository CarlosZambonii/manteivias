import React from 'react';
    import { Helmet } from 'react-helmet';
    import { useNavigate } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Label } from '@/components/ui/label';
    import { Input } from '@/components/ui/input';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { ChevronLeft, FileUp, Download } from 'lucide-react';
    import { useToast } from '@/components/ui/use-toast';

    const TableEditorPage = () => {
      const navigate = useNavigate();
      const { toast } = useToast();

      const handleFeatureNotImplemented = () => {
        toast({
          title: "🚧 Funcionalidade em desenvolvimento!",
          description: "Esta funcionalidade ainda não foi implementada, mas pode pedi-la no seu próximo prompt! 🚀",
        });
      };

      return (
        <>
          <Helmet>
            <title>Editar Tabelas | Manteivias</title>
            <meta name="description" content="Edite e personalize os modelos de tabela para os seus relatórios." />
          </Helmet>
          <div className="p-4 md:p-6 min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900/50">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-2xl"
            >
              <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl font-bold tracking-tight text-center">
                    Editor de Modelos de Tabela
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                  <div className="space-y-4">
                    <Label htmlFor="report-type" className="text-lg font-semibold">1. Selecione o tipo de relatório</Label>
                    <Select onValueChange={handleFeatureNotImplemented}>
                      <SelectTrigger id="report-type">
                        <SelectValue placeholder="Escolha um relatório..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="justification">Relatório de Justificações</SelectItem>
                        <SelectItem value="clock">Relatório de Ponto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-4">
                    <Label htmlFor="file-upload" className="text-lg font-semibold">2. Carregue o seu modelo</Label>
                    <div className="flex items-center space-x-4">
                      <Input id="file-upload" type="file" className="flex-grow" onChange={handleFeatureNotImplemented} />
                      <Button variant="outline" size="icon" onClick={handleFeatureNotImplemented}>
                        <FileUp className="h-5 w-5" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Carregue um ficheiro Excel (.xlsx) para usar como novo modelo.
                    </p>
                  </div>

                  <div className="text-center">
                    <Button 
                      size="lg" 
                      className="w-full sm:w-auto text-base font-semibold h-12 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                      onClick={handleFeatureNotImplemented}
                    >
                      <Download className="mr-2 h-5 w-5" />
                      Aplicar e Baixar Novo Modelo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      );
    };

    export default TableEditorPage;