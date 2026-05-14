import { getNodes, updateNode, deleteNode as apiDeleteNode } from './api.js'
import { screenToCanvas } from './canvas.js'
import { updateEdgesForNode } from './edges.js'

const nodesLayer = () => document.getElementById('nodes-layer')
const handlesLayer = () => document.getElementById('handles-layer')

let boardId = null
let selectedNodeId = null
let dragState = null  // { nodeId, startX, startY, origX, origY }

export let nodesMap = new Map()

export function initNodes(bid) {
  boardId = bid
  setupGlobalEvents()
  setupColorPalette()
}

export async function loadNodes() {
  const nodes = await getNodes(boardId)
  nodesLayer().innerHTML = ''
  handlesLayer().innerHTML = ''
  nodesMap.clear()
  nodes.forEach(n => renderNode(n))
}

export function renderNode(node) {
  nodesMap.set(node.id, { ...node })
  let fo = document.querySelector(`.node-fo[data-id="${node.id}"]`)

  if (!fo) {
    fo = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject')
    fo.classList.add('node-fo')
    fo.setAttribute('data-id', node.id)
    fo.setAttribute('data-type', node.type)

    const body = document.createElement('div')
    body.className = 'node-body'
    const inner = document.createElement('span')
    inner.className = 'label-inner'
    body.appendChild(inner)
    fo.appendChild(body)

    nodesLayer().appendChild(fo)
    attachNodeEvents(fo)
    renderHandles(node.id)
  }

  fo.setAttribute('x', node.x)
  fo.setAttribute('y', node.y)
  fo.setAttribute('width', node.width)
  fo.setAttribute('height', node.height)
  fo.setAttribute('data-type', node.type)

  const body = fo.querySelector('.node-body')
  body.style.backgroundColor = node.color
  fo.querySelector('.label-inner').textContent = node.label

  repositionHandles(node.id)
}

export function removeNode(nodeId) {
  document.querySelector(`.node-fo[data-id="${nodeId}"]`)?.remove()
  document.querySelectorAll(`.handle[data-node-id="${nodeId}"]`).forEach(h => h.remove())
  nodesMap.delete(nodeId)
  if (selectedNodeId === nodeId) selectedNodeId = null
}

export function selectNode(nodeId) {
  document.querySelectorAll('.node-fo.selected').forEach(el => el.classList.remove('selected'))
  document.querySelectorAll('.edge.selected').forEach(el => el.classList.remove('selected'))
  selectedNodeId = nodeId
  if (nodeId) document.querySelector(`.node-fo[data-id="${nodeId}"]`)?.classList.add('selected')
}

function renderHandles(nodeId) {
  const positions = [
    { side: 'top',    dx: 0.5, dy: 0   },
    { side: 'bottom', dx: 0.5, dy: 1   },
    { side: 'left',   dx: 0,   dy: 0.5 },
    { side: 'right',  dx: 1,   dy: 0.5 }
  ]
  positions.forEach(({ side, dx, dy }) => {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.classList.add('handle')
    circle.setAttribute('r', '6')
    circle.setAttribute('data-node-id', nodeId)
    circle.setAttribute('data-side', side)
    circle.setAttribute('data-dx', dx)
    circle.setAttribute('data-dy', dy)
    handlesLayer().appendChild(circle)
    positionHandle(circle)
  })
}

function positionHandle(circle) {
  const nodeId = circle.getAttribute('data-node-id')
  const node = nodesMap.get(nodeId)
  if (!node) return
  const dx = parseFloat(circle.getAttribute('data-dx'))
  const dy = parseFloat(circle.getAttribute('data-dy'))
  circle.setAttribute('cx', node.x + node.width * dx)
  circle.setAttribute('cy', node.y + node.height * dy)
}

export function repositionHandles(nodeId) {
  document.querySelectorAll(`.handle[data-node-id="${nodeId}"]`).forEach(positionHandle)
}

function attachNodeEvents(fo) {
  fo.addEventListener('mousedown', e => {
    if (e.target.closest('[contenteditable="true"]')) return
    e.stopPropagation()
    const nodeId = fo.getAttribute('data-id')
    const node = nodesMap.get(nodeId)
    const canvas = screenToCanvas(e.clientX, e.clientY)
    dragState = { nodeId, startX: canvas.x, startY: canvas.y, origX: node.x, origY: node.y }
    selectNode(nodeId)
  })

  fo.addEventListener('dblclick', e => {
    e.stopPropagation()
    enableEdit(fo)
  })

  fo.addEventListener('contextmenu', e => {
    e.preventDefault()
    e.stopPropagation()
    const palette = document.getElementById('color-palette')
    palette.style.left = `${e.clientX}px`
    palette.style.top = `${e.clientY}px`
    palette.hidden = false
    palette.dataset.targetNode = fo.getAttribute('data-id')
  })
}

function enableEdit(fo) {
  const label = fo.querySelector('.label-inner')
  label.contentEditable = 'true'
  label.focus()
  const range = document.createRange()
  range.selectNodeContents(label)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)

  const save = async () => {
    label.contentEditable = 'false'
    const nodeId = fo.getAttribute('data-id')
    const text = label.textContent.trim()
    const node = nodesMap.get(nodeId)
    if (node) node.label = text
    await updateNode(nodeId, { label: text })
  }

  label.addEventListener('blur', save, { once: true })
  label.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); label.blur() }
    if (e.key === 'Escape') {
      const nodeId = fo.getAttribute('data-id')
      label.textContent = nodesMap.get(nodeId)?.label ?? ''
      label.blur()
    }
  })
}

function setupGlobalEvents() {
  window.addEventListener('mousemove', e => {
    if (!dragState) return
    const canvas = screenToCanvas(e.clientX, e.clientY)
    const dx = canvas.x - dragState.startX
    const dy = canvas.y - dragState.startY
    const node = nodesMap.get(dragState.nodeId)
    if (!node) return
    node.x = dragState.origX + dx
    node.y = dragState.origY + dy
    const fo = document.querySelector(`.node-fo[data-id="${node.id}"]`)
    if (fo) { fo.setAttribute('x', node.x); fo.setAttribute('y', node.y) }
    repositionHandles(node.id)
    updateEdgesForNode(node.id)
  })

  window.addEventListener('mouseup', async () => {
    if (!dragState) return
    const node = nodesMap.get(dragState.nodeId)
    dragState = null
    if (node) await updateNode(node.id, { x: node.x, y: node.y })
  })

  window.addEventListener('keydown', async e => {
    if (e.key !== 'Delete' && e.key !== 'Backspace') return
    if (document.activeElement?.getAttribute('contenteditable') === 'true') return
    if (!selectedNodeId) return
    const nodeId = selectedNodeId
    selectedNodeId = null
    await apiDeleteNode(nodeId)
    removeNode(nodeId)
    document.getElementById('empty-hint').style.display =
      nodesLayer().children.length ? 'none' : ''
  })

  document.addEventListener('click', () => {
    const palette = document.getElementById('color-palette')
    if (palette) palette.hidden = true
  })
}

function setupColorPalette() {
  const palette = document.getElementById('color-palette')
  if (!palette) return
  palette.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', async e => {
      e.stopPropagation()
      const nodeId = palette.dataset.targetNode
      if (!nodeId) return
      const color = swatch.dataset.color
      const fo = document.querySelector(`.node-fo[data-id="${nodeId}"]`)
      if (fo) fo.querySelector('.node-body').style.backgroundColor = color
      const node = nodesMap.get(nodeId)
      if (node) node.color = color
      palette.hidden = true
      await updateNode(nodeId, { color })
    })
  })
}
