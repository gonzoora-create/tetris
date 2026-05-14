import { supabase } from './api.js'

export let isRemoteUpdate = false

export function subscribeBoard(boardId, callbacks) {
  const channel = supabase
    .channel(`board:${boardId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'nodes', filter: `board_id=eq.${boardId}` },
      ({ new: node }) => {
        isRemoteUpdate = true
        callbacks.onNodeInsert?.(node)
        isRemoteUpdate = false
      }
    )
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'nodes', filter: `board_id=eq.${boardId}` },
      ({ new: node }) => {
        isRemoteUpdate = true
        callbacks.onNodeUpdate?.(node)
        isRemoteUpdate = false
      }
    )
    .on('postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'nodes', filter: `board_id=eq.${boardId}` },
      ({ old }) => {
        isRemoteUpdate = true
        callbacks.onNodeDelete?.(old.id)
        isRemoteUpdate = false
      }
    )
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'edges', filter: `board_id=eq.${boardId}` },
      ({ new: edge }) => {
        isRemoteUpdate = true
        callbacks.onEdgeInsert?.(edge)
        isRemoteUpdate = false
      }
    )
    .on('postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'edges', filter: `board_id=eq.${boardId}` },
      ({ old }) => {
        isRemoteUpdate = true
        callbacks.onEdgeDelete?.(old.id)
        isRemoteUpdate = false
      }
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        callbacks.onReconnect?.()
      }
    })

  return () => supabase.removeChannel(channel)
}
