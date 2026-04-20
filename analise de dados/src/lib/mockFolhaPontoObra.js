// Mock para "Folha de Ponto por Obra" (Encarregado) — Agosto 2025

export const MOCK_FOLHA_PONTO_OBRA = {
  mes: "Agosto",
  ano: 2025,
  obra: "146 Construção Habitação e Urbanização do Loteamento",
  tipo: "Por Obra",
  colaboradores: [
    { id: 87,  numero: "87",  nome: "Daniel Osório Dias dos Santos" },
    { id: 134, numero: "134", nome: "Basilio Manuel Soares Cruz" },
    { id: 21,  numero: "21",  nome: "Bruno José Afonso Batista" },
    { id: 170, numero: "170", nome: "Carlos Alberto Rodrigues Passos" },
    { id: 355, numero: "355", nome: "Anilzo dos Santos Vaz de Sousa" },
    { id: 356, numero: "356", nome: "Kevin Brito Sá" },
    { id: 358, numero: "358", nome: "Larbi Khatir" },
  ],
  registos: [
    // Daniel — presença normal, F a 21
    ...[4,5,6,7,8,11,12,13,14,15,18,19,20,22,25,26,27,28,29].map(d => ({
      colaborador_id: 87, dia: d, codigo: ""
    })),
    { colaborador_id: 87, dia: 21, codigo: "F" },

    // Basilio — F a 21
    { colaborador_id: 134, dia: 21, codigo: "F" },

    // Bruno — F a 21
    { colaborador_id: 21, dia: 21, codigo: "F" },

    // Carlos — presença normal
    { colaborador_id: 170, dia: 21, codigo: "F" },

    // Anilzo — presença normal
    { colaborador_id: 355, dia: 21, codigo: "F" },

    // Kevin — presença normal
    { colaborador_id: 356, dia: 21, codigo: "F" },

    // Larbi — presença normal
    { colaborador_id: 358, dia: 21, codigo: "F" },
  ],
};