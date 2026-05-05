import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const TYPE_PREFIX = { Erro: 'BUG', Ajuda: 'SUP', Melhoria: 'MEL', Futuro: 'FUT', Atualização: 'UPD' };
const FORM_TYPE_MAP = { ticket: 'Ajuda', ajuda: 'Ajuda', erro: 'Erro', melhoria: 'Melhoria', futuro: 'Futuro' };

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toTicket(row) {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    date: formatDate(row.created_at),
    module: row.module || 'Outro',
    type: row.type,
    priority: row.priority || 'Média',
    status: row.status,
    description: row.content || '',
    attachmentUrl: row.attachment_url || null,
  };
}

function toUpdate(row) {
  return {
    id: row.id,
    title: `Atualizações — ${row.version || '??'}`,
    date: formatDate(row.created_at),
    items: Array.isArray(row.items) ? row.items : [],
  };
}

async function generateCode(type) {
  const prefix = TYPE_PREFIX[type] || 'TKT';
  const { data } = await supabase
    .from('central')
    .select('code')
    .like('code', `${prefix}-%`);
  const nums = (data || []).map(r => parseInt(r.code.split('-')[1]) || 0);
  const n = nums.length ? Math.max(...nums) + 1 : 1;
  return `${prefix}-${String(n).padStart(3, '0')}`;
}

export function useAlertas() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('central')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTickets(data.filter(r => r.type !== 'Atualização').map(toTicket));
      setUpdates(data.filter(r => r.type === 'Atualização').map(toUpdate));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const uploadAnexo = useCallback(async (file, code) => {
    if (!file) return null;
    const ext = file.name.split('.').pop();
    const path = `${code}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('ticket-attachments')
      .upload(path, file, { upsert: false });
    if (error) return null;
    const { data } = supabase.storage.from('ticket-attachments').getPublicUrl(path);
    return data?.publicUrl || null;
  }, []);

  const addTicket = useCallback(async (formData, formType, file) => {
    const type = FORM_TYPE_MAP[formType] || 'Ajuda';
    const code = await generateCode(type);
    const attachmentUrl = await uploadAnexo(file, code);
    const { data: inserted, error } = await supabase.from('central').insert({
      code,
      type,
      title: formData.titulo,
      content: formData.horizonte
        ? [formData.horizonte, formData.descricao].filter(Boolean).join(' — ')
        : (formData.descricao || ''),
      module: formData.modulo || null,
      priority: formData.prioridade || null,
      status: type === 'Futuro' ? 'Planeado' : 'Recebido',
      submitted_by: user?.id || null,
      attachment_url: attachmentUrl,
    }).select('id').single();
    if (!error && inserted) {
      await supabase.from('ticket_comments').insert({
        ticket_id: inserted.id,
        author_name: null,
        text: 'Ticket recebido.',
        status_label: type === 'Futuro' ? 'Planeado' : 'Recebido',
        is_system: true,
      });
      fetchAll();
    }
  }, [user, fetchAll, uploadAnexo]);

  const updateTicketStatus = useCallback(async (id, newStatus, adminName) => {
    const { error } = await supabase.from('central').update({ status: newStatus }).eq('id', id);
    if (!error) {
      await supabase.from('ticket_comments').insert({
        ticket_id: id,
        author_name: adminName || 'Admin',
        text: `Estado alterado para "${newStatus}".`,
        status_label: newStatus,
        is_system: true,
      });
      fetchAll();
    }
    return !error;
  }, [fetchAll]);

  const fetchComments = useCallback(async (ticketId) => {
    const { data } = await supabase
      .from('ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    return data || [];
  }, []);

  const addComment = useCallback(async (ticketId, text, statusLabel, authorName) => {
    const { error } = await supabase.from('ticket_comments').insert({
      ticket_id: ticketId,
      author_name: authorName || 'Admin',
      text,
      status_label: statusLabel,
      is_system: false,
    });
    if (error) {
      console.error('addComment error:', error);
      return { ok: false, message: error.message };
    }
    return { ok: true };
  }, []);

  const deleteTicket = useCallback(async (id) => {
    const { error } = await supabase.from('central').delete().eq('id', id);
    if (!error) setTickets(prev => prev.filter(t => t.id !== id));
  }, []);

  const addUpdate = useCallback(async (formData) => {
    const items = (formData.items || '')
      .split('\n')
      .map(s => s.replace(/^[-•]\s*/, '').trim())
      .filter(Boolean);
    const code = await generateCode('Atualização');
    const { error } = await supabase.from('central').insert({
      code,
      type: 'Atualização',
      title: `Atualizações — ${formData.versao || '??'}`,
      version: formData.versao || null,
      items,
      content: formData.notas || null,
      status: 'Publicado',
      submitted_by: user?.id || null,
    });
    if (!error) fetchAll();
  }, [user, fetchAll]);

  const deleteUpdate = useCallback(async (id) => {
    const { error } = await supabase.from('central').delete().eq('id', id);
    if (!error) setUpdates(prev => prev.filter(u => u.id !== id));
  }, []);

  const stats = [
    { label: 'Atualizações este mês', value: updates.length },
    { label: 'Tickets abertos',       value: tickets.filter(t => t.status !== 'Resolvido').length },
    { label: 'Em análise',            value: tickets.filter(t => t.status === 'Em análise').length },
    { label: 'Resolvidos',            value: tickets.filter(t => t.status === 'Resolvido').length },
    { label: 'Sugestões enviadas',    value: tickets.filter(t => t.type === 'Melhoria').length },
    { label: 'Pedidos de ajuda',      value: tickets.filter(t => t.type === 'Ajuda').length },
  ];

  return { tickets, updates, stats, loading, addTicket, deleteTicket, addUpdate, deleteUpdate, updateTicketStatus, fetchComments, addComment };
}
