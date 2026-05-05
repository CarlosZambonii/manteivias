import { supabase } from '@/lib/customSupabaseClient';

const getDispositivo = () =>
  /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop';

const tipoToPerfil = (tipo) => {
  const map = {
    admin_star: 'Admin Star', admin: 'Admin', admin_c: 'Admin (Leitura)',
    admin_sub: 'Admin Sub.', encarregado: 'Encarregado', rh: 'RH',
  };
  return map[tipo?.toLowerCase()] || 'Colaborador';
};

export function logAcesso(user, obraId = null) {
  if (!user?.id) return;
  supabase.from('logs_acessos').insert({
    user_id: user.id,
    perfil: tipoToPerfil(user.tipo_usuario),
    dispositivo: getDispositivo(),
    sessao_ativa: true,
    obra_id: obraId ?? null,
    data_hora: new Date().toISOString(),
  }).then(({ error }) => {
    if (error) console.warn('[log] acesso:', error.message);
  });
}

export function logAcao(user, { acao, entidade, modulo, descricao = '', obraId = null }) {
  if (!user?.id) return;
  supabase.from('logs_acoes').insert({
    user_id: user.id,
    acao,
    entidade,
    modulo,
    descricao,
    obra_id: obraId ?? null,
    data_hora: new Date().toISOString(),
  }).then(({ error }) => {
    if (error) console.warn('[log] acao:', error.message);
  });
}
