import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Clock, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const FleetUsageHoursPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [unit, setUnit] = useState(location.state?.unit || 'Hora'); // 'Hora' or 'Dia'
  const [value, setValue] = useState(location.state?.value || '');

  const handleContinue = () => {
    navigate('/admin/frotas/resumo', { state: { ...location.state, unit, value } });
  };

  const isContinueDisabled = !value || parseFloat(value) <= 0;

  return (
    <>
      <Helmet>
        <title>Horas de Utilização</title>
        <meta name="description" content="Registe as horas ou dias de utilização do equipamento." />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto p-4 md:p-6"
      >
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="flex justify-center">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">Horas de Utilização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 text-center">
                <Label className="text-base">Selecione a unidade de medida</Label>
                <div className="flex justify-center gap-4 pt-2">
                  <Button
                    onClick={() => setUnit('Hora')}
                    variant={unit === 'Hora' ? 'default' : 'outline'}
                    className="w-28"
                  >
                    <Clock className="mr-2 h-4 w-4" /> Hora
                  </Button>
                  <Button
                    onClick={() => setUnit('Dia')}
                    variant={unit === 'Dia' ? 'default' : 'outline'}
                    className="w-28"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" /> Dia
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="usage-value">Valor ({unit}s)</Label>
                <Input
                  id="usage-value"
                  type="number"
                  placeholder={`Insira o número de ${unit.toLowerCase()}s`}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  min="0"
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => navigate(-1)}>Voltar</Button>
              <Button onClick={handleContinue} disabled={isContinueDisabled}>
                Continuar
              </Button>
            </CardFooter>
          </Card>
        </div>
      </motion.div>
    </>
  );
};

export default FleetUsageHoursPage;