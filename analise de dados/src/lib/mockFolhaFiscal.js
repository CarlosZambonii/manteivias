// Mock para "Folha Fiscal" (Operacional/Encarregado) — Fevereiro 2026

export const MOCK_FOLHA_FISCAL = {
  mes: "Fevereiro",
  ano: 2026,
  obra: "146 Construção Habitação e Urbanização do Loteamento",
  empresa: "Manteivias",
  colaboradores: [
    { id: 1, nome: "Mara Sana",              empresa: "Manteivias" },
    { id: 2, nome: "José Monteiro Carvalho", empresa: "Manteivias" },
    { id: 3, nome: "Bruno Afonso Batista",   empresa: "Manteivias" },
    { id: 4, nome: "Carlos Martin Cruz",     empresa: "Manteivias" },
    { id: 5, nome: "Daniel Osório Santos",   empresa: "Manteivias" },
  ],
  registos: [
    // Mara Sana — Segunda: Manhã=8, Tarde=4
    { colaborador_id: 1, dia: 2,  manha: "8",  tarde: "4",  av: "" },
    { colaborador_id: 1, dia: 3,  manha: "8",  tarde: "4",  av: "" },
    { colaborador_id: 1, dia: 4,  manha: "8",  tarde: "4",  av: "" },
    { colaborador_id: 1, dia: 5,  manha: "8",  tarde: "4",  av: "" },
    { colaborador_id: 1, dia: 6,  manha: "8",  tarde: "4",  av: "" },
    // José
    { colaborador_id: 2, dia: 2,  manha: "8",  tarde: "4",  av: "" },
    { colaborador_id: 2, dia: 3,  manha: "8",  tarde: "4",  av: "" },
    { colaborador_id: 2, dia: 4,  manha: "8",  tarde: "4",  av: "" },
    { colaborador_id: 2, dia: 5,  manha: "8",  tarde: "4",  av: "" },
    { colaborador_id: 2, dia: 6,  manha: "8",  tarde: "4",  av: "" },
  ],
};