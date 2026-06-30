/* app.js — 멍멍 AI 도우미 클라이언트 */

const chatMessages = document.getElementById('chatMessages');
const chatForm     = document.getElementById('chatForm');
const chatInput    = document.getElementById('chatInput');
const sendBtn      = document.getElementById('sendBtn');

// 대화 내역 (서버에 함께 전송해 문맥 유지)
const conversationHistory = [];

/* ─── 초기화 ─── */
// 정적 환영 메시지를 대화 내역에 추가
conversationHistory.push({
  role: 'assistant',
  content: '안녕! 나는 멍멍이야. 궁금한 거 뭐든지 물어봐줘. 멍!',
});

// 페이지 로드 시 환영 메시지 외 예시 메시지 제거
window.addEventListener('DOMContentLoaded', () => {
  // index.html의 예시 메시지(유저·AI·로딩)를 제거하고 환영 메시지만 남김
  const allMessages = chatMessages.querySelectorAll('.message');
  allMessages.forEach((el, i) => { if (i > 0) el.remove(); });
});

/* ─── textarea 자동 높이 ─── */
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = chatInput.scrollHeight + 'px';
});

/* ─── Enter 전송 (Shift+Enter = 줄바꿈) ─── */
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!sendBtn.disabled) chatForm.requestSubmit();
  }
});

/* ─── 폼 제출 ─── */
chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const text = chatInput.value.trim();
  if (!text) return;

  // 입력창 초기화
  chatInput.value = '';
  chatInput.style.height = 'auto';
  setInputDisabled(true);

  // 유저 메시지 렌더링
  appendMessage('user', text);
  conversationHistory.push({ role: 'user', content: text });

  // 로딩 표시
  const loadingEl = appendLoading();

  try {
    const reply = await sendMessage(conversationHistory);

    // 로딩 제거 후 AI 답변 렌더링
    loadingEl.remove();
    appendMessage('ai', reply);
    conversationHistory.push({ role: 'assistant', content: reply });
  } catch (err) {
    loadingEl.remove();
    appendError(err.message);
  } finally {
    setInputDisabled(false);
    chatInput.focus();
  }
});

/* ─── API 호출 ─── */
async function sendMessage(messages) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || '알 수 없는 오류가 발생했어. 멍...');
  }

  return data.reply;
}

/* ─── DOM 헬퍼 ─── */

// 메시지 버블 추가
function appendMessage(role, text) {
  const isUser = role === 'user';

  const article = document.createElement('article');
  article.className = `message message--${isUser ? 'user' : 'ai'}`;

  if (!isUser) {
    const avatar = document.createElement('div');
    avatar.className = 'message__avatar';
    avatar.textContent = '🐶';
    article.appendChild(avatar);
  }

  const bubble = document.createElement('div');
  bubble.className = 'message__bubble';
  bubble.textContent = text;
  article.appendChild(bubble);

  chatMessages.appendChild(article);
  scrollToBottom();
  return article;
}

// 로딩 점 추가
function appendLoading() {
  const article = document.createElement('article');
  article.className = 'message message--ai message--loading';

  const avatar = document.createElement('div');
  avatar.className = 'message__avatar';
  avatar.textContent = '🐶';

  const bubble = document.createElement('div');
  bubble.className = 'message__bubble';
  bubble.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';

  article.appendChild(avatar);
  article.appendChild(bubble);
  chatMessages.appendChild(article);
  scrollToBottom();
  return article;
}

// 오류 메시지 추가
function appendError(message) {
  const article = document.createElement('article');
  article.className = 'message message--ai message--error';

  const avatar = document.createElement('div');
  avatar.className = 'message__avatar';
  avatar.textContent = '🐶';

  const bubble = document.createElement('div');
  bubble.className = 'message__bubble';
  bubble.textContent = message;

  article.appendChild(avatar);
  article.appendChild(bubble);
  chatMessages.appendChild(article);
  scrollToBottom();
}

// 전송 버튼·입력창 비활성화
function setInputDisabled(disabled) {
  sendBtn.disabled = disabled;
  chatInput.disabled = disabled;
}

// 스크롤 최하단 이동
function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
