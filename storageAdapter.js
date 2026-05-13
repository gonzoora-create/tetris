// ===== Supabase v2 구현 =====
// 인터페이스 변경 금지 — app.js는 이 파일의 존재를 모름

import { supabase } from './supabaseClient.js';

function toAppCard(row) {
  return {
    id: row.id,
    userId: row.user_id,
    text: row.text,
    column: row.column,
    order: row.position,
    createdAt: row.created_at,
  };
}

export async function loadCards(userId) {
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('user_id', userId)
    .order('position');
  if (error) { console.warn('loadCards 실패:', error.message); return []; }
  return data.map(toAppCard);
}

export async function saveCards(userId, cards) {
  const rows = cards.map((c) => ({
    id: c.id,
    user_id: userId,
    text: c.text,
    column: c.column,
    position: c.order,
  }));
  const { error } = await supabase
    .from('cards')
    .upsert(rows, { onConflict: 'id' });
  if (error) console.warn('saveCards 실패:', error.message);
}

export async function addCard(userId, { text, column, order }) {
  const { data, error } = await supabase
    .from('cards')
    .insert({ user_id: userId, text, column, position: order })
    .select()
    .single();
  if (error) { console.warn('addCard 실패:', error.message); return null; }
  return toAppCard(data);
}

export async function deleteCard(userId, cardId) {
  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', cardId)
    .eq('user_id', userId);
  if (error) console.warn('deleteCard 실패:', error.message);
}

export async function updateCardColumn(userId, cardId, column, order) {
  const { error } = await supabase
    .from('cards')
    .update({ column, position: order })
    .eq('id', cardId)
    .eq('user_id', userId);
  if (error) console.warn('updateCardColumn 실패:', error.message);
}
