import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, FileBarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useToast } from "@/components/ui/use-toast";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '@/lib/customSupabaseClient';
import * as XLSX from 'xlsx';

import ProfileTabs from '@/components/reports/ProfileTabs';
import AdminFlow from '@/components/reports/AdminFlow';
import EncarregadoFlow from '@/components/reports/EncarregadoFlow';
import { getObras } from '@/lib/reportDataProviders';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const XLSX_TEMPLATES = {
  justificacao: "https://habwmiaiahevujwmfxoh.supabase.co/storage/v1/object/public/xls/contabilidade1.xlsx",
  resumo_clock: "https://habwmiaiahevujwmfxoh.supabase.co/storage/v1/object/public/xls/resumo_mensal_pessoas_obras.xlsx",
  resumo_obras: "https://habwmiaiahevujwmfxoh.supabase.co/storage/v1/object/public/xls/ResumoPessoal_Obras.xlsx",
  fiscal_com_av: "https://habwmiaiahevujwmfxoh.supabase.co/storage/v1/object/public/xls/Folha%20de%20pontos%20(Validacao)%20com%20AV.xlsx",
  fiscal_sem_av: "https://habwmiaiahevujwmfxoh.supabase.co/storage/v1/object/public/xls/Folha%20de%20pontos%20(Validacao)%20sem%20AV.xlsx",
};

function periodToDates(period) {
  if (!period) return { startDate: null, endDate: null };
  if (period.mode === 'month') {
    const { year, month } = period;
    const first = startOfMonth(new Date(year, month, 1));
    const last  = endOfMonth(new Date(year, month, 1));
    return {
      startDate: format(first, 'yyyy-MM-dd'),
      endDate:   format(last,  'yyyy-MM-dd'),
    };
  }
  return { startDate: period.startDate, endDate: period.endDate };
}

function formatHoursDecimal(decimalHours) {
  if (!decimalHours || decimalHours < 0.01) return '00:00';
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseHoursToDecimal(hoursString) {
  if (!hoursString) return 0;
  if (typeof hoursString === 'number') return hoursString;
  const [hours, minutes] = String(hoursString).split(':').map(Number);
  return (hours || 0) + (minutes || 0) / 60;
}

async function fetchTemplate(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Não foi possível carregar o modelo Excel.');
  return res.arrayBuffer();
}

// ─── Export Functions ──────────────────────────────────────────────────────────

async function exportJustificacao(period, toast) {
  const { startDate, endDate } = periodToDates(period);
  const { data, error } = await supabase.rpc('export_full_user_summary_v2', {
    start_date: startDate, end_date: endDate,
  });
  if (error) throw error;
  if (!data?.length) throw new Error('Sem dados para o período selecionado.');

  const templateBuffer = await fetchTemplate(XLSX_TEMPLATES.justificacao);
  const workbook = XLSX.read(templateBuffer, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  const fromDate = new Date(startDate);
  const numDays  = new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, 0).getDate();
  const dayHeaders = Array.from({ length: numDays }, (_, i) => i + 1);
  XLSX.utils.sheet_add_aoa(worksheet, [dayHeaders], { origin: 'H3' });

  const rows = data.map(user => {
    const row = [user.usuario_id, user.usuario_nome, null, user.dias_trabalhados, null, null, null];
    const justValues = dayHeaders.map(day => {
      const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), day);
      return user.justificacoes_json?.[format(d, 'yyyy-MM-dd')] || '';
    });
    return row.concat(justValues);
  });

  XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: 'A4' });
  XLSX.utils.sheet_add_aoa(worksheet, [[format(fromDate, 'dd/MM/yyyy')]], { origin: 'AK1' });
  XLSX.utils.sheet_add_aoa(worksheet, [[format(new Date(endDate), 'dd/MM/yyyy')]], { origin: 'AL1' });
  XLSX.writeFile(workbook, `Relatorio_Pessoal_Justificacoes_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

async function exportResumoClock(period) {
  const { startDate, endDate } = periodToDates(period);
  const { data, error } = await supabase.rpc('export_clock_report_v2', {
    start_date: startDate, end_date: endDate,
  });
  if (error) throw error;
  if (!data?.length) throw new Error('Sem dados para o período selecionado.');

  const templateBuffer = await fetchTemplate(XLSX_TEMPLATES.resumo_clock);
  const workbook = XLSX.read(templateBuffer, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  const rows = data.map(u => [
    u.usuario_nome, u.empresa, u.dias_trabalhados, u.horas_por_obra, u.horas_extras_semana,
    null, u.total_horas, u.fe_count, u.bx_count, u.lp_count, u.fi_count, u.fj_count,
    u.at_count, u.fp_count, u.n_count, u.s_count, u.e_count, u.lc_count,
    u.ip_count, u.fp_count, u.f_count, u.fm_count, u.ee_count,
  ]);
  XLSX.utils.sheet_add_aoa(worksheet, [['Nome', 'Empresa', 'Dias Trab']], { origin: 'A1' });
  XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: 'A2' });
  XLSX.writeFile(workbook, `Relatorio_Pessoal_Justificacoes_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

async function exportResumoObras(period) {
  const { startDate, endDate } = periodToDates(period);
  const { data, error } = await supabase.rpc('export_clock_report_v2', {
    start_date: startDate, end_date: endDate,
  });
  if (error) throw error;
  if (!data?.length) throw new Error('Sem dados para o período selecionado.');

  const templateBuffer = await fetchTemplate(XLSX_TEMPLATES.resumo_obras);
  const workbook = XLSX.read(templateBuffer, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  const allObraIds = new Set();
  data.forEach(u => {
    (u.horas_por_obra_json || []).forEach(o => allObraIds.add(o.obra_id.toString()));
    (u.horas_extras_json   || []).forEach(o => allObraIds.add(o.obra_id.toString()));
  });
  const sortedObraIds = Array.from(allObraIds).sort((a, b) => parseInt(a) - parseInt(b));

  XLSX.utils.sheet_add_aoa(worksheet, [['Nome', 'Empresa', 'total horas normais', 'total extra', 'total horas', ...sortedObraIds]], { origin: 'A1' });

  const rows = data.map(u => {
    const obraMap = {};
    [...(u.horas_por_obra_json || []), ...(u.horas_extras_json || [])].forEach(o => {
      const id = o.obra_id.toString();
      obraMap[id] = (obraMap[id] || 0) + parseHoursToDecimal(o.total_hours);
    });
    return [
      u.usuario_nome, u.empresa,
      u.total_horas_normais, u.total_horas_extras, u.total_horas,
      ...sortedObraIds.map(id => obraMap[id] ? formatHoursDecimal(obraMap[id]) : null),
    ];
  });
  XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: 'A2' });
  XLSX.writeFile(workbook, `Relatorio_Pessoal_Obras_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

async function exportFiscal(period, obraId, avConfig, obras) {
  const { startDate, endDate } = periodToDates(period);
  const withAV = avConfig === 'com_av';

  const { data: rpcData, error } = await supabase.rpc('export_weekly_hours_summary_v5', {
    p_start_date: startDate, p_end_date: endDate,
  });
  if (error) throw error;

  let data = rpcData || [];
  if (obraId) {
    const { data: records } = await supabase
      .from('registros_ponto')
      .select('usuario_id')
      .eq('obra_id', obraId)
      .gte('hora_inicio_real', startDate)
      .lte('hora_inicio_real', endDate);
    const userIds = new Set((records || []).map(r => r.usuario_id));
    data = data.filter(d => userIds.has(d.usuario_id));
  }
  if (!data.length) throw new Error('Sem dados para o período / obra selecionados.');

  const templateUrl = withAV ? XLSX_TEMPLATES.fiscal_com_av : XLSX_TEMPLATES.fiscal_sem_av;
  const templateBuffer = await fetchTemplate(templateUrl);
  const workbook  = XLSX.read(templateBuffer, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];

  const selectedObra = obras.find(o => String(o.id) === String(obraId));
  if (selectedObra) {
    XLSX.utils.sheet_add_aoa(worksheet, [[selectedObra.id]],   { origin: 'K2' });
    XLSX.utils.sheet_add_aoa(worksheet, [[selectedObra.name]], { origin: 'L2' });
  }
  XLSX.utils.sheet_add_aoa(worksheet, [[format(new Date(startDate), 'dd/MM/yyyy')]], { origin: 'K4' });
  XLSX.utils.sheet_add_aoa(worksheet, [[format(new Date(endDate),   'dd/MM/yyyy')]], { origin: 'L4' });

  const userHours = {};
  data.forEach(record => {
    if (!userHours[record.usuario_id]) {
      userHours[record.usuario_id] = {
        usuario_nome: record.usuario_nome,
        empresa: record.empresa,
        days: { 1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {} },
      };
    }
    const day = record.day_of_week;
    if (day >= 1 && day <= 7) {
      let morning   = record.morning_hours   || 0;
      let afternoon = record.afternoon_hours || 0;
      let extra     = record.extra_hours     || 0;
      const total   = morning + afternoon + extra;
      if (day < 6 && total >= 8.9 && total < 9.1) { morning = 4; afternoon = 4; extra = 0; }
      userHours[record.usuario_id].days[day] = {
        morning:   (userHours[record.usuario_id].days[day].morning   || 0) + morning,
        afternoon: (userHours[record.usuario_id].days[day].afternoon || 0) + afternoon,
        extra:     (userHours[record.usuario_id].days[day].extra     || 0) + extra,
      };
    }
  });

  const fmt = v => v > 0.01 ? v : null;
  const rows = Object.values(userHours).map(u => {
    if (withAV) {
      const sat = (u.days[6]?.morning || 0) + (u.days[6]?.afternoon || 0) + (u.days[6]?.extra || 0);
      const sun = (u.days[7]?.morning || 0) + (u.days[7]?.afternoon || 0) + (u.days[7]?.extra || 0);
      return [u.usuario_nome, u.empresa,
        fmt(u.days[1]?.morning), fmt(u.days[1]?.afternoon), fmt(u.days[1]?.extra),
        fmt(u.days[2]?.morning), fmt(u.days[2]?.afternoon), fmt(u.days[2]?.extra),
        fmt(u.days[3]?.morning), fmt(u.days[3]?.afternoon), fmt(u.days[3]?.extra),
        fmt(u.days[4]?.morning), fmt(u.days[4]?.afternoon), fmt(u.days[4]?.extra),
        fmt(u.days[5]?.morning), fmt(u.days[5]?.afternoon), fmt(u.days[5]?.extra),
        fmt(sat), fmt(sun),
      ];
    } else {
      return [u.usuario_nome, u.empresa,
        fmt(u.days[1]?.morning), fmt(u.days[1]?.afternoon),
        fmt(u.days[2]?.morning), fmt(u.days[2]?.afternoon),
        fmt(u.days[3]?.morning), fmt(u.days[3]?.afternoon),
        fmt(u.days[4]?.morning), fmt(u.days[4]?.afternoon),
        fmt(u.days[5]?.morning), fmt(u.days[5]?.afternoon),
      ];
    }
  });
  XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: 'A8' });
  XLSX.writeFile(workbook, `Folha_Ponto_Fiscalizacao_${withAV ? 'Com_AV' : 'Sem_AV'}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}

// ─── Page Component ────────────────────────────────────────────────────────────

const DataAnalysisPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeView, setActiveView] = useState('admin');
  const [obras, setObras] = useState([]);

  useEffect(() => {
    getObras().catch(() => []).then(setObras);
  }, []);

  // ── Admin export handler ──────────────────────────────────────────────────
  const handleAdminExport = useCallback(async (reportType, subtype, period) => {
    try {
      if (reportType === 'folha_ponto_justificacoes') {
        await exportJustificacao(period, toast);
        toast({ title: 'Relatório de Justificações gerado!', description: 'O download irá começar.' });
      } else if (reportType === 'resumo_mensal_pessoal' && subtype === 'pessoal_obras') {
        await exportResumoObras(period);
        toast({ title: 'Relatório "Pessoal Obras" gerado!', description: 'O download irá começar.' });
      } else if (reportType === 'resumo_mensal_pessoal' && subtype === 'pessoal_justificacoes') {
        await exportResumoClock(period);
        toast({ title: 'Relatório Pessoal Justificações gerado!', description: 'O download irá começar.' });
      }
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao gerar relatório', description: err.message });
      throw err;
    }
  }, [toast]);

  // ── Encarregado export handler ────────────────────────────────────────────
  const handleOperacionalExport = useCallback(async (period, obraId, avConfig) => {
    try {
      await exportFiscal(period, obraId, avConfig, obras);
      toast({ title: 'Relatório de Fiscalização gerado!', description: 'O download irá começar.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao gerar relatório', description: err.message });
      throw err;
    }
  }, [toast, obras]);

  return (
    <>
      <Helmet>
        <title>Relatórios e Exportação | Manteivias</title>
        <meta name="description" content="Gere e exporte relatórios de ponto, justificações e fiscalização." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-6 pb-24">

          {/* Back button */}
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/management')}
            className="pl-0 mb-4 hover:bg-transparent hover:text-primary"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileBarChart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">
                  Relatórios e Exportação
                </h1>
                <p className="text-xs text-muted-foreground">
                  Selecione, configure e exporte num único passo.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Profile tabs */}
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-5"
          >
            <ProfileTabs activeTab={activeView} onTabChange={setActiveView} />
          </motion.div>

          {/* Flow content */}
          <AnimatePresence mode="wait">
            {activeView === 'encarregado' ? (
              <motion.div
                key="encarregado"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <EncarregadoFlow
                  obras={obras}
                  onExport={handleOperacionalExport}
                />
              </motion.div>
            ) : (
              <motion.div
                key="admin"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <AdminFlow
                  onExport={handleAdminExport}
                  showEncarregadoReports={true}
                  onSwitchToEncarregado={() => setActiveView('encarregado')}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </>
  );
};

export default DataAnalysisPage;
