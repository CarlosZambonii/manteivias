/**
 * ============================================================
 *  DATA PROVIDERS — PONTO DE INTEGRAÇÃO COM DADOS REAIS
 * ============================================================
 *
 * COMO USAR:
 *  1. Cada função aqui representa uma "fonte de dados" para um relatório.
 *  2. Em modo MOCK os dados são estáticos (para desenvolvimento/preview).
 *  3. Em PRODUÇÃO substitua o bloco "// TODO: PRODUÇÃO" pelo código real
 *     (chamada à API, base44.entities, backend function, etc.)
 *  4. Todos os componentes de preview e template consomem estes providers
 *     através dos Flow components (EncarregadoFlow / AdminFlow).
 *
 * ESTRUTURA DE DADOS ESPERADA POR CADA TEMPLATE:
 *  → ver comentários em cada função abaixo.
 * ============================================================
 */

import { base44 } from "@/api/base44Client";

// ─── MODO ─────────────────────────────────────────────────────────────────────
// Mude para false quando tiver dados reais disponíveis
export const USE_MOCK = true;

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
import { MOCK_FOLHA_FISCAL }                   from "./mockFolhaFiscal";
import { MOCK_FOLHA_PONTO }                    from "./mockFolhaPonto";
import { MOCK_RESUMO_PESSOAL_OBRAS }           from "./mockResumoPessoalObras";
import { MOCK_RESUMO_PESSOAL_JUSTIFICACOES }   from "./mockResumoPessoalJustificacoes";


// ─────────────────────────────────────────────────────────────────────────────
//  1. LISTA DE OBRAS (para o selector de obras no EncarregadoFlow)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Retorna a lista de obras disponíveis para o utilizador autenticado.
 *
 * Estrutura esperada:
 *   [ { id: "146", name: "Construção Habitação e Urbanização do Loteamento" }, ... ]
 *
 * TODO: PRODUÇÃO
 *   const obras = await base44.entities.Obra.list();
 *   return obras.map(o => ({ id: o.codigo, name: o.descricao }));
 */
export async function getObras() {
  if (USE_MOCK) {
    return [
      { id: "124", name: "Modular – Habitação T2 – José Carlos Pais Monteiro" },
      { id: "125", name: "Reabilitação – Escola EB1 – Câmara Municipal" },
      { id: "130", name: "Ampliação – Armazém Industrial – LogiTrans SA" },
      { id: "132", name: "Construção – Moradia V4 – António Ferreira" },
      { id: "138", name: "Renovação – Sede Corporativa – TechNova Lda" },
      { id: "145", name: "Construção Habitação Loteamento 145" },
      { id: "146", name: "Construção Habitação e Urbanização do Loteamento" },
      { id: "149", name: "Obra Estrutural 149" },
    ];
  }

  // TODO: PRODUÇÃO
  // const obras = await base44.entities.Obra.list();
  // return obras.map(o => ({ id: o.codigo, name: o.descricao }));
}


// ─────────────────────────────────────────────────────────────────────────────
//  2. FOLHA FISCAL (Operacional — EncarregadoFlow)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Retorna os dados para o template FolhaFiscalTemplate.
 *
 * Parâmetros:
 *   @param {object} period  — { mode: "month", month: 0-11, year: 2026 }
 *                             ou { mode: "range", startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD" }
 *   @param {string} obraId  — ID da obra seleccionada (ex: "146")
 *   @param {boolean} showAv — true = com coluna AV
 *
 * Estrutura de retorno esperada pelo FolhaFiscalTemplate:
 * {
 *   mes: "Fevereiro",          // nome do mês
 *   ano: 2026,
 *   obra: "146 Construção...", // label da obra
 *   empresa: "Manteivias",
 *   colaboradores: [
 *     { id: 1, nome: "Nome Completo", empresa: "Manteivias" },
 *     ...
 *   ],
 *   registos: [
 *     // Um registo por colaborador por dia com horas manhã/tarde/av
 *     { colaborador_id: 1, dia: 2, manha: "8", tarde: "4", av: "" },
 *     ...
 *   ]
 * }
 *
 * TODO: PRODUÇÃO
 *   const res = await base44.functions.invoke('getFolhaFiscal', {
 *     mes: period.month + 1,
 *     ano: period.year,
 *     obraId,
 *     showAv,
 *   });
 *   return res.data;
 */
export async function getFolhaFiscal(period, obraId, showAv) {
  const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  if (USE_MOCK) {
    return {
      ...MOCK_FOLHA_FISCAL,
      mes:  period?.mode === "month" ? MONTHS[period.month] : MOCK_FOLHA_FISCAL.mes,
      ano:  period?.year  || MOCK_FOLHA_FISCAL.ano,
      obra: obraId ? `${obraId} – (obra de exemplo)` : MOCK_FOLHA_FISCAL.obra,
    };
  }

  // TODO: PRODUÇÃO
  // const res = await base44.functions.invoke('getFolhaFiscal', {
  //   mes: period.month + 1,
  //   ano: period.year,
  //   obraId,
  // });
  // return res.data;
}


// ─────────────────────────────────────────────────────────────────────────────
//  3. FOLHA DE PONTO JUSTIFICAÇÕES (Admin)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Retorna os dados para o template FolhaPontoTemplate.
 *
 * Parâmetros:
 *   @param {object} period — { mode: "month", month: 0-11, year: 2026 }
 *
 * Estrutura de retorno esperada pelo FolhaPontoTemplate:
 * {
 *   mes: "Agosto",
 *   ano: 2025,
 *   obra: "146 Construção...",
 *   colaboradores: [
 *     { id: 1, numero: "1", nome: "Nome Completo" },
 *     ...
 *   ],
 *   registos: [
 *     // código de justificação por dia: FE, BX, LP, F, FI, FJ, ...
 *     { colaborador_id: 1, dia: 11, codigo: "FE" },
 *     ...
 *   ]
 * }
 *
 * TODO: PRODUÇÃO
 *   const res = await base44.functions.invoke('getFolhaPontoJustificacoes', {
 *     mes: period.month + 1,
 *     ano: period.year,
 *   });
 *   return res.data;
 */
export async function getFolhaPontoJustificacoes(period) {
  const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  if (USE_MOCK) {
    return {
      ...MOCK_FOLHA_PONTO,
      mes: period?.mode === "month" ? MONTHS[period.month] : MOCK_FOLHA_PONTO.mes,
      ano: period?.year  || MOCK_FOLHA_PONTO.ano,
    };
  }

  // TODO: PRODUÇÃO
  // const res = await base44.functions.invoke('getFolhaPontoJustificacoes', {
  //   mes: period.month + 1,
  //   ano: period.year,
  // });
  // return res.data;
}


// ─────────────────────────────────────────────────────────────────────────────
//  4. RESUMO MENSAL PESSOAL — OBRAS (Admin)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Retorna os dados para o template ResumoPessoalObrasTemplate.
 *
 * Parâmetros:
 *   @param {object} period — { mode: "month", month: 0-11, year: 2026 }
 *
 * Estrutura de retorno esperada pelo ResumoPessoalObrasTemplate:
 * {
 *   mes: "Agosto",
 *   ano: 2025,
 *   obraIds: ["145", "146", "149"],   // colunas dinâmicas de obras
 *   colaboradores: [
 *     {
 *       nome: "Nome Completo",
 *       empresa: "Manteivias",
 *       diasTrab: 23,
 *       totalNormais: "184:00",
 *       totalExtra: "7:00",
 *       totalHoras: "191:00",
 *       obras: { "146": "184:00", "149": "0:00" }
 *     },
 *     ...
 *   ]
 * }
 *
 * TODO: PRODUÇÃO
 *   const res = await base44.functions.invoke('getResumoPessoalObras', {
 *     mes: period.month + 1,
 *     ano: period.year,
 *   });
 *   return res.data;
 */
export async function getResumoPessoalObras(period) {
  const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  if (USE_MOCK) {
    return {
      ...MOCK_RESUMO_PESSOAL_OBRAS,
      mes: period?.mode === "month" ? MONTHS[period.month] : MOCK_RESUMO_PESSOAL_OBRAS.mes,
      ano: period?.year  || MOCK_RESUMO_PESSOAL_OBRAS.ano,
    };
  }

  // TODO: PRODUÇÃO
  // const res = await base44.functions.invoke('getResumoPessoalObras', {
  //   mes: period.month + 1,
  //   ano: period.year,
  // });
  // return res.data;
}


// ─────────────────────────────────────────────────────────────────────────────
//  5. RESUMO MENSAL PESSOAL — JUSTIFICAÇÕES (Admin)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Retorna os dados para o template ResumoPessoalJustificacoesTemplate.
 *
 * Parâmetros:
 *   @param {object} period — { mode: "month", month: 0-11, year: 2026 }
 *
 * Estrutura de retorno esperada pelo ResumoPessoalJustificacoesTemplate:
 * {
 *   mes: "Agosto",
 *   ano: 2025,
 *   colaboradores: [
 *     {
 *       nome: "Nome Completo",
 *       empresa: "Manteivias",
 *       totalHorasTrabalhadas: "184:00",
 *       totalHorasExtra: "0:00",
 *       diasTrabalhados: 23,
 *       justificacoes: { FE: 0, BX: 0, LP: 20, F: 0, ... }
 *     },
 *     ...
 *   ]
 * }
 *
 * TODO: PRODUÇÃO
 *   const res = await base44.functions.invoke('getResumoPessoalJustificacoes', {
 *     mes: period.month + 1,
 *     ano: period.year,
 *   });
 *   return res.data;
 */
export async function getResumoPessoalJustificacoes(period) {
  const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

  if (USE_MOCK) {
    return {
      ...MOCK_RESUMO_PESSOAL_JUSTIFICACOES,
      mes: period?.mode === "month" ? MONTHS[period.month] : MOCK_RESUMO_PESSOAL_JUSTIFICACOES.mes,
      ano: period?.year  || MOCK_RESUMO_PESSOAL_JUSTIFICACOES.ano,
    };
  }

  // TODO: PRODUÇÃO
  // const res = await base44.functions.invoke('getResumoPessoalJustificacoes', {
  //   mes: period.month + 1,
  //   ano: period.year,
  // });
  // return res.data;
}