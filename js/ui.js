// 자체 모달 · 확인 모달 · 입력 모달 · 토스트 (alert/confirm/prompt 대체)
// 모두 앱 영역 안의 #layer 에 띄운다.
import { $, esc } from './util.js';

const layer = () => $('#layer');

/* ---------- 토스트 ---------- */
let toastEl = null;
let toastTimer = 0;
export function toast(msg, ms = 1800) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    layer().appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('on'), ms);
}

/* ---------- 모달 (한 번에 하나) ---------- */
let current = null; // { el, close }

/**
 * @param {object} o
 * @param {string} o.html           내용 HTML
 * @param {boolean} [o.dismissible] 바깥 탭 / Esc 로 닫기 (기본 true)
 * @param {(box:HTMLElement, close:Function)=>void} [o.onOpen]
 * @param {()=>void} [o.onClose]
 * @returns {Function} close
 */
export function openModal({ html, dismissible = true, onOpen, onClose }) {
  closeModal();
  const prevFocus = document.activeElement;
  const el = document.createElement('div');
  el.className = 'modal';
  el.innerHTML = `<div class="box" role="dialog" aria-modal="true">${html}</div>`;
  const box = el.firstElementChild;

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    el.remove();
    if (current && current.el === el) current = null;
    if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true });
    if (onClose) onClose();
  };
  const onKey = (e) => {
    if (e.key === 'Escape' && dismissible) close();
  };
  el.addEventListener('click', (e) => {
    if (e.target === el && dismissible) close();
    if (e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', onKey);

  layer().appendChild(el);
  current = { el, close };
  if (onOpen) onOpen(box, close);
  const first = box.querySelector('[autofocus], textarea, input, .btn');
  if (first) first.focus({ preventScroll: true });
  return close;
}

export function closeModal() {
  if (current) current.close();
}

export const isModalOpen = () => !!current;

/* ---------- 확인 모달 ---------- */
/** @returns {Promise<boolean>} */
export function confirmModal({ title, message = '', okText = '확인', cancelText = '취소', danger = false }) {
  return new Promise((resolve) => {
    let result = false;
    openModal({
      html: `
        <h3 class="m-title">${esc(title)}</h3>
        ${message ? `<p class="m-msg">${esc(message)}</p>` : ''}
        <div class="btns">
          <button type="button" class="btn gray" data-close>${esc(cancelText)}</button>
          <button type="button" class="btn ${danger ? 'danger' : ''}" data-ok>${esc(okText)}</button>
        </div>`,
      onOpen(box, close) {
        box.querySelector('[data-ok]').addEventListener('click', () => { result = true; close(); });
      },
      onClose: () => resolve(result),
    });
  });
}

/* ---------- 입력 모달 ---------- */
/**
 * @returns {Promise<{value:string}|{reset:true}|null>}  null = 취소
 */
export function inputModal({ title, value = '', maxLength = 60, okText = '저장', resetText = '' }) {
  return new Promise((resolve) => {
    let result = null;
    openModal({
      html: `
        <h3 class="m-title">${esc(title)}</h3>
        <textarea rows="3" maxlength="${maxLength}">${esc(value)}</textarea>
        <p class="m-count"><span>0</span>/${maxLength}</p>
        <div class="btns">
          ${resetText ? `<button type="button" class="btn gray" data-reset>${esc(resetText)}</button>` : ''}
          <button type="button" class="btn gray" data-close>취소</button>
          <button type="button" class="btn" data-ok>${esc(okText)}</button>
        </div>`,
      onOpen(box, close) {
        const ta = box.querySelector('textarea');
        const cnt = box.querySelector('.m-count span');
        const upd = () => { cnt.textContent = ta.value.length; };
        ta.addEventListener('input', upd);
        upd();
        box.querySelector('[data-ok]').addEventListener('click', () => { result = { value: ta.value.trim() }; close(); });
        box.querySelector('[data-reset]')?.addEventListener('click', () => { result = { reset: true }; close(); });
      },
      onClose: () => resolve(result),
    });
  });
}
