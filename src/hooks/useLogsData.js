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
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { inicio, fim } = getPeriodRange(period);

      let qAcessos = supabase
        .from('logs_acessos')
        .select('id, user_id, perfil, dispositivo, sessao_ativa, obra_id, data_hora')
        .gte('data_hora', inicio.toISOString())
        .lte('data_hora', fim.toISOString())
        .order('data_hora', { ascending: false })
        .limit(500);

      let qAcoes = supabase
        .from('logs_acoes')
        .select('id, user_id, acao, entidade, modulo, descricao, obra_id, data_hora')
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

      const trintaMinAtras = new Date(Date.now() - 30 * 60 * 1000);
      const [obrasRes, acessosRes, acoesRes, onlineAcessosRes, onlineAcoesRes] = await Promise.all([
        supabase.from('obras').select('id, nome').order('nome'),
        qAcessos,
        qAcoes,
        supabase.from('logs_acessos').select('user_id').gte('data_hora', trintaMinAtras.toISOString()),
        supabase.from('logs_acoes').select('user_id').gte('data_hora', trintaMinAtras.toISOString()),
      ]);


      const erros = [];
      if (acessosRes.error) erros.push(`logs_acessos: ${acessosRes.error.message}`);
      if (acoesRes.error) erros.push(`logs_acoes: ${acoesRes.error.message}`);
      if (erros.length > 0) {
        setError(erros.join(' | '));
      }

      const acessos = acessosRes.data || [];
      const acoes = acoesRes.data || [];

      const obraMap = Object.fromEntries((obrasRes.data || []).map(o => [String(o.id), o]));

      const allUserIds = [...new Set([
        ...acessos.map(r => r.user_id),
        ...acoes.map(r => r.user_id),
      ].filter(Boolean))];

      let userMap = {};
      if (allUserIds.length > 0) {
        const { data: usersData } = await supabase
          .from('usuarios')
          .select('id, nome, tipo_usuario')
          .in('id', allUserIds);
        userMap = Object.fromEntries((usersData || []).map(u => [String(u.id), u]));
      }

      const enrich = (row) => ({
        ...row,
        usuarios: userMap[String(row.user_id)] || null,
        obras: obraMap[String(row.obra_id)] || null,
      });

      const onlineIds = new Set(
        [...(onlineAcessosRes.data || []), ...(onlineAcoesRes.data || [])]
          .map(r => String(r.user_id))
          .filter(Boolean)
      );

      setObrasDisponiveis(obrasRes.data || []);
      setAcessosRaw(acessos.map(enrich));
      setAcoesRaw(acoes.map(enrich));
      setOnlineUserIds(onlineIds);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [obra_id, period, tipo_acao, perfil]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel('logs-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs_acessos' }, fetchData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs_acoes' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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

  const todayStats = useMemo(() => {
    const hoje = format(new Date(), 'yyyy-MM-dd');

    const acessosHoje = acessosRaw.filter(r => r.data_hora?.startsWith(hoje));
    const acoesHoje = acoesRaw.filter(r => r.data_hora?.startsWith(hoje));

    const byUser = {};

    acessosHoje.forEach(r => {
      const uid = String(r.user_id);
      if (!uid || uid === 'null') return;
      if (!byUser[uid]) byUser[uid] = {
        nome: r.usuarios?.nome || 'Desconhecido',
        tipo: r.usuarios?.tipo_usuario || '',
        acessos: 0, criações: 0, correcoes: 0, edicoes: 0, acoes: 0, obras: new Set(),
      };
      byUser[uid].acessos++;
      if (r.obra_id) byUser[uid].obras.add(String(r.obra_id));
    });

    acoesHoje.forEach(r => {
      const uid = String(r.user_id);
      if (!uid || uid === 'null') return;
      if (!byUser[uid]) byUser[uid] = {
        nome: r.usuarios?.nome || 'Desconhecido',
        tipo: r.usuarios?.tipo_usuario || '',
        acessos: 0, criações: 0, correcoes: 0, edicoes: 0, acoes: 0, obras: new Set(),
      };
      byUser[uid].acoes++;
      if (r.acao === 'Criação') byUser[uid].criações++;
      if (r.acao === 'Correção') byUser[uid].correcoes++;
      if (r.acao === 'Edição') byUser[uid].edicoes++;
      if (r.obra_id) byUser[uid].obras.add(String(r.obra_id));
    });

    const byObra = {};
    [...acessosHoje, ...acoesHoje].forEach(r => {
      if (!r.obra_id) return;
      const obraId = String(r.obra_id);
      const nome = r.obras?.nome || `Obra ${r.obra_id}`;
      if (!byObra[obraId]) byObra[obraId] = { nome, users: new Set(), acoes: 0, registos: 0, correcoes: 0 };
      if (r.user_id) byObra[obraId].users.add(String(r.user_id));
      if (r.acao === 'Criação' || r.acao === 'Edição') byObra[obraId].registos++;
      if (r.acao === 'Correção') byObra[obraId].correcoes++;
      if (r.acao) byObra[obraId].acoes++;
    });

    const utilizadoresAtivosHoje = Object.entries(byUser)
      .map(([uid, u]) => ({
        uid,
        nome: u.nome,
        categoria: tipoToCategoria(u.tipo),
        acessos: u.acessos,
        criações: u.criações,
        correcoes: u.correcoes,
        edicoes: u.edicoes,
        acoes: u.acoes,
        obras: u.obras.size,
        online: onlineUserIds.has(uid),
      }))
      .sort((a, b) => (b.acoes + b.acessos) - (a.acoes + a.acessos));

    const obrasAtivasHoje = Object.values(byObra)
      .map(o => ({ nome: o.nome, colaboradores: o.users.size, acoes: o.acoes, registos: o.registos, correcoes: o.correcoes }))
      .sort((a, b) => b.acoes - a.acoes);

    return {
      onlineAgoraCount: onlineUserIds.size,
      usuariosAtivosHojeCount: Object.keys(byUser).length,
      registosCriadosHoje: acoesHoje.filter(r => r.acao === 'Criação').length,
      correcoesHoje: acoesHoje.filter(r => r.acao === 'Correção').length,
      acoesTotaisHoje: acoesHoje.length,
      obrasAtivasHojeCount: Object.keys(byObra).length,
      utilizadoresAtivosHoje,
      obrasAtivasHoje,
    };
  }, [acessosRaw, acoesRaw, onlineUserIds]);

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
    acessosData, acoesData, statsCards, todayStats,
    utilizacaoData, colaboradoresData, obrasData, subempreiteirosData,
    topCollaborators, topObras, topPages,
    obrasDisponiveis, loading, error, refresh: fetchData,
  };
}
