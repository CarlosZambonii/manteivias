import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { format, getYear, parseISO } from "date-fns";
import { pt } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

const AnnualJustificationCalendar = ({ userId }) => {
  const [year, setYear] = useState(getYear(new Date()));
  const [justifications, setJustifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchJustifications = async () => {
      if (!userId) return;
      setIsLoading(true);
      
      const { data, error } = await supabase.rpc('get_approved_justification_days_for_user', {
        p_user_id: userId,
        p_year: year
      });

      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar o histórico.' });
        console.error("Error fetching justifications:", error);
      } else {
        const processedData = data.map(d => ({
          date: parseISO(d.data),
          type: d.tipo_nome,
        }));
        setJustifications(processedData);
      }
      setIsLoading(false);
    };

    fetchJustifications();
  }, [year, userId, toast]);

  const months = Array.from({ length: 12 }, (_, i) => i);
  const approvedDays = justifications.map(j => j.date);

  return (
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle className="flex justify-between items-center">
          <span>Histórico de Ausências - {year}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setYear(y => y - 1)}>&lt;</Button>
            <Button variant="outline" size="sm" onClick={() => setYear(y => y + 1)}>&gt;</Button>
          </div>
        </DialogTitle>
      </DialogHeader>
      {isLoading ? (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 max-h-[70vh] overflow-y-auto">
          {months.map(month => (
            <div key={month}>
              <h3 className="text-center font-bold mb-2">{format(new Date(year, month), 'MMMM', { locale: pt })}</h3>
              <Calendar
                month={new Date(year, month)}
                mode="multiple"
                selected={approvedDays}
                modifiers={{ approved: approvedDays }}
                modifiersClassNames={{ approved: 'bg-primary/80 text-primary-foreground rounded-md' }}
                showOutsideDays={false}
                className="p-0"
                components={{
                  Head: () => null, 
                  Caption: () => null,
                  Nav: () => null,
                }}
              />
            </div>
          ))}
        </div>
      )}
    </DialogContent>
  );
};

export default AnnualJustificationCalendar;