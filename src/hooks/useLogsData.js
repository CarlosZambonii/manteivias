import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

const tipoToCategoria = (tipo) => {
  const map = {
    encarregado: 'Encarregados',
    admin_sub: 'Subempreiteiros',
    rh: 'Pessoal Escritório',
    admin: 'Pessoal Escritório',
    admin_star: 'Pessoal Escritório',
    admin_c: 'Pessoal Escritório',
  };
  return map[tipo?.toLowerCase()] || 'Funcionários';
};

const tipoToPerfil = (tipo) => {
  const map = {
    admin_star: 'Admin Star',
    admin: 'Admin',
    admin_c: 'Admin (Leitura)',
    admin_sub: 'Admin Sub.',
    encarregado: 'Encarregado',
    rh: 'RH',
  };
  return map[tipo?.toLowerCase()] || 'Colaborador';
};

const getAtividade = (acessos, registos) => {
  if (acessos > 30 || registos > 150) return 'alta';
  if (acessos > 15 || registos > 60) return 'media';
  return 'baixa';
};

function getPeriodRange(period) {
  const now = new Date();
  if (period === 'mes_anterior') {
    return { inicio: startOfMonth(subMonths(now, 1)), fim: endOfMonth(subMonths(now, 1)) };
  }
  if (period === '2_meses') {
    return { inicio: startOfMonth(subMonths(now, 2)), fim: endOfMonth(now) };
  }
  if (period === '3_meses') {
    return { inicio: startOfMonth(subMonths(now, 3)), fim: endOfMonth(now) };
  }
  return { inicio: startOfMonth(now), fim: endOfMonth(now) };
}

export function useLogsData({ obra_id, period, tipo_acao, perfil } = {}) {
  const [acessosRaw, setAcessosRaw] = useState([]);
  const [acoesRaw, setAcoesRaw] = useState([]);
  const [obrasDisponiveis, setObrasDisponiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { inicio, fim } = getPeriodRange(period);

      let qAcessos = supabase
        .from('logs_acessos')
        .select('*, usuarios:user_id(id, nome, tipo_usuario), obras:obra_id(id, nome)')
        .gte('data_hora', inicio.toISOString())
        .lte('data_hora', fim.toISOString())
        .order('data_hora', { ascending: false })
        .limit(500);

      let qAcoes = supabase
        .from('logs_acoes')
        .select('*, usuarios:user_id(id, nome, tipo_usuario), obras:obra_id(id, nome)')
        .gte('data_hora', inicio.toISOString())
        .lte('data_hora', fim.toISOString())
        .order('data_hora', { ascending: false })
        .limit(500);

      if (obra_id && obra_id !== 'todas') {
        qAcessos = qAcessos.eq('obra_id', obra_id);
        qAcoes = qAcoes.eq('obra_id', obra_id);
      }
      if (perfil && perfil !== 'todos-perfis') {
        qAcessos = qAcessos.eq('perfil', perfil);
      }
      if (tipo_acao && tipo_acao !== 'todos') {
        const acaoMap = {
          criacao: 'Criação', edicao: 'Edição', exclusao: 'Exclusão',
          correcao: 'Correção', visualizacao: 'Visualização',
        };
        qAcoes = qAcoes.eq('acao', acaoMap[tipo_acao] || tipo_acao);
      }

      const [obrasRes, acessosRes, acoesRes] = await Promise.all([
        supabase.from('obras').select('id, nome').order('nome'),
        qAcessos,
        qAcoes,
      ]);

      setObrasDisponiveis(obrasRes.data || []);
      setAcessosRaw(acessosRes.data || []);
      setAcoesRaw(acoesRes.data || []);

      if (acessosRes.error) console.warn('logs_acessos:', acessosRes.error.message);
      if (acoesRes.error) console.warn('logs_acoes:', acoesRes.error.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [obra_id, period, tipo_acao, perfil]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const acessosData = useMemo(() =>
    acessosRaw.map(row => ({
      data: format(new Date(row.data_hora), 'dd/MM/yyyy HH:mm'),
      utilizador: row.usuarios?.nome || 'Desconhecido',
      categoria: tipoToCategoria(row.usuarios?.tipo_usuario),
      perfil: tipoToPerfil(row.usuarios?.tipo_usuario),
      dispositivo: row.dispositivo || 'Desktop',
      sessao: row.sessao_ativa ? 'Sessão ativa' : 'Sessão expirada',
    })), [acessosRaw]);

  const acoesData = useMemo(() =>
    acoesRaw.map(row => ({
      data: format(new Date(row.data_hora), 'dd/MM/yyyy HH:mm'),
      utilizador: row.usuarios?.nome || 'Desconhecido',
      categoria: tipoToCategoria(row.usuarios?.tipo_usuario),
      acao: row.acao,
      entidade: row.entidade,
      modulo: row.modulo,
      descricao: row.descricao || '',
    })), [acoesRaw]);

  const statsCards = useMemo(() => {
    const hoje = format(new Date(), 'yyyy-MM-dd');
    const usersHoje = new Set(
      acessosRaw.filter(r => r.data_hora?.startsWith(hoje)).map(r => r.user_id)
    ).size;
    return [
      { label: 'Utilizadores ativos hoje', value: usersHoje, icon: 'Users' },
      { label: 'Total de acessos no período', value: acessosRaw.length, icon: 'LogIn' },
      { label: 'Registos criados', value: acoesRaw.filter(r => r.acao === 'Criação').length, icon: 'FilePlus' },
      { label: 'Correções realizadas', value: acoesRaw.filter(r => r.acao === 'Correção').length, icon: 'Wrench' },
      { label: 'Ações totais', value: acoesRaw.length, icon: 'Activity' },
    ];
  }, [acessosRaw, acoesRaw]);

  const utilizacaoData = useMemo(() => {
    const total = acoesRaw.length || 1;
    const byModule = {};
    acoesRaw.forEach(row => {
      if (!row.modulo) return;
      if (!byModule[row.modulo]) byModule[row.modulo] = { visitas: 0, users: new Set() };
      byModule[row.modulo].visitas++;
      if (row.user_id) byModule[row.modulo].users.add(row.user_id);
    });
    return Object.entries(byModule)
      .map(([pagina, { visitas, users }]) => ({
        pagina, visitas,
        utilizadores: users.size,
        percentagem: Math.round((visitas / total) * 100),
      }))
      .sort((a, b) => b.visitas - a.visitas);
  }, [acoesRaw]);

  const colaboradoresData = useMemo(() => {
    const byUser = {};
    acessosRaw.forEach(row => {
      const uid = row.user_id;
      if (!uid) return;
      if (!byUser[uid]) byUser[uid] = { nome: row.usuarios?.nome || 'Desconhecido', tipo: row.usuarios?.tipo_usuario || '', acessos: 0, registos: 0, correcoes: 0 };
      byUser[uid].acessos++;
    });
    acoesRaw.forEach(row => {
      const uid = row.user_id;
      if (!uid) return;
      if (!byUser[uid]) byUser[uid] = { nome: row.usuarios?.nome || 'Desconhecido', tipo: row.usuarios?.tipo_usuario || '', acessos: 0, registos: 0, correcoes: 0 };
      if (row.acao === 'Criação' || row.acao === 'Edição') byUser[uid].registos++;
      if (row.acao === 'Correção') byUser[uid].correcoes++;
    });
    return Object.values(byUser).map(c => ({
      nome: c.nome,
      categoria: tipoToCategoria(c.tipo),
      acessos: c.acessos, registos: c.registos, correcoes: c.correcoes,
      atividade: getAtividade(c.acessos, c.registos),
    }));
  }, [acessosRaw, acoesRaw]);

  const obrasData = useMemo(() => {
    const byObra = {};
    acessosRaw.forEach(row => {
      if (!row.obra_id) return;
      const nome = row.obras?.nome || `Obra ${row.obra_id}`;
      if (!byObra[row.obra_id]) byObra[row.obra_id] = { nome, acessos: 0, registos: 0, colaboradores: new Set() };
      byObra[row.obra_id].acessos++;
      if (row.user_id) byObra[row.obra_id].colaboradores.add(row.user_id);
    });
    acoesRaw.forEach(row => {
      if (!row.obra_id) return;
      const nome = row.obras?.nome || `Obra ${row.obra_id}`;
      if (!byObra[row.obra_id]) byObra[row.obra_id] = { nome, acessos: 0, registos: 0, colaboradores: new Set() };
      if (row.acao === 'Criação' || row.acao === 'Edição') byObra[row.obra_id].registos++;
      if (row.user_id) byObra[row.obra_id].colaboradores.add(row.user_id);
    });
    return Object.values(byObra).map(o => ({ nome: o.nome, acessos: o.acessos, registos: o.registos, colaboradores: o.colaboradores.size }));
  }, [acessosRaw, acoesRaw]);

  // Subempreiteiros são users com tipo_usuario = 'admin_sub'
  // A obra associada vem do obra_id registado em cada ação
  const subempreiteirosData = useMemo(() => {
    const bySub = {};
    const obraByUser = {};

    acoesRaw.forEach(row => {
      const tipo = row.usuarios?.tipo_usuario?.toLowerCase();
      if (tipo !== 'admin_sub') return;
      const uid = row.user_id;
      if (!uid) return;
      if (!bySub[uid]) bySub[uid] = { nome: row.usuarios?.nome || 'Desconhecido', registos: 0, correcoes: 0 };
      if (row.acao === 'Criação' || row.acao === 'Edição') bySub[uid].registos++;
      if (row.acao === 'Correção') bySub[uid].correcoes++;
      if (row.obras?.nome && !obraByUser[uid]) obraByUser[uid] = row.obras.nome;
    });

    acessosRaw.forEach(row => {
      const tipo = row.usuarios?.tipo_usuario?.toLowerCase();
      if (tipo !== 'admin_sub') return;
      const uid = row.user_id;
      if (!uid) return;
      if (!bySub[uid]) bySub[uid] = { nome: row.usuarios?.nome || 'Desconhecido', registos: 0, correcoes: 0 };
      if (row.obras?.nome && !obraByUser[uid]) obraByUser[uid] = row.obras.nome;
    });

    return Object.entries(bySub).map(([uid, s]) => ({
      nome: s.nome,
      obra: obraByUser[uid] || '—',
      registos: s.registos,
      correcoes: s.correcoes,
      atividade: getAtividade(0, s.registos),
    }));
  }, [acoesRaw, acessosRaw]);

  const topCollaborators = useMemo(() =>
    [...colaboradoresData]
      .sort((a, b) => b.acessos - a.acessos).slice(0, 10)
      .map(c => ({ name: c.nome, acessos: c.acessos, acoes: c.registos + c.correcoes, categoria: c.categoria })),
  [colaboradoresData]);

  const topObras = useMemo(() =>
    [...obrasData].sort((a, b) => b.acessos - a.acessos).slice(0, 10)
      .map(o => ({ name: o.nome, acessos: o.acessos, registos: o.registos })),
  [obrasData]);

  const topPages = useMemo(() =>
    [...utilizacaoData].sort((a, b) => b.visitas - a.visitas).slice(0, 10)
      .map(u => ({ page: u.pagina, visitas: u.visitas })),
  [utilizacaoData]);

  return {
    acessosData, acoesData, statsCards,
    utilizacaoData, colaboradoresData, obrasData, subempreiteirosData,
    topCollaborators, topObras, topPages,
    obrasDisponiveis, loading, error, refresh: fetchData,
  };
}
