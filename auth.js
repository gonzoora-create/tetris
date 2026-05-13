'use strict';

import { supabase } from './supabaseClient.js';

// ===== 탭 전환 =====

const tabLogin = document.getElementById('tabLogin');
const tabSignup = document.getElementById('tabSignup');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active');
  tabSignup.classList.remove('active');
  tabLogin.setAttribute('aria-selected', 'true');
  tabSignup.setAttribute('aria-selected', 'false');
  loginForm.hidden = false;
  signupForm.hidden = true;
  document.getElementById('loginError').textContent = '';
});

tabSignup.addEventListener('click', () => {
  tabSignup.classList.add('active');
  tabLogin.classList.remove('active');
  tabSignup.setAttribute('aria-selected', 'true');
  tabLogin.setAttribute('aria-selected', 'false');
  signupForm.hidden = false;
  loginForm.hidden = true;
  document.getElementById('signupError').textContent = '';
  document.getElementById('signupSuccess').textContent = '';
});

// ===== 로그인 =====

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('loginError');
  const btn = document.getElementById('loginBtn');
  errorEl.textContent = '';
  btn.disabled = true;

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    window.location.href = 'index.html';
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});

// ===== 회원가입 =====

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('signupError');
  const successEl = document.getElementById('signupSuccess');
  const btn = document.getElementById('signupBtn');
  errorEl.textContent = '';
  successEl.textContent = '';
  btn.disabled = true;

  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  const confirm = document.getElementById('signupPasswordConfirm').value;

  if (password !== confirm) {
    errorEl.textContent = '비밀번호가 일치하지 않습니다.';
    btn.disabled = false;
    return;
  }

  try {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    successEl.textContent = '가입 완료! 로그인 탭에서 로그인하세요.';
    signupForm.reset();
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    btn.disabled = false;
  }
});
