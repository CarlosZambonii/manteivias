import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import UserAreaPage from '@/pages/UserAreaPage';
import TimeComparisonCard from '@/components/clock/TimeComparisonCard';
import { motion, AnimatePresence } from 'framer-motion';

const HomePage = () => {
  const { user, loading } = useAuth();
  const [activeRecord, setActiveRecord] = useState(null);

  useEffect(() => {
    if (!user || loading) return;

    const fetchActiveRecord = async () => {
      const { data } = await supabase
        .from('registros_ponto')
        .select('*')
        .eq('usuario_id', user.id)
        .is('hora_fim_real', null)
        .order('hora_inicio_real', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setActiveRecord(data);
      }
    };

    fetchActiveRecord();
  }, [user, loading]);

  if (loading) {
    return null;
  }
  
  return (
    <div className="w-full flex flex-col h-full">
      <AnimatePresence>
        {activeRecord && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 w-full max-w-md mx-auto"
          >
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 ml-1">
              Resumo do Turno Atual
            </div>
            <TimeComparisonCard 
              compact
              actualDate={activeRecord.hora_inicio_real}
              selectedTimeStr={activeRecord.hora_inicio_escolhido.substring(0,5)}
              title="Entrada em Progresso"
            />
          </motion.div>
        )}
      </AnimatePresence>
      <UserAreaPage />
    </div>
  );
};

export default HomePage;