export const stats = [
  { label: "Atualizações este mês", value: 6 },
  { label: "Tickets abertos",       value: 14 },
  { label: "Em análise",            value: 4 },
  { label: "Resolvidos",            value: 9 },
  { label: "Sugestões enviadas",    value: 7 },
  { label: "Pedidos de ajuda",      value: 3 },
];

export const tickets = [
  {
    code: "BUG-014",
    title: "Erro no registo de saída da tarde",
    date: "10 mar 2026",
    module: "Registos",
    type: "Erro",
    priority: "Alta",
    status: "Em análise",
    description: "Ao concluir o registo da tarde, o sistema não grava a hora final.",
  },
  {
    code: "SUP-008",
    title: "Dúvida sobre validação de férias",
    date: "8 mar 2026",
    module: "Férias",
    type: "Ajuda",
    priority: "Média",
    status: "Recebido",
    description: "Pedido aprovado não aparece no resumo mensal.",
  },
  {
    code: "MEL-021",
    title: "Adicionar filtro por encarregado na exportação",
    date: "5 mar 2026",
    module: "Exportação",
    type: "Melhoria",
    priority: "Média",
    status: "Planeado",
    description: "Sugestão para facilitar filtragem da folha de ponto.",
  },
  {
    code: "BUG-012",
    title: "Exportação de PDF com caracteres cortados",
    date: "2 mar 2026",
    module: "Exportação",
    type: "Erro",
    priority: "Baixa",
    status: "Em desenvolvimento",
    description: "Alguns nomes longos aparecem truncados na coluna de observações.",
  },
  {
    code: "MEL-019",
    title: "Notificações push de fim de turno",
    date: "28 fev 2026",
    module: "Notificações",
    type: "Melhoria",
    priority: "Baixa",
    status: "Planeado",
    description: "Alertar colaborador quando se esquece de fechar o turno.",
  },
  {
    code: "SUP-006",
    title: "Como corrigir um registo antigo?",
    date: "25 fev 2026",
    module: "Registos",
    type: "Ajuda",
    priority: "Baixa",
    status: "Resolvido",
    description: "Procedimento para editar registos com mais de 7 dias.",
  },
];

export const updates = [
  {
    title: "Atualizações — 02.3",
    date: "12 mar 2026",
    items: [
      "Ajustes no fecho automático",
      "Melhorias no histórico",
      "Otimização mobile",
    ],
  },
  {
    title: "Atualizações — 02.2",
    date: "28 fev 2026",
    items: [
      "Novo formato CSV com separador configurável",
      "Correção de acentos em ficheiros PDF",
      "Performance melhorada em exportações grandes",
    ],
  },
  {
    title: "Atualizações — 02.1",
    date: "14 fev 2026",
    items: [
      "Fluxo de aprovação de férias simplificado",
      "Resumo mensal redesenhado",
      "Suporte a meio-dia de férias",
    ],
  },
  {
    title: "Atualizações — 01.1",
    date: "1 fev 2026",
    items: [
      "Acessos & Perfis",
      "Ajuste de permissões dos utilizadores",
      "Módulo Frotas visível apenas para quem tem responsabilidade",
      "Área Organizacional novamente disponível para utilizadores autorizados",
    ],
  },
];

export const tabs = [
  { key: "atualizacoes", label: "Atualizações" },
  { key: "meus",         label: "Meus Tickets" },
  { key: "ajuda",        label: "Ajuda" },
  { key: "melhorias",    label: "Melhorias" },
  { key: "erros",        label: "Erros & Correções" },
  { key: "futuro",       label: "Futuro" },
];