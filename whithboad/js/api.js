import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Boards
export async function createBoard(name = 'Untitled Board') {
  const { data, error } = await supabase.from('boards').insert({ name }).select().single()
  if (error) throw error
  return data
}

export async function getBoard(boardId) {
  const { data, error } = await supabase.from('boards').select('*').eq('id', boardId).single()
  if (error && error.code !== 'PGRST116') throw error
  return data
}

// Nodes
export async function getNodes(boardId) {
  const { data, error } = await supabase.from('nodes').select('*').eq('board_id', boardId)
  if (error) throw error
  return data
}

export async function createNode({ board_id, type, x, y, label = '', color = '#ffffff' }) {
  const { data, error } = await supabase
    .from('nodes').insert({ board_id, type, x, y, label, color }).select().single()
  if (error) throw error
  return data
}

export async function updateNode(id, patch) {
  const { error } = await supabase
    .from('nodes').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function deleteNode(id) {
  const { error } = await supabase.from('nodes').delete().eq('id', id)
  if (error) throw error
}

// Edges
export async function getEdges(boardId) {
  const { data, error } = await supabase.from('edges').select('*').eq('board_id', boardId)
  if (error) throw error
  return data
}

export async function createEdge({ board_id, source_id, target_id, label = '' }) {
  const { data, error } = await supabase
    .from('edges').insert({ board_id, source_id, target_id, label }).select().single()
  if (error) {
    if (error.code === '23505') return null  // 중복 엣지 — 무시
    throw error
  }
  return data
}

export async function deleteEdge(id) {
  const { error } = await supabase.from('edges').delete().eq('id', id)
  if (error) throw error
}
