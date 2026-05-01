/**
 * reportDataProviders.js
 * Fornece dados reais do Supabase para os previews de relatórios.
 * Cada função transforma os dados da RPC no formato esperado pelos templates.
 */

import { supabase } from "@/lib/customSupabaseClient";

const MONTHS_PT = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function periodToDates(period) {
  if (!period) return { startDate: null, endDate: null };
  if (period.mode === "month") {
    const { year, month } = period; // month is 0-indexed
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const pad   = n => String(n).padStart(2, "0");
    return {
      startDate: `${year}-${pad(month + 1)}-01`,
      endDate:   `${year}-${pad(month + 1)}-${pad(last.getDate())}`,
    };
  }
  return { startDate: period.startDate, endDate: period.endDate };
}

function fmtDate(str) {
  const [y, m, d] = str.split("-");
  return `${d}/${m}/${y}`;
}

function periodToMesAno(period) {
  if (!period) return { mes: "", ano: new Date().getFullYear(), periodoLabel: "" };
  if (period.mode === "month") {
    const mes = MONTHS_PT[period.month];
    const ano = period.year;
    return { mes, ano, periodoLabel: `${mes.toUpperCase()} ${ano}` };
  }
  if (period.startDate) {
    const d = new Date(period.startDate + "T00:00:00");
    const periodoLabel = period.endDate
      ? `${fmtDate(period.startDate)} - ${fmtDate(period.endDate)}`
      : fmtDate(period.startDate);
    return { mes: MONTHS_PT[d.getMonth()], ano: d.getFullYear(), periodoLabel };
  }
  return { mes: "", ano: new Date().getFullYear(), periodoLabel: "" };
}

function parseHoursToDecimal(hoursString) {
  if (!hoursString) return 0;
  if (typeof hoursString === "number") return hoursString;
  const [hours, minutes] = String(hoursString).split(":").map(Number);
  return (hours || 0) + (minutes || 0) / 60;
}

function formatHoursDecimal(decimalHours) {
  if (!decimalHours || decimalHours < 0.01) return "";
  const h = Math.floor(decimalHours);
  const m = Math.round((decimalHours - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Converts RPC day_of_week (1=Mon..7=Sun) to JS day (0=Sun..6=Sat)
function rpcDowToJs(rpcDow) {
  return rpcDow === 7 ? 0 : rpcDow;
}

// First actual calendar day in the month that falls on targetJsDow
function getFirstDayOfWeekInMonth(year, monthNum, targetJsDow) {
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, monthNum - 1, d);
    if (date.getMonth() !== monthNum - 1) break;
    if (date.getDay() === targetJsDow) return d;
  }
  return null;
}

// ─── 1. Lista de obras ────────────────────────────────────────────────────────
export async function getObras() {
  const { data, error } = await supabase
    .from("obras")
    .select("id, nome")
    .order("id");
  if (error) throw error;
  return (data || []).map(o => ({ id: String(o.id), name: o.nome || String(o.id) }));
}

// ─── 2. Folha de Ponto — Justificações (AdminFlow) ───────────────────────────
export async function getFolhaPontoJustificacoes(period) {
  const { startDate, endDate } = periodToDates(period);
  const { mes, ano, periodoLabel } = periodToMesAno(period);

  // Fetch all active users
  const { data: usuarios, error: usersError } = await supabase
    .from("usuarios")
    .select("id, nome")
    .eq("status", "Ativo")
    .order("nome");
  if (usersError) throw usersError;

  // Fetch only actual user-submitted justifications (no RPC that injects public holidays)
  const { data: justificacoes, error: justError } = await supabase
    .from("justificação")
    .select("usuario_id, dias, status_validacao, tipos_justificação(codigo)")
    .in("status_validacao", ["Aprovado", "Pendente"]);
  if (justError) throw justError;

  // Build registos: filter each justification's dias array to the selected period
  const registos = [];
  (justificacoes || []).forEach(j => {
    const codigo = j["tipos_justificação"]?.codigo;
    if (!codigo) return;
    (j.dias || []).forEach(dateStr => {
      if (dateStr >= startDate && dateStr <= endDate) {
        const dia = parseInt(dateStr.split("-")[2]);
        registos.push({ colaborador_id: j.usuario_id, dia, codigo });
      }
    });
  });

  const colaboradores = (usuarios || []).map((u, i) => ({
    id:     u.id,
    numero: String(i + 1),
    nome:   u.nome || "",
  }));

  return { mes, ano, periodoLabel, obra: "", colaboradores, registos };
}

// ─── 3. Resumo Mensal Pessoal — Obras (AdminFlow) ────────────────────────────
export async function getResumoPessoalObras(period) {
  const { startDate, endDate } = periodToDates(period);
  const { mes, ano, periodoLabel } = periodToMesAno(period);

  const { data, error } = await supabase.rpc("export_clock_report_v2", {
    start_date: startDate,
    end_date:   endDate,
  });
  if (error) throw error;

  // Collect all obra IDs
  const allObraIds = new Set();
  (data || []).forEach(u => {
    (u.horas_por_obra_json || []).forEach(o => allObraIds.add(String(o.obra_id)));
    (u.horas_extras_json   || []).forEach(o => allObraIds.add(String(o.obra_id)));
  });
  const obraIds = Array.from(allObraIds).sort((a, b) => parseInt(a) - parseInt(b));

  const colaboradores = (data || []).map(u => {
    const obraMap = {};
    [...(u.horas_por_obra_json || []), ...(u.horas_extras_json || [])].forEach(o => {
      const id = String(o.obra_id);
      obraMap[id] = (obraMap[id] || 0) + parseHoursToDecimal(o.total_hours);
    });
    const obras = {};
    obraIds.forEach(id => {
      if (obraMap[id]) obras[id] = formatHoursDecimal(obraMap[id]);
    });
    return {
      nome:         u.usuario_nome || "",
      empresa:      u.empresa || "",
      diasTrab:     u.dias_trabalhados || "",
      totalNormais: u.total_horas_normais || "",
      totalExtra:   u.total_horas_extras  || "",
      totalHoras:   u.total_horas || "",
      obras,
    };
  });

  return { mes, ano, periodoLabel, obraIds, colaboradores };
}

// ─── 4. Resumo Mensal Pessoal — Justificações (AdminFlow) ────────────────────
export async function getResumoPessoalJustificacoes(period) {
  const { startDate, endDate } = periodToDates(period);
  const { mes, ano, periodoLabel } = periodToMesAno(period);

  const { data, error } = await supabase.rpc("export_clock_report_v2", {
    start_date: startDate,
    end_date:   endDate,
  });
  if (error) throw error;

  const colaboradores = (data || []).map(u => ({
    nome:     u.usuario_nome || "",
    empresa:  u.empresa || "",
    diasTrab: u.dias_trabalhados || "",
    hrObra:   u.total_horas_normais || "",
    hrExtra:  u.total_horas_extras  || "",
    sabados:  "",
    hrTotais: u.total_horas || "",
    justificacoes: {
      FE: u.fe_count || 0,
      BX: u.bx_count || 0,
      LP: u.lp_count || 0,
      FI: u.fi_count || 0,
      FJ: u.fj_count || 0,
      AT: u.at_count || 0,
      FP: u.fp_count || 0,
      N:  u.n_count  || 0,
      S:  u.s_count  || 0,
      LC: u.lc_count || 0,
      IP: u.ip_count || 0,
      F:  u.f_count  || 0,
      FM: u.fm_count || 0,
      EE: u.ee_count || 0,
    },
  }));

  return { mes, ano, periodoLabel, colaboradores };
}

// ─── 5. Folha Fiscal (EncarregadoFlow) ───────────────────────────────────────
export async function getFolhaFiscal(period, obraId, showAv) {
  const { startDate, endDate } = periodToDates(period);
  const { mes, ano, periodoLabel } = periodToMesAno(period);

  const mesNum = parseInt(startDate?.split("-")[1]) || new Date().getMonth() + 1;

  const { data: rpcData, error } = await supabase.rpc("export_weekly_hours_summary_v5", {
    p_start_date: startDate,
    p_end_date:   endDate,
  });
  if (error) throw error;

  // Optionally filter by obra
  let data = rpcData || [];
  if (obraId) {
    const { data: records } = await supabase
      .from("registros_ponto")
      .select("usuario_id")
      .eq("obra_id", obraId)
      .gte("hora_inicio_real", startDate)
      .lte("hora_inicio_real", endDate);
    const userIds = new Set((records || []).map(r => r.usuario_id));
    data = data.filter(d => userIds.has(d.usuario_id));
  }

  // Group by user, then by day_of_week
  const userMap = {};
  data.forEach(record => {
    if (!userMap[record.usuario_id]) {
      userMap[record.usuario_id] = {
        nome:    record.usuario_nome || "",
        empresa: record.empresa || "",
        days:    {},
      };
    }

    let morning   = record.morning_hours   || 0;
    let afternoon = record.afternoon_hours || 0;
    let extra     = record.extra_hours     || 0;
    const total   = morning + afternoon + extra;

    // Normalize standard 8h30 day
    const dow = record.day_of_week;
    if (dow < 6 && total >= 8.9 && total < 9.1) {
      morning = 4; afternoon = 4; extra = 0;
    }

    const jsDow = rpcDowToJs(dow);
    const dia   = getFirstDayOfWeekInMonth(ano, mesNum, jsDow);
    if (dia) {
      const prev = userMap[record.usuario_id].days[dia];
      userMap[record.usuario_id].days[dia] = {
        manha: morning   > 0 ? (Number.isInteger(morning)   ? String(morning)   : morning.toFixed(1))   : (prev?.manha   || ""),
        tarde: afternoon > 0 ? (Number.isInteger(afternoon) ? String(afternoon) : afternoon.toFixed(1)) : (prev?.tarde   || ""),
        av:    extra     > 0 ? (Number.isInteger(extra)     ? String(extra)     : extra.toFixed(1))     : (prev?.av      || ""),
      };
    }
  });

  const colaboradores = Object.entries(userMap).map(([id, u]) => ({
    id, nome: u.nome, empresa: u.empresa,
  }));

  const registos = [];
  Object.entries(userMap).forEach(([userId, u]) => {
    Object.entries(u.days).forEach(([dia, hrs]) => {
      registos.push({ colaborador_id: userId, dia: parseInt(dia), ...hrs });
    });
  });

  // Find obra name
  let obraLabel = obraId ? `Obra ${obraId}` : "Geral";
  if (obraId) {
    const { data: obraData } = await supabase.from("obras").select("nome").eq("id", obraId).single();
    if (obraData?.nome) obraLabel = `${obraId} – ${obraData.nome}`;
  }

  return { mes, ano, periodoLabel, startDate, endDate, obra: obraLabel, empresa: "Manteivias", colaboradores, registos };
}
