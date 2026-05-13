'use strict';

import { supabase } from './supabaseClient.js';
import * as storage from './storageAdapter.js';

let currentUserId;

// ===== 저장소 =====

async function syncToStorage() {
  const cards = [];
  document.querySelectorAll('.card-list').forEach((list) => {
    list.querySelectorAll('.card').forEach((card, index) => {
      cards.push({
        id: card.dataset.id,
        userId: currentUserId,
        text: card.querySelector('.card-text').textContent,
        column: list.id,
        order: index,
        createdAt: card.dataset.createdAt,
      });
    });
  });
  await storage.saveCards(currentUserId, cards);
}

async function restoreFromStorage() {
  const cards = await storage.loadCards(currentUserId);
  cards
    .sort((a, b) => a.order - b.order)
    .forEach((item) => {
      const list = document.getElementById(item.column);
      if (!list) return;
      list.appendChild(createCard(item));
    });
}

// ===== 드래그 & 드롭 =====

let draggedCard = null;

function initDragEvents(card) {
  card.addEventListener('dragstart', (e) => {
    draggedCard = card;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  card.addEventListener('dragend', () => {
    draggedCard = null;
    card.classList.remove('dragging');
  });
}

function initDropZone(list) {
  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    list.classList.add('drag-over');

    const afterCard = getCardAfterCursor(list, e.clientY);
    if (afterCard == null) {
      list.appendChild(draggedCard);
    } else {
      list.insertBefore(draggedCard, afterCard);
    }
  });

  list.addEventListener('dragleave', (e) => {
    if (!list.contains(e.relatedTarget)) {
      list.classList.remove('drag-over');
    }
  });

  list.addEventListener('drop', async (e) => {
    e.preventDefault();
    list.classList.remove('drag-over');
    updateAllBadges();
    await syncToStorage();
  });
}

// dragover마다 호출 — DOM 쿼리 추가 금지
function getCardAfterCursor(list, cursorY) {
  const draggableCards = [...list.querySelectorAll('.card:not(.dragging)')];

  return draggableCards.reduce((closest, card) => {
    const box = card.getBoundingClientRect();
    const offset = cursorY - (box.top + box.height / 2);
    if (offset < 0 && offset > closest.offset) {
      return { offset, element: card };
    }
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ===== 뱃지 업데이트 =====

function updateAllBadges() {
  document.querySelectorAll('.card-list').forEach((list) => {
    const count = list.querySelectorAll('.card').length;
    const badge = document.getElementById(`badge-${list.id}`);
    if (badge) badge.textContent = count;
  });
}

// ===== 카드 생성 =====

function createCard({ id, userId, text, createdAt }) {
  const li = document.createElement('li');
  li.className = 'card';
  li.draggable = true;
  li.dataset.id = id;
  li.dataset.userId = userId;
  li.dataset.createdAt = createdAt;

  const span = document.createElement('span');
  span.className = 'card-text';
  span.textContent = text;

  const btn = document.createElement('button');
  btn.className = 'delete-btn';
  btn.setAttribute('aria-label', '삭제');
  btn.textContent = '×';
  btn.addEventListener('click', async () => {
    li.remove();
    updateAllBadges();
    await storage.deleteCard(currentUserId, id);
  });

  li.appendChild(span);
  li.appendChild(btn);
  initDragEvents(li);
  return li;
}

// ===== 카드 추가 폼 =====

function initAddCardForm() {
  const form = document.getElementById('addCardForm');
  const input = document.getElementById('cardInput');
  const select = document.getElementById('columnSelect');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    const list = document.getElementById(select.value);
    const order = list.querySelectorAll('.card').length;
    const card = await storage.addCard(currentUserId, { text, column: select.value, order });
    if (!card) return;
    list.appendChild(createCard(card));
    updateAllBadges();

    input.value = '';
    input.focus();
  });
}

// ===== 인증 UI =====

function initAuthUI(email) {
  const emailEl = document.getElementById('userEmail');
  const logoutBtn = document.getElementById('logoutBtn');
  if (emailEl) emailEl.textContent = email;
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await supabase.auth.signOut();
      window.location.href = 'login.html';
    });
  }
}

// ===== 초기화 =====

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'login.html';
    return;
  }

  currentUserId = session.user.id;
  initAuthUI(session.user.email);

  document.querySelectorAll('.card-list').forEach(initDropZone);

  // HTML 데모 카드 제거 후 Supabase에서 복원
  document.querySelectorAll('.card').forEach((c) => c.remove());
  await restoreFromStorage();

  initAddCardForm();
  updateAllBadges();
}

document.addEventListener('DOMContentLoaded', init);
