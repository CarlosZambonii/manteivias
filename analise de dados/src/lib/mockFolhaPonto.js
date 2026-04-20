// Mock fiel ao Excel "Folha de Ponto (Justificações)" — Agosto 2025

export const MOCK_FOLHA_PONTO = {
  mes: "Agosto",
  ano: 2025,
  obra: "146 Construção Habitação e Urbanização do Loteamento",
  tipo: "Justificações",
  colaboradores: [
    { id: 1,   numero: "1",   nome: "Pedro Nuno Gomes Almeida" },
    { id: 7,   numero: "7",   nome: "José Monteiro Carvalho" },
    { id: 9,   numero: "9",   nome: "Sandra Isabel Lourenço Almeida" },
    { id: 14,  numero: "14",  nome: "João Paulo Saraiva Leitão" },
    { id: 21,  numero: "21",  nome: "Bruno José Afonso Batista" },
    { id: 87,  numero: "87",  nome: "Daniel Osório Dias dos Santos" },
    { id: 134, numero: "134", nome: "Basilio Manuel Soares Cruz" },
    { id: 145, numero: "145", nome: "Maria de Fátima Fernandes Figueiredo" },
    { id: 149, numero: "149", nome: "Jose Manuel Gomes Martins" },
    { id: 152, numero: "152", nome: "Flávio Evanilson Guimarães M. Ramos" },
    { id: 167, numero: "167", nome: "Ana Catarina Carvalho Costa", cor: "#00B050" },
    { id: 170, numero: "170", nome: "Carlos Alberto Rodrigues Passos" },
    { id: 346, numero: "346", nome: "Mohamed Sabri Keddaoui" },
    { id: 347, numero: "347", nome: "Amadou Diallo" },
    { id: 349, numero: "349", nome: "Carlos Martin Cruz" },
    { id: 350, numero: "350", nome: "Paula Cristina da Fonseca Caçador" },
    { id: 352, numero: "352", nome: "Joaquim Ramos Figueiredo", cor: "#FF7F00" },
    { id: 353, numero: "353", nome: "Israel Gomes Pinto Junior", cor: "#FF7F00" },
    { id: 355, numero: "355", nome: "Anilzo dos Santos Vaz de Sousa" },
    { id: 356, numero: "356", nome: "Kevin Brito Sá" },
    { id: 357, numero: "357", nome: "António sebastião Sá" },
    { id: 358, numero: "358", nome: "Larbi Khatir" },
    { id: 359, numero: "359", nome: "Roboão Mae Larus Faria de Carvalho", cor: "#FF7F00" },
  ],
  registos: [
    // Pedro Nuno — FE nas semanas centrais, F a 21
    { colaborador_id: 1, dia: 11, codigo: "FE" },
    { colaborador_id: 1, dia: 12, codigo: "FE" },
    { colaborador_id: 1, dia: 13, codigo: "FE" },
    { colaborador_id: 1, dia: 18, codigo: "FE" },
    { colaborador_id: 1, dia: 19, codigo: "FE" },
    { colaborador_id: 1, dia: 20, codigo: "FE" },
    { colaborador_id: 1, dia: 21, codigo: "F" },

    // José Monteiro — FE + F
    { colaborador_id: 7, dia: 18, codigo: "FE" },
    { colaborador_id: 7, dia: 19, codigo: "FE" },
    { colaborador_id: 7, dia: 20, codigo: "FE" },
    { colaborador_id: 7, dia: 21, codigo: "F" },

    // Sandra — BX todo o mês
    ...[4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29].map(d => ({
      colaborador_id: 9, dia: d, codigo: "BX"
    })),

    // João Paulo — FE + F
    { colaborador_id: 14, dia: 11, codigo: "FE" },
    { colaborador_id: 14, dia: 12, codigo: "FE" },
    { colaborador_id: 14, dia: 13, codigo: "FE" },
    { colaborador_id: 14, dia: 14, codigo: "FE" },
    { colaborador_id: 14, dia: 15, codigo: "FE" },
    { colaborador_id: 14, dia: 21, codigo: "F" },

    // Bruno — F
    { colaborador_id: 21, dia: 21, codigo: "F" },

    // Daniel — F
    { colaborador_id: 87, dia: 21, codigo: "F" },

    // Basilio — F
    { colaborador_id: 134, dia: 21, codigo: "F" },

    // Maria Fátima — FE + F
    { colaborador_id: 145, dia: 18, codigo: "FE" },
    { colaborador_id: 145, dia: 19, codigo: "FE" },
    { colaborador_id: 145, dia: 20, codigo: "FE" },
    { colaborador_id: 145, dia: 25, codigo: "FE" },
    { colaborador_id: 145, dia: 26, codigo: "FE" },
    { colaborador_id: 145, dia: 21, codigo: "F" },

    // Jose Manuel — FE + F
    { colaborador_id: 149, dia: 4,  codigo: "FE" },
    { colaborador_id: 149, dia: 5,  codigo: "FE" },
    { colaborador_id: 149, dia: 6,  codigo: "FE" },
    { colaborador_id: 149, dia: 7,  codigo: "FE" },
    { colaborador_id: 149, dia: 8,  codigo: "FE" },
    { colaborador_id: 149, dia: 21, codigo: "F" },

    // Flávio — F
    { colaborador_id: 152, dia: 21, codigo: "F" },

    // Ana Catarina — LP todo o mês
    ...[4,5,6,7,8,11,12,13,14,15,18,19,20,21,22,25,26,27,28,29].map(d => ({
      colaborador_id: 167, dia: d, codigo: "LP"
    })),

    // Restantes — só F a 21
    ...[170,346,347,349,350,352,353,355,356,357,358,359].map(id => ({
      colaborador_id: id, dia: 21, codigo: "F"
    })),
  ],
};