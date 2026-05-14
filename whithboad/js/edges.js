import { getEdges, createEdge, deleteEdge as apiDeleteEdge } from './api.js'
import { nodesMap, repositionHandles } from './nodes.js'

const edgesLayer = () => document.getElementById('edges-layer')

let boardId = null
let selectedEdgeId = null
let edgesMap = new Map()
let connectState = null  // { sourceId, draft }

export async function loadEdges(bid) {
  boardId = bid
  const edges = await getEdges(boardId)
  edgesLayer().innerHTML = ''
  edgesMap.clear()
  edges.forEach(e => renderEdge(e))
}

export function renderEdge(edge) {
  edgesMap.set(edge.id, { ...edge })
  const src = nodesMap.get(edge.source_id)
  const tgt = nodesMap.get(edge.target_id)
  if (!src || !tgt) return

  let g = document.querySelector(`g.edge-group[data-id="${edge.id}"]`)
  if (!g) {
    g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    g.classList.add('edge-group')
    g.setAttribute('data-id', edge.id)

    const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    hitPath.classList.add('edge-hit')

    const visPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    visPath.classList.add('edge')

    g.appendChild(hitPath)
    g.appendChild(visPath)
    edgesLayer().appendChild(g)
    attachEdgeEvents(g, edge.id)
  }

  const d = calcBezier(src, tgt)
  g.querySelectorAll('path').forEach(p => p.setAttribute('d', d))
}

export function removeEdge(edgeId) {
  document.querySelector(`g.edge-group[data-id="${edgeId}"]`)?.remove()
  edgesMap.delete(edgeId)
  if (selectedEdgeId === edgeId) selectedEdgeId = null
}

export function updateEdgesForNode(nodeId) {
  edgesMap.forEach(edge => {
    if (edge.source_id === nodeId || edge.target_id === nodeId) renderEdge(edge)
  })
}

function calcBezier(src, tgt) {
  const sx = src.x + src.width / 2
  const sy = src.y + src.height / 2
  const tx = tgt.x + tgt.width / 2
  const ty = tgt.y + tgt.height / 2
  const dx = Math.abs(tx - sx) / 2
  return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`
}

function attachEdgeEvents(g, edgeId) {
  g.addEventListener('click', e => {
    e.stopPropagation()
    document.querySelectorAll('.edge.selected').forEach(el => el.classList.remove('selected'))
    document.querySelectorAll('.node-fo.selected').forEach(el => el.classList.remove('selected'))
    selectedEdgeId = edgeId
    g.querySelector('.edge').classList.add('selected')
  })
}

export function initHandleConnect() {
  const handlesLayer = document.getElementById('handles-layer')

  handlesLayer.addEventListener('mousedown', e => {
    const handle = e.target.closest('.handle')
    if (!handle) return
    e.stopPropagation()
    e.preventDefault()

    const sourceId = handle.getAttribute('data-node-id')
    const draft = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    draft.classList.add('edge')
    draft.style.strokeDasharray = '6'
    draft.style.pointerEvents = 'none'
    edgesLayer().appendChild(draft)
    connectState = { sourceId, draft }
  })

  window.addEventListener('mousemove', e => {
    if (!connectState) return
    const src = nodesMap.get(connectState.sourceId)
    if (!src) return

    const svg = document.getElementById('canvas')
    const vp = document.getElementById('viewport')
    const svgRect = svg.getBoundingClientRect()
    const m = new DOMMatrix(vp.getAttribute('transform') || 'matrix(1,0,0,1,0,0)')
    const tx = (e.clientX - svgRect.left - m.e) / m.a
    const ty = (e.clientY - svgRect.top - m.f) / m.d

    const sx = src.x + src.width / 2
    const sy = src.y + src.height / 2
    const dx = Math.abs(tx - sx) / 2
    connectState.draft.setAttribute('d',
      `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`)
  })

  window.addEventListener('mouseup', async e => {
    if (!connectState) return
    const { sourceId, draft } = connectState
    connectState = null
    draft.remove()

    const targetFo = e.target.closest('.node-fo')
    if (!targetFo) return
    const targetId = targetFo.getAttribute('data-id')
    if (targetId === sourceId) return

    const edge = await createEdge({ board_id: boardId, source_id: sourceId, target_id: targetId })
    if (edge) renderEdge(edge)
  })

  window.addEventListener('keydown', async e => {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return
    if (document.activeElement?.getAttribute('contenteditable') === 'true') return
    if (!selectedEdgeId) return
    const edgeId = selectedEdgeId
    selectedEdgeId = null
    await apiDeleteEdge(edgeId)
    removeEdge(edgeId)
  })
}
