import { createBoard } from './api.js'

const STORAGE_KEY = 'whiteboard_recent'

function loadRecent() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }
  catch { return [] }
}

function saveRecent(boards) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards.slice(0, 20)))
}

function renderList() {
  const list = document.getElementById('board-list')
  const empty = document.getElementById('empty-msg')
  const boards = loadRecent()

  if (boards.length === 0) { empty.hidden = false; return }
  empty.hidden = true
  list.innerHTML = boards.map(b => `
    <li data-id="${b.id}">
      <span class="name">${b.name}</span>
      <span class="date">${new Date(b.visitedAt).toLocaleDateString('ko-KR')}</span>
    </li>
  `).join('')

  list.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      location.href = `./board.html?id=${li.dataset.id}`
    })
  })
}

document.getElementById('new-board-btn').addEventListener('click', async () => {
  const btn = document.getElementById('new-board-btn')
  btn.disabled = true
  try {
    const board = await createBoard()
    const recent = loadRecent().filter(b => b.id !== board.id)
    recent.unshift({ id: board.id, name: board.name, visitedAt: new Date().toISOString() })
    saveRecent(recent)
    location.href = `./board.html?id=${board.id}`
  } finally {
    btn.disabled = false
  }
})

renderList()
