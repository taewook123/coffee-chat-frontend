// src/config.js
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// 이제 이 변수 하나만 가져다 쓰면 됩니다.
export const BACKEND_URL = isLocal ? 'http://localhost:8000' : 'http://48.211.169.52:8000';