export const categorias = ["Todas as Categorias", "Encarregados", "Engenheiros", "Funcionários", "Pessoal Escritório", "Geral"];

export const statsCards = [
  { label: "Utilizadores ativos hoje", value: 28, icon: "Users" },
  { label: "Total de acessos no mês", value: 312, icon: "LogIn" },
  { label: "Registos criados", value: 540, icon: "FilePlus" },
  { label: "Correções realizadas", value: 76, icon: "Wrench" },
  { label: "Ações totais", value: 1240, icon: "Activity" },
];

export const topCollaborators = [
  { name: "João Silva", acessos: 48, acoes: 210, categoria: "Funcionários" },
  { name: "Ana Costa", acessos: 42, acoes: 185, categoria: "Encarregados" },
  { name: "Carlos Mendes", acessos: 38, acoes: 164, categoria: "Engenheiros" },
  { name: "Maria Fernandes", acessos: 35, acoes: 148, categoria: "Pessoal Escritório" },
  { name: "Pedro Santos", acessos: 30, acoes: 132, categoria: "Funcionários" },
];

export const topObras = [
  { name: "Obra Lote 7 - Maia", acessos: 62, registos: 180 },
  { name: "Residencial Boavista", acessos: 54, registos: 156 },
  { name: "Edifício Central Park", acessos: 48, registos: 134 },
  { name: "Condomínio Estrela", acessos: 40, registos: 112 },
  { name: "Torre Atlântico", acessos: 36, registos: 98 },
];

export const topPages = [
  { page: "Registo de Ponto", visitas: 210 },
  { page: "Registo Diário de Obra", visitas: 185 },
  { page: "Central de Validações", visitas: 142 },
  { page: "Área Organizacional", visitas: 118 },
  { page: "Gestão de Subempreiteiros", visitas: 96 },
  { page: "Dashboard", visitas: 88 },
];

export const acessosData = [
  { data: "27/04/2026 08:12", utilizador: "João Silva", categoria: "Funcionários", perfil: "Colaborador", dispositivo: "Mobile", sessao: "Sessão ativa" },
  { data: "27/04/2026 08:15", utilizador: "Ana Costa", categoria: "Encarregados", perfil: "Encarregado", dispositivo: "Desktop", sessao: "Sessão ativa" },
  { data: "27/04/2026 08:22", utilizador: "Carlos Mendes", categoria: "Engenheiros", perfil: "Admin", dispositivo: "Desktop", sessao: "Sessão ativa" },
  { data: "27/04/2026 08:30", utilizador: "Maria Fernandes", categoria: "Pessoal Escritório", perfil: "Colaborador", dispositivo: "Mobile", sessao: "Sessão ativa" },
  { data: "27/04/2026 08:45", utilizador: "Pedro Santos", categoria: "Funcionários", perfil: "Colaborador", dispositivo: "Mobile", sessao: "Sessão expirada" },
  { data: "27/04/2026 09:01", utilizador: "Sofia Oliveira", categoria: "Encarregados", perfil: "Encarregado", dispositivo: "Desktop", sessao: "Sessão ativa" },
  { data: "27/04/2026 09:12", utilizador: "Rui Almeida", categoria: "Funcionários", perfil: "Colaborador", dispositivo: "Mobile", sessao: "Sessão ativa" },
  { data: "27/04/2026 09:30", utilizador: "Tiago Pereira", categoria: "Engenheiros", perfil: "Admin", dispositivo: "Desktop", sessao: "Sessão ativa" },
  { data: "26/04/2026 17:45", utilizador: "João Silva", categoria: "Funcionários", perfil: "Colaborador", dispositivo: "Mobile", sessao: "Sessão expirada" },
  { data: "26/04/2026 16:20", utilizador: "Ana Costa", categoria: "Encarregados", perfil: "Encarregado", dispositivo: "Desktop", sessao: "Sessão expirada" },
  { data: "26/04/2026 14:00", utilizador: "Beatriz Lima", categoria: "Pessoal Escritório", perfil: "Colaborador", dispositivo: "Desktop", sessao: "Sessão expirada" },
  { data: "26/04/2026 11:30", utilizador: "Nuno Ferreira", categoria: "Geral", perfil: "Colaborador", dispositivo: "Mobile", sessao: "Sessão expirada" },
];

export const acoesData = [
  { data: "27/04/2026 09:15", utilizador: "João Silva", categoria: "Funcionários", acao: "Criação", entidade: "Registo de Ponto", modulo: "Ponto", descricao: "Criou registo de ponto — entrada 08:00" },
  { data: "27/04/2026 09:10", utilizador: "Ana Costa", categoria: "Encarregados", acao: "Edição", entidade: "Utilizador", modulo: "Organizacional", descricao: "Editou utilizador Carlos Mendes" },
  { data: "27/04/2026 09:05", utilizador: "Carlos Mendes", categoria: "Engenheiros", acao: "Exclusão", entidade: "Obra", modulo: "Obras", descricao: "Excluiu obra Lote Antigo 3" },
  { data: "27/04/2026 08:55", utilizador: "Maria Fernandes", categoria: "Pessoal Escritório", acao: "Correção", entidade: "Registo Diário", modulo: "RDO", descricao: "Corrigiu registo diário de 25/04" },
  { data: "27/04/2026 08:50", utilizador: "Pedro Santos", categoria: "Funcionários", acao: "Visualização", entidade: "Validações", modulo: "Validações", descricao: "Visualizou validações pendentes" },
  { data: "27/04/2026 08:42", utilizador: "Sofia Oliveira", categoria: "Encarregados", acao: "Criação", entidade: "Subempreiteiro", modulo: "Subempreiteiros", descricao: "Criou subempreiteiro Eletroforte Lda" },
  { data: "27/04/2026 08:35", utilizador: "Rui Almeida", categoria: "Funcionários", acao: "Edição", entidade: "Registo de Ponto", modulo: "Ponto", descricao: "Editou hora de saída para 18:30" },
  { data: "27/04/2026 08:20", utilizador: "Tiago Pereira", categoria: "Engenheiros", acao: "Criação", entidade: "Obra", modulo: "Obras", descricao: "Criou obra Torre Atlântico II" },
  { data: "26/04/2026 17:30", utilizador: "João Silva", categoria: "Funcionários", acao: "Correção", entidade: "Registo de Ponto", modulo: "Ponto", descricao: "Corrigiu hora de entrada de 08:15 para 08:00" },
  { data: "26/04/2026 16:45", utilizador: "Ana Costa", categoria: "Encarregados", acao: "Visualização", entidade: "Dashboard", modulo: "Dashboard", descricao: "Visualizou dashboard geral" },
  { data: "26/04/2026 15:20", utilizador: "Carlos Mendes", categoria: "Engenheiros", acao: "Exclusão", entidade: "Colaborador", modulo: "Organizacional", descricao: "Removeu colaborador inativo Manuel Lopes" },
  { data: "26/04/2026 14:10", utilizador: "Maria Fernandes", categoria: "Pessoal Escritório", acao: "Criação", entidade: "Registo Diário", modulo: "RDO", descricao: "Criou registo diário para Obra Lote 7" },
  { data: "26/04/2026 13:00", utilizador: "Beatriz Lima", categoria: "Pessoal Escritório", acao: "Visualização", entidade: "Dashboard", modulo: "Dashboard", descricao: "Visualizou dashboard geral" },
  { data: "26/04/2026 10:15", utilizador: "Nuno Ferreira", categoria: "Geral", acao: "Criação", entidade: "Registo de Ponto", modulo: "Ponto", descricao: "Criou registo de ponto — entrada 09:00" },
];

export const utilizacaoData = [
  { pagina: "Registo de Ponto", visitas: 210, utilizadores: 18, percentagem: 65 },
  { pagina: "Registo Diário de Obra", visitas: 185, utilizadores: 14, percentagem: 57 },
  { pagina: "Central de Validações", visitas: 142, utilizadores: 8, percentagem: 44 },
  { pagina: "Área Organizacional", visitas: 118, utilizadores: 6, percentagem: 36 },
  { pagina: "Gestão de Subempreiteiros", visitas: 96, utilizadores: 10, percentagem: 30 },
  { pagina: "Dashboard", visitas: 88, utilizadores: 22, percentagem: 27 },
  { pagina: "Central de Logs", visitas: 52, utilizadores: 3, percentagem: 16 },
  { pagina: "Definições", visitas: 34, utilizadores: 2, percentagem: 10 },
];

export const colaboradoresData = [
  { nome: "João Silva", categoria: "Funcionários", acessos: 48, registos: 210, correcoes: 12, atividade: "alta" },
  { nome: "Ana Costa", categoria: "Encarregados", acessos: 42, registos: 185, correcoes: 8, atividade: "alta" },
  { nome: "Carlos Mendes", categoria: "Engenheiros", acessos: 38, registos: 164, correcoes: 15, atividade: "alta" },
  { nome: "Maria Fernandes", categoria: "Pessoal Escritório", acessos: 35, registos: 148, correcoes: 6, atividade: "media" },
  { nome: "Pedro Santos", categoria: "Funcionários", acessos: 30, registos: 132, correcoes: 4, atividade: "media" },
  { nome: "Sofia Oliveira", categoria: "Encarregados", acessos: 26, registos: 98, correcoes: 3, atividade: "media" },
  { nome: "Rui Almeida", categoria: "Funcionários", acessos: 18, registos: 76, correcoes: 2, atividade: "baixa" },
  { nome: "Tiago Pereira", categoria: "Engenheiros", acessos: 14, registos: 54, correcoes: 1, atividade: "baixa" },
  { nome: "Inês Rodrigues", categoria: "Pessoal Escritório", acessos: 10, registos: 38, correcoes: 0, atividade: "baixa" },
  { nome: "Beatriz Lima", categoria: "Pessoal Escritório", acessos: 8, registos: 28, correcoes: 0, atividade: "baixa" },
  { nome: "Nuno Ferreira", categoria: "Geral", acessos: 6, registos: 22, correcoes: 1, atividade: "baixa" },
];

export const obrasData = [
  { nome: "Obra Lote 7 - Maia", acessos: 62, registos: 180, colaboradores: 8 },
  { nome: "Residencial Boavista", acessos: 54, registos: 156, colaboradores: 6 },
  { nome: "Edifício Central Park", acessos: 48, registos: 134, colaboradores: 7 },
  { nome: "Condomínio Estrela", acessos: 40, registos: 112, colaboradores: 5 },
  { nome: "Torre Atlântico", acessos: 36, registos: 98, colaboradores: 4 },
  { nome: "Loteamento Norte", acessos: 28, registos: 72, colaboradores: 3 },
];

export const subempreiteirosData = [
  { nome: "Eletroforte Lda", obra: "Obra Lote 7 - Maia", registos: 45, correcoes: 3, atividade: "alta" },
  { nome: "Canaliza+", obra: "Residencial Boavista", registos: 38, correcoes: 5, atividade: "alta" },
  { nome: "TerraMovel SA", obra: "Edifício Central Park", registos: 32, correcoes: 2, atividade: "media" },
  { nome: "Pinturas Minho", obra: "Condomínio Estrela", registos: 28, correcoes: 1, atividade: "media" },
  { nome: "Serralharia Duarte", obra: "Torre Atlântico", registos: 18, correcoes: 4, atividade: "baixa" },
  { nome: "IsoTérmica Lda", obra: "Obra Lote 7 - Maia", registos: 14, correcoes: 0, atividade: "baixa" },
  { nome: "Hidráulica Norte", obra: "Loteamento Norte", registos: 22, correcoes: 2, atividade: "media" },
];