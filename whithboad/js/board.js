import { initCanvas, screenToCanvas, resetView } from './canvas.js'
import { getBoard, createNode } from './api.js'
import { initNodes, loadNodes, renderNode, removeNode, selectNode } from './nodes.js'
import { loadEdges, renderEdge, removeEdge, initHandleConnect } from './edges.js'
import { subscribeBoard } from './realtime.js'

const params = new URLSearchParams(location.search)
const boardId = params.get('id')
let activeTool = null

async function init() {
  if (!boardId) { showError(); return }
  const board = await getBoard(boardId)
  if (!board) { showError(); return }

  document.title = `${board.name} — Whiteboard`
  document.getElementById('board-name').textContent = board.name

  const recent = JSON.parse(localStorage.getItem('whiteboard_recent') || '[]')
    .filter(b => b.id !== boardId)
  recent.unshift({ id: boardId, name: board.name, visitedAt: new Date().toISOString() })
  localStorage.setItem('whiteboard_recent', JSON.stringify(recent.slice(0, 20)))

  initCanvas(document.getElementById('canvas'))
  initNodes(boardId)

  await loadNodes()
  await loadEdges(boardId)

  initHandleConnect()
  updateEmptyHint()
  setupToolbar()
  setupCanvasClick()

  document.getElementById('reset-view-btn').addEventListener('click', resetView)
  document.getElementById('canvas').addEventListener('click', () => selectNode(null))

  subscribeBoard(boardId, {
    onNodeInsert: (node) => { renderNode(node); updateEmptyHint() },
    onNodeUpdate: (node) => { renderNode(node) },
    onNodeDelete: (nodeId) => { removeNode(nodeId); updateEmptyHint() },
    onEdgeInsert: (edge) => { renderEdge(edge) },
    onEdgeDelete: (edgeId) => { removeEdge(edgeId) },
    onReconnect: async () => { await loadNodes(); await loadEdges(boardId) }
  })
}

function updateEmptyHint() {
  document.getElementById('empty-hint').style.display =
    document.getElementById('nodes-layer').children.length ? 'none' : ''
}

function setupToolbar() {
  document.querySelectorAll('.tool-btn[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'))
      activeTool = activeTool === btn.dataset.type ? null : btn.dataset.type
      if (activeTool) btn.classList.add('active')
    })
  })
}

function setupCanvasClick() {
  document.getElementById('canvas').addEventListener('click', async e => {
    if (!activeTool) return
    if (e.target.closest('.node-fo, .handle')) return
    const { x, y } = screenToCanvas(e.clientX, e.clientY)
    const node = await createNode({ board_id: boardId, type: activeTool, x: x - 60, y: y - 30 })
    renderNode(node)
    updateEmptyHint()
  })
}

function showError() {
  document.getElementById('board-error').hidden = false
  document.getElementById('canvas').hidden = true
  document.getElementById('empty-hint').hidden = true
}

init()
