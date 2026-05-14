let svg, viewport
let transform = { x: 0, y: 0, scale: 1 }
let isPanning = false
let panStart = { x: 0, y: 0 }

export function initCanvas(svgEl) {
  svg = svgEl
  viewport = svgEl.querySelector('#viewport')
  applyTransform()

  svg.addEventListener('mousedown', onPanStart)
  window.addEventListener('mousemove', onPanMove)
  window.addEventListener('mouseup', onPanEnd)
  svg.addEventListener('wheel', onZoom, { passive: false })
}

function applyTransform() {
  viewport.setAttribute('transform',
    `translate(${transform.x}, ${transform.y}) scale(${transform.scale})`)
}

function onPanStart(e) {
  if (e.target !== svg && e.target !== viewport) return
  isPanning = true
  panStart = { x: e.clientX - transform.x, y: e.clientY - transform.y }
  svg.style.cursor = 'grabbing'
}

function onPanMove(e) {
  if (!isPanning) return
  transform.x = e.clientX - panStart.x
  transform.y = e.clientY - panStart.y
  applyTransform()
}

function onPanEnd() {
  isPanning = false
  svg.style.cursor = 'default'
}

function onZoom(e) {
  e.preventDefault()
  const rect = svg.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.min(3, Math.max(0.2, transform.scale * delta))
  transform.x = mouseX - (mouseX - transform.x) * (newScale / transform.scale)
  transform.y = mouseY - (mouseY - transform.y) * (newScale / transform.scale)
  transform.scale = newScale
  applyTransform()
}

export function screenToCanvas(screenX, screenY) {
  const rect = svg.getBoundingClientRect()
  return {
    x: (screenX - rect.left - transform.x) / transform.scale,
    y: (screenY - rect.top - transform.y) / transform.scale
  }
}

export function resetView() {
  transform = { x: 0, y: 0, scale: 1 }
  applyTransform()
}

export function getTransform() {
  return { ...transform }
}
