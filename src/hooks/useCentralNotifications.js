import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

const SEEN_KEY = 'central_seen_until';

const TYPE_ICON = {
  Atualização: { label: 'Atualização', color: 'text-blue-400',   bg: 'bg-blue-500/10' },
  Erro:        { label: 'Erro',        color: 'text-red-400',    bg: 'bg-red-500/10' },
  Ajuda:       { label: 'Ajuda',       color: 'text-sky-400',    bg: 'bg-sky-500/10' },
  Melhoria:    { label: 'Melhoria',    color: 'text-violet-400', bg: 'bg-violet-500/10' },
  Futuro:      { label: 'Futuro',      color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
};

function getSeenUntil() {
  return localStorage.getItem(SEEN_KEY) || '1970-01-01T00:00:00.000Z';
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function useCentralNotifications() {
  const [items, setItems] = useState([]);
  const [seenUntil, setSeenUntil] = useState(getSeenUntil);

  useEffect(() => {
    supabase
      .from('central')
      .select('id, code, title, type, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => { if (data) setItems(data); });
  }, []);

  const unreadCount = items.filter(i => i.created_at > seenUntil).length;

  const markSeen = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(SEEN_KEY, now);
    setSeenUntil(now);
  }, []);

  return {
    items: items.map(i => ({
      ...i,
      date: formatDate(i.created_at),
      isNew: i.created_at > seenUntil,
      meta: TYPE_ICON[i.type] || TYPE_ICON['Ajuda'],
    })),
    unreadCount,
    markSeen,
  };
}
