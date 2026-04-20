import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, CalendarX, AlarmClock as UserClock, Hourglass, UserCheck, BarChart3, FileCheck2, FileX2 } from 'lucide-react';
import { format, startOfMonth, isFuture, isToday } from 'date-fns';
import { pt } from 'date-fns/locale';

import RecordsHistoryTab from '@/components/history/RecordsHistoryTab';
import JustificationsHistoryTab from '@/components/history/JustificationsHistoryTab';
import HistoryStatusSummary from '@/components/history/HistoryStatusSummary';
import { useAutoCloseRecords } from '@/hooks/useAutoCloseRecords';
import { useLanguage } from '@/hooks/useLanguage';

const HistoryPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [statusSummary, setStatusSummary] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [hasMonthlyRecord, setHasMonthlyRecord] = useState(false);
  const userRecordType = user?.tipo_registo?.toLowerCase();
  const [activeTab, setActiveTab] = useState('registos');

  const { checkAndAutoClose } = useAutoCloseRecords();

  useEffect(() => {
    if (user?.id) {
        checkAndAutoClose(user.id).then(({closedCount}) => {
            if (closedCount > 0) {
                fetchStatusSummary(selectedMonth);
            }
        });
    }
  }, [user?.id]); 

  const fetchStatusSummary = useCallback(async (month) => {
    try {
        const { data, error } = await supabase.rpc('get_user_status_summary', { 
            p_user_id: user.id,
            p_month: format(startOfMonth(month), 'yyyy-MM-dd')
        });
        if (error) throw error;
        setStatusSummary(data[0]);
    } catch (error) {
        toast({
            variant: 'destructive',
            title: t('common.error'),
            description: error.message,
        });
    }

    if (userRecordType === 'mensal') {
        const { count, error } = await supabase
            .from('registros_mensais')
            .select('*', { count: 'exact', head: true })
            .eq('usuario_id', user.id)
            .eq('mes', format(startOfMonth(month), 'yyyy-MM-dd'));
        
        if (error) {
            toast({ variant: 'destructive', title: t('common.error'), description: error.message });
            setHasMonthlyRecord(false);
        } else {
            setHasMonthlyRecord(count > 0);
        }
    }
  }, [user.id, toast, userRecordType, t]);

  useEffect(() => {
    fetchStatusSummary(selectedMonth);
  }, [fetchStatusSummary, selectedMonth]);

  const SummaryCards = ({ isMobile }) => {
    if (userRecordType === 'mensal') {
        const isMonthFuture = isFuture(startOfMonth(selectedMonth)) && !isToday(startOfMonth(selectedMonth));
        let recordCardProps;

        if (isMonthFuture) {
            recordCardProps = { title: t('history.summary.monthRecord'), icon: <FileX2 className="h-4 w-4 md:h-5 md:w-5 text-white/80" />, value: t('history.summary.future'), description: 'Este mês ainda não começou', gradient: 'bg-gradient-to-br from-gray-400 to-gray-500' };
        } else if (hasMonthlyRecord) {
            recordCardProps = { title: t('history.summary.monthRecord'), icon: <FileCheck2 className="h-4 w-4 md:h-5 md:w-5 text-white/80" />, value: t('history.summary.registered'), description: 'O seu registo mensal foi enviado', gradient: 'bg-gradient-to-br from-green-500 to-green-600' };
        } else {
            recordCardProps = { title: t('history.summary.monthRecord'), icon: <FileX2 className="h-4 w-4 md:h-5 md:w-5 text-white/80" />, value: t('history.summary.notRegistered'), description: 'Ainda não enviou o seu registo', gradient: 'bg-gradient-to-br from-red-500 to-red-600' };
        }

        return (
            statusSummary && (
                <motion.div
                    key={format(selectedMonth, 'yyyy-MM')}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4`}
                >
                    <Card className={`${recordCardProps.gradient} text-white shadow-lg h-full flex flex-col justify-between`}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4"><CardTitle className="text-xs sm:text-sm md:text-base font-medium leading-tight">{recordCardProps.title}</CardTitle><div className="opacity-80 scale-75 sm:scale-100">{recordCardProps.icon}</div></CardHeader>
                        <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0"><div className="text-lg sm:text-xl md:text-2xl font-bold">{recordCardProps.value}</div><p className="text-[10px] sm:text-xs text-white/70 line-clamp-1">{recordCardProps.description}</p></CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg h-full flex flex-col justify-between">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4"><CardTitle className="text-xs sm:text-sm md:text-base font-medium leading-tight">{t('history.summary.pendingJustifications')}</CardTitle><div className="opacity-80 scale-75 sm:scale-100"><UserClock className="h-4 w-4 md:h-5 md:w-5 text-white/80" /></div></CardHeader>
                        <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0"><div className="text-lg sm:text-xl md:text-2xl font-bold">{statusSummary.pending_justifications}</div><p className="text-[10px] sm:text-xs text-white/70 line-clamp-1">pendentes</p></CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg h-full flex flex-col justify-between">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4"><CardTitle className="text-xs sm:text-sm md:text-base font-medium leading-tight">{t('history.summary.pendingCorrections')}</CardTitle><div className="opacity-80 scale-75 sm:scale-100"><Hourglass className="h-4 w-4 md:h-5 md:w-5 text-white/80" /></div></CardHeader>
                        <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0"><div className="text-lg sm:text-xl md:text-2xl font-bold">{statusSummary.pending_corrections}</div><p className="text-[10px] sm:text-xs text-white/70 line-clamp-1">pendentes</p></CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg h-full flex flex-col justify-between">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4"><CardTitle className="text-xs sm:text-sm md:text-base font-medium leading-tight">{t('history.summary.approvedCorrections')}</CardTitle><div className="opacity-80 scale-75 sm:scale-100"><UserCheck className="h-4 w-4 md:h-5 md:w-5 text-white/80" /></div></CardHeader>
                        <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0"><div className="text-lg sm:text-xl md:text-2xl font-bold">{statusSummary.approved_corrections}</div><p className="text-[10px] sm:text-xs text-white/70 line-clamp-1">aprovadas</p></CardContent>
                    </Card>
                </motion.div>
            )
        );
    }

    return <HistoryStatusSummary summary={statusSummary} />;
  };

  return (
    <>
      <Helmet>
        <title>{t('history.pageTitle')}</title>
        <meta name="description" content={t('history.pageTitle')} />
      </Helmet>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="container max-w-7xl mx-auto px-2 md:px-4 py-4 md:py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="p-2 -ml-2 text-sm md:text-base">
            <ChevronLeft className="mr-1 md:mr-2 h-4 w-4 md:h-5 md:w-5" /> {t('common.back')}
          </Button>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="sm:hidden">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 w-9"><BarChart3 className="h-4 w-4" /></Button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] rounded-lg p-4">
                  <DialogHeader className="mb-2">
                    <DialogTitle className="text-sm font-semibold">Resumo de {format(selectedMonth, 'MMMM yyyy', { locale: pt })}</DialogTitle>
                  </DialogHeader>
                  <div className="py-2"><SummaryCards isMobile={true} /></div>
                  <DialogFooter className="mt-2">
                    <DialogClose asChild>
                      <Button type="button" variant="secondary" className="w-full h-10 text-sm">{t('common.close')}</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
        
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 md:mb-6 lg:mb-8">{t('history.myHistory')}</h1>

        <div className="hidden sm:block">
          <SummaryCards isMobile={false} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2 md:mt-4">
            <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6 h-10 md:h-12 bg-muted/50 p-1">
                <TabsTrigger value="registos" className="text-xs md:text-sm data-[state=active]:shadow-sm">Registos</TabsTrigger>
                <TabsTrigger value="justificacoes" className="text-xs md:text-sm data-[state=active]:shadow-sm">Justificações</TabsTrigger>
            </TabsList>
            <div className="bg-card border p-2 sm:p-4 md:p-6 rounded-xl md:rounded-2xl shadow-sm md:shadow-lg min-h-[300px] md:min-h-[400px]">
                <TabsContent value="registos" className="m-0 focus-visible:outline-none">
                    <RecordsHistoryTab month={selectedMonth} />
                </TabsContent>
                <TabsContent value="justificacoes" className="m-0 focus-visible:outline-none">
                    <JustificationsHistoryTab month={selectedMonth} />
                </TabsContent>
            </div>
        </Tabs>

      </motion.div>
    </>
  );
};

export default HistoryPage;