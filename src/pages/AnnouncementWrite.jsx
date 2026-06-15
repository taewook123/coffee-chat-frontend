import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Bold, Italic, List, Link2, ImageIcon,
  Eye, Send, Tag, ChevronDown, AlertCircle, Pin, Bell,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────────── */
// 💡 기존 구조 유지하되, 배경/글씨색을 밝은 톤으로 변경
const CATEGORY_META = {
  공지:   { color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
  이벤트: { color: '#9333ea', bg: 'rgba(147,51,234,0.1)' },
  업데이트: { color: '#059669', bg: 'rgba(5,150,105,0.1)' },
  점검:   { color: '#ea580c', bg: 'rgba(234,88,12,0.1)' },
};

/* ─── Page ──────────────────────────────────────────────────────────────── */
export default function AnnouncementWrite() {
  const navigate = useNavigate();
  const textareaRef = useRef(null);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('공지');
  const [isPinned, setIsPinned] = useState(false);
  const [isPush, setIsPush] = useState(false);
  const [preview, setPreview] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  
  // API 연동 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  const bodyWords = body.trim().split(/\s+/).filter(Boolean).length;
  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  const wrapSelection = (before, after = before) => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const selected = body.slice(s, e);
    const next = body.slice(0, s) + before + selected + after + body.slice(e);
    setBody(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(s + before.length, e + before.length);
    }, 0);
  };

  const insertList = () => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: s } = el;
    const prefix = body.slice(0, s).endsWith('\n') || s === 0 ? '' : '\n';
    const insert = `${prefix}• `;
    setBody(body.slice(0, s) + insert + body.slice(s));
    setTimeout(() => { el.focus(); el.setSelectionRange(s + insert.length, s + insert.length); }, 0);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      // 🌟 [핵심 수정] 'token'으로 저장했든 'access_token'으로 저장했든 둘 다 찾아옵니다!
      const token = localStorage.getItem('token') || localStorage.getItem('access_token'); 
      
      // 🌟 [안전 장치] 토큰이 아예 없으면 백엔드로 요청 안 보내고 알림 띄우기
      if (!token || token === 'null') {
        alert("로그인 정보가 없습니다. 다시 로그인해 주세요!");
        setIsSubmitting(false);
        return;
      }

      const formattedTitle = `[${category}] ${title}`;

      await axios.post(
        `${BACKEND_URL}/api/announcements`,
        { 
          title: formattedTitle, 
          content: body 
        },
        {
          headers: {
            Authorization: `Bearer ${token}` 
          }
        }
      );

      setSubmitted(true);
      setTimeout(() => navigate('/announcements'), 1800);
      
    } catch (error) {
      console.error("공지사항 등록 실패:", error);
      if (error.response?.status === 401) {
        alert("로그인이 만료되었거나 권한이 없습니다. 다시 로그인 해주세요.");
      } else if (error.response?.status === 403) {
        alert("관리자 권한이 없습니다.");
      } else {
        alert("공지사항 등록 중 오류가 발생했습니다.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Success overlay ── */
  if (submitted) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-6"
        style={{ background: '#f9fafb' }} // 💡 하얀 배경
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#4a90e2,#6c63ff)', boxShadow: '0 0 60px rgba(74,144,226,0.2)' }}
        >
          <Send className="w-9 h-9 text-white" />
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 mb-2">공지사항이 등록되었습니다</p>
          <p className="text-sm" style={{ color: '#6b7280' }}>잠시 후 이전 페이지로 이동합니다</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#ffffff', color: '#111827', fontFamily: "'Inter', sans-serif" }} // 💡 기본 배경색 흰색, 글자색 검정
    >
      {/* ── Top bar ── */}
      <header
        className="flex items-center justify-between px-8 py-4 flex-shrink-0"
        style={{ borderBottom: '1px solid #e5e7eb' }} // 💡 테두리 회색
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm transition font-medium hover:text-gray-900"
          style={{ color: '#6b7280' }} // 💡 텍스트 회색
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </button>

        <div className="flex items-center gap-2">
          {/* Preview toggle */}
          <button
            onClick={() => setPreview(!preview)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition"
            style={{
              background: preview ? 'rgba(74,144,226,0.1)' : '#f3f4f6',
              color: preview ? '#2563eb' : '#4b5563',
              border: preview ? '1px solid rgba(74,144,226,0.3)' : '1px solid #e5e7eb',
            }}
          >
            <Eye className="w-4 h-4" />
            미리보기
          </button>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: canSubmit && !isSubmitting
                ? 'linear-gradient(135deg,#4a90e2,#6c63ff)'
                : '#f3f4f6',
              color: canSubmit && !isSubmitting ? '#fff' : '#9ca3af',
              boxShadow: canSubmit && !isSubmitting ? '0 4px 16px rgba(74,144,226,0.2)' : 'none',
              cursor: canSubmit && !isSubmitting ? 'pointer' : 'not-allowed',
            }}
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? '게시 중...' : '게시하기'}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Editor / Preview ── */}
        <main className="flex-1 flex flex-col px-10 py-8 min-w-0 bg-white">

          {preview ? (
            /* ── Preview pane ── */
            <div className="flex-1 flex flex-col max-w-3xl">
              <p className="text-xs font-bold tracking-[0.12em] uppercase mb-6" style={{ color: '#2563eb' }}>
                미리보기
              </p>
              <div className="flex items-center gap-2 mb-4">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={CATEGORY_META[category]}
                >
                  {category}
                </span>
                {isPinned && (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1"
                    style={{ background: 'rgba(234,88,12,0.1)', color: '#ea580c' }}
                  >
                    <Pin className="w-3 h-3" /> 고정
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-snug" style={{ letterSpacing: '-0.02em' }}>
                {title || <span style={{ color: '#9ca3af' }}>제목을 입력하세요</span>}
              </h1>
              <div
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: '#374151' }} // 💡 본문 색상 어둡게
              >
                {body || <span style={{ color: '#9ca3af' }}>내용을 입력하세요</span>}
              </div>
            </div>
          ) : (
            /* ── Edit pane ── */
            <div className="flex-1 flex flex-col max-w-3xl">
              <p className="text-xs font-bold tracking-[0.12em] uppercase mb-6" style={{ color: '#2563eb' }}>
                새 공지사항 작성
              </p>

              {/* Title */}
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                placeholder="제목을 입력하세요"
                className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-300 mb-6"
                style={{ fontSize: 'clamp(1.5rem,3vw,2.25rem)', fontWeight: 800, letterSpacing: '-0.03em' }}
                maxLength={80}
              />

              <div
                className="mb-0"
                style={{ height: 1, background: '#e5e7eb' }} // 💡 회색 선
              />

              {/* Toolbar */}
              <div className="flex items-center gap-1 py-2.5">
                {[
                  { icon: <Bold className="w-4 h-4" />, action: () => wrapSelection('**'), tip: '굵게' },
                  { icon: <Italic className="w-4 h-4" />, action: () => wrapSelection('_'), tip: '기울임' },
                  { icon: <List className="w-4 h-4" />, action: insertList, tip: '목록' },
                  { icon: <Link2 className="w-4 h-4" />, action: () => wrapSelection('[', '](url)'), tip: '링크' },
                  { icon: <ImageIcon className="w-4 h-4" />, action: () => {}, tip: '이미지' },
                ].map((t, i) => (
                  <button
                    key={i}
                    onClick={t.action}
                    title={t.tip}
                    disabled={isSubmitting}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:bg-gray-100"
                    style={{ color: '#6b7280' }} // 💡 아이콘 색상
                  >
                    {t.icon}
                  </button>
                ))}
              </div>

              <div
                className="mb-3"
                style={{ height: 1, background: '#e5e7eb' }}
              />

              {/* Body textarea */}
              <textarea
                ref={textareaRef}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={isSubmitting}
                placeholder="공지 내용을 작성하세요…"
                className="flex-1 w-full bg-transparent outline-none resize-none text-sm leading-relaxed placeholder-gray-300"
                style={{ color: '#374151', minHeight: 320 }} // 💡 본문 검정 계열
              />

              {/* Word count */}
              <div className="flex items-center justify-end mt-4 gap-3">
                <span className="text-xs" style={{ color: '#9ca3af' }}>
                  {bodyWords}단어 · {body.length}자
                </span>
              </div>
            </div>
          )}
        </main>

        {/* ── Right sidebar ── */}
        <aside
          className="w-64 flex-shrink-0 px-6 py-8 flex flex-col gap-6 bg-gray-50" // 💡 사이드바 배경 아주 옅은 회색
          style={{ borderLeft: '1px solid #e5e7eb' }}
        >
          {/* Category */}
          <div>
            <label className="block text-xs font-bold mb-3 uppercase tracking-[0.1em]" style={{ color: '#6b7280' }}>
              카테고리
            </label>
            <div className="relative">
              <button
                onClick={() => setCatOpen(!catOpen)}
                disabled={isSubmitting}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-bold transition bg-white"
                style={{
                  color: CATEGORY_META[category].color,
                  border: `1px solid ${CATEGORY_META[category].color}40`, // 연한 보더
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                <span className="flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" />
                  {category}
                </span>
                <ChevronDown className="w-4 h-4" style={{ transform: catOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
              </button>
              {catOpen && !isSubmitting && (
                <div
                  className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10 bg-white shadow-lg"
                  style={{ border: '1px solid #e5e7eb' }}
                >
                  {(Object.keys(CATEGORY_META)).map((c) => (
                    <button
                      key={c}
                      onClick={() => { setCategory(c); setCatOpen(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm font-bold transition hover:bg-gray-50"
                      style={{ color: CATEGORY_META[c].color }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="block text-xs font-bold mb-3 uppercase tracking-[0.1em]" style={{ color: '#6b7280' }}>
              게시 옵션
            </label>
            <div className="flex flex-col gap-2">
              <Toggle
                icon={<Pin className="w-4 h-4" />}
                label="상단 고정"
                desc="목록 최상단에 표시"
                value={isPinned}
                onChange={setIsPinned}
                accent="#ea580c" // 주황색
                disabled={isSubmitting}
              />
              <Toggle
                icon={<Bell className="w-4 h-4" />}
                label="푸시 알림"
                desc="모든 사용자에게 전송"
                value={isPush}
                onChange={setIsPush}
                accent="#2563eb" // 파란색
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Validation hint */}
          {!canSubmit && (title.length > 0 || body.length > 0) && (
            <div
              className="flex items-start gap-2 px-3 py-3 rounded-xl text-xs bg-orange-50"
              style={{ color: '#ea580c', border: '1px solid rgba(234,88,12,0.2)' }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium">제목과 내용을 모두 입력해야 게시할 수 있습니다.</span>
            </div>
          )}

          {/* Guide */}
          <div className="mt-auto pt-6 border-t border-gray-200">
            <p className="text-xs font-bold mb-2 uppercase tracking-[0.1em]" style={{ color: '#9ca3af' }}>
              작성 가이드
            </p>
            {[
              '제목은 80자 이내로 작성하세요',
              '**굵게**, _기울임_ 문법 지원',
              '• 로 목록 항목을 만들 수 있어요',
            ].map((g) => (
              <p key={g} className="text-xs font-medium leading-relaxed mb-1" style={{ color: '#9ca3af' }}>
                · {g}
              </p>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ─── Toggle component ──────────────────────────────────────────────────── */
function Toggle({ icon, label, desc, value, onChange, accent, disabled }) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className={`flex items-start gap-3 w-full px-3 py-3 rounded-xl text-left transition bg-white ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{
        border: value ? `1px solid ${accent}50` : '1px solid #e5e7eb',
        boxShadow: value ? `0 0 0 1px ${accent}10` : '0 1px 2px rgba(0,0,0,0.02)'
      }}
    >
      <span style={{ color: value ? accent : '#9ca3af' }} className="mt-0.5 transition-colors">{icon}</span>
      <div className="flex-1">
        <p className="text-xs font-bold transition-colors" style={{ color: value ? '#111827' : '#4b5563' }}>{label}</p>
        <p className="text-xs mt-0.5 transition-colors" style={{ color: value ? '#4b5563' : '#9ca3af' }}>{desc}</p>
      </div>
      <div
        className="w-8 h-4 rounded-full flex-shrink-0 mt-0.5 relative transition-all duration-200"
        style={{ background: value ? accent : '#d1d5db' }}
      >
        <div
          className="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200"
          style={{ left: value ? '17px' : '2px', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }}
        />
      </div>
    </button>
  );
}