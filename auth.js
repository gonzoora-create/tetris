'use strict';

import { supabase } from './supabaseClient.js';

const form = document.getElementById('authForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submitBtn');
const toggleBtn = document.getElementById('toggleBtn');
const toggleMsg = document.getElementById('toggleMsg');
const errorMsg = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');

let isSignUp = false;

function setMode(signUp) {
  isSignUp = signUp;
  submitBtn.textContent = signUp ? '회원가입' : '로그인';
  toggleBtn.textContent = signUp ? '로그인' : '회원가입';
  toggleMsg.textContent = signUp ? '이미 계정이 있으신가요?' : '계정이 없으신가요?';
  errorMsg.textContent = '';
  successMsg.textContent = '';
}

toggleBtn.addEventListener('click', () => setMode(!isSignUp));

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorMsg.textContent = '';
  successMsg.textContent = '';
  submitBtn.disabled = true;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  try {
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      successMsg.textContent = '가입 완료! 이메일을 확인하거나 바로 로그인하세요.';
      setMode(false);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = 'index.html';
    }
  } catch (err) {
    errorMsg.textContent = err.message;
  } finally {
    submitBtn.disabled = false;
  }
});
