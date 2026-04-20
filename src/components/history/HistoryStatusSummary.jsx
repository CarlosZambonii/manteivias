import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarX, AlarmClock as UserClock, Hourglass, UserCheck } from 'lucide-react';

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
    },
  }),
};

const StatusCard = ({ title, value, icon, description, gradient, index }) => (
  <motion.div variants={cardVariants} initial="hidden" animate="visible" custom={index} className="h-full">
    <Card className={`text-white shadow-lg ${gradient} h-full flex flex-col justify-between`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 sm:pb-2 p-3 sm:p-4">
        <CardTitle className="text-xs sm:text-sm md:text-base font-medium leading-tight">{title}</CardTitle>
        <div className="opacity-80 scale-75 sm:scale-100">{icon}</div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
        <div className="text-lg sm:text-xl md:text-2xl font-bold">{value}</div>
        <p className="text-[10px] sm:text-xs text-white/70 line-clamp-1">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const HistoryStatusSummary = ({ summary }) => {
  if (!summary) return null;

  const summaryCards = [
    { title: 'Faltas por Justificar', value: summary.unjustified_absences, icon: <CalendarX className="h-4 w-4 md:h-5 md:w-5" />, description: 'dias sem registo', gradient: 'bg-gradient-to-br from-red-500 to-red-600' },
    { title: 'Justificações Pendentes', value: summary.pending_justifications, icon: <UserClock className="h-4 w-4 md:h-5 md:w-5" />, description: 'a aguardar validação', gradient: 'bg-gradient-to-br from-yellow-500 to-yellow-600' },
    { title: 'Correções Pendentes', value: summary.pending_corrections, icon: <Hourglass className="h-4 w-4 md:h-5 md:w-5" />, description: 'a aguardar validação', gradient: 'bg-gradient-to-br from-purple-500 to-purple-600' },
    { title: 'Correções Aprovadas', value: summary.approved_corrections, icon: <UserCheck className="h-4 w-4 md:h-5 md:w-5" />, description: 'recentemente', gradient: 'bg-gradient-to-br from-green-500 to-green-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6 lg:mb-8">
      {summaryCards.map((card, index) => (
        <StatusCard key={card.title} {...card} index={index} />
      ))}
    </div>
  );
};

export default HistoryStatusSummary;