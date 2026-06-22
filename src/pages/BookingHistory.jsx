import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar, Clock, CheckCircle, XCircle, MessageSquare, ChevronRight,
  ChevronDown, ArrowLeft, Download, Filter, Search, TrendingUp, CreditCard,
  AlertCircle, HelpCircle, X, Sparkles, ChevronLeft,
} from 'lucide-react';

/* ─── 상태별 메타데이터 ─── */
const STATUS_META = {
  CONFIRMED: { label: '예약확정', color: '#059669', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  PAID:      { label: '수락대기', color: '#ea580c', bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  icon: <Clock       className="w-3.5 h-3.5" /> },
  REJECTED:  { label: '취소/거절',color: '#dc2626', bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700',     icon: <XCircle     className="w-3.5 h-3.5" /> },
};

const FILTERS = ['전체', 'CONFIRMED', 'PAID', 'REJECTED'];
const FILTER_LABEL = { 전체: '전체', CONFIRMED: '예약확정', PAID: '수락대기', REJECTED: '취소/거절' };

function TeacupIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 튜토리얼 스텝 정의
// ─────────────────────────────────────────────────────────────────────────────
const TUTORIAL_KEY = 'bookinghistory_tutorial_done';

const STEPS = [
  {
    id: 'intro',
    title: '🗂️ 예약 내역 페이지예요',
    description: '내가 신청하거나 신청받은 모든 티타임을 한곳에서 확인하고 관리할 수 있어요.\n각 기능을 하나씩 살펴볼게요!',
    target: null,
  },
  {
    id: 'main-tabs',
    title: '📂 신청한 / 신청받은 탭',
    description: '두 가지 역할로 예약 내역을 구분해서 볼 수 있어요.\n\n• 내가 신청한 티타임 — 게스트로서 신청한 예약 목록\n• 신청받은 티타임 — 호스트로서 받은 신청 목록',
    target: '[data-tour="main-tabs"]',
    position: 'bottom',
    preview: 'main-tabs',
  },
  {
    id: 'search-filter',
    title: '🔍 검색 & 상태 필터',
    description: '이름이나 질문 내용으로 검색하거나,\n상태 버튼으로 빠르게 필터링할 수 있어요.\n\n• 전체 / 예약확정 / 수락대기 / 취소·거절',
    target: '[data-tour="search-filter"]',
    position: 'bottom',
    preview: 'search-filter',
  },
  {
    id: 'booking-card',
    title: '📄 예약 카드',
    description: '각 예약은 카드 형태로 표시돼요.\n카드를 클릭하면 세부 정보가 펼쳐져요.\n\n• 왼쪽 색상 바 — 예약 상태 (초록/주황/빨강)\n• 이름, 날짜·시간, 상태 배지',
    target: '[data-tour="booking-card"]',
    position: 'top',
    preview: 'booking-card',
  },
  {
    id: 'card-actions',
    title: '✅ 카드 펼치면 나오는 액션',
    description: '카드를 클릭해 펼치면 상황에 따라 버튼이 나타나요.\n\n• 호스트 → 수락 대기 중인 예약: "거절하기" / "티타임 수락하기"\n• 게스트 → 내 신청: "신청 취소하기"\n• 확정된 예약: 확정 안내 배너 표시',
    target: '[data-tour="booking-card"]',
    position: 'top',
    preview: 'card-actions',
  },
  {
    id: 'status-badges',
    title: '🔖 예약 상태 종류',
    description: '상태 배지로 현재 상황을 한눈에 확인할 수 있어요.\n\n• 🟠 수락대기 — 호스트가 아직 수락하지 않은 상태\n• 🟢 예약확정 — 호스트가 수락, 티타임 예정\n• 🔴 취소/거절 — 취소되거나 거절된 예약',
    target: '[data-tour="search-filter"]',
    position: 'bottom',
    preview: 'status-badges',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 스텝별 미니 프리뷰
// ─────────────────────────────────────────────────────────────────────────────
function StepPreview({ type }) {
  if (!type) return null;
  const base = 'mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs';

  if (type === 'main-tabs') return (
    <div className={base}>
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">탭 예시</p>
      <div className="flex gap-1.5 bg-gray-200/50 p-1 rounded-lg">
        <div className="flex-1 py-2 text-center rounded-md bg-white text-gray-900 text-[11px] font-bold shadow-sm">내가 신청한 티타임</div>
        <div className="flex-1 py-2 text-center text-gray-400 text-[11px] font-bold">신청받은 티타임</div>
      </div>
    </div>
  );

  if (type === 'search-filter') return (
    <div className={base}>
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">필터 예시</p>
      <div className="flex gap-1 flex-wrap">
        {['전체', '예약확정', '수락대기', '취소/거절'].map((f, i) => (
          <span key={f} className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${i === 0 ? 'bg-[#1a2332] text-white border-[#1a2332]' : 'bg-white text-gray-500 border-gray-200'}`}>
            {f}
          </span>
        ))}
      </div>
    </div>
  );

  if (type === 'booking-card') return (
    <div className={base}>
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">카드 예시</p>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-3 py-3 relative">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 rounded-l-xl" />
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm ml-1">박</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-[11px]">박지수 <span className="text-gray-400 font-normal">호스트</span></p>
            <p className="text-[10px] text-gray-500">커리어 전환 상담</p>
          </div>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
            <CheckCircle className="w-3 h-3" />예약확정
          </span>
        </div>
      </div>
    </div>
  );

  if (type === 'card-actions') return (
    <div className={base}>
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">펼치면 나오는 버튼</p>
      <div className="flex gap-1.5">
        <div className="flex-1 py-2 text-center rounded-lg bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold">거절하기</div>
        <div className="flex-[2] py-2 text-center rounded-lg bg-blue-600 text-white text-[10px] font-bold">티타임 수락하기 →</div>
      </div>
    </div>
  );

  if (type === 'status-badges') return (
    <div className={base}>
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">상태 배지 예시</p>
      <div className="flex gap-1.5 flex-wrap">
        {[
          { label: '수락대기', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
          { label: '예약확정', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
          { label: '취소/거절', cls: 'bg-red-50 text-red-700 border-red-200' },
        ].map(b => (
          <span key={b.label} className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${b.cls}`}>{b.label}</span>
        ))}
      </div>
    </div>
  );

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 튜토리얼 오버레이
// ─────────────────────────────────────────────────────────────────────────────
function TutorialOverlay({ onClose }) {
  const [step, setStep] = useState(0);
  const [neverShow, setNeverShow] = useState(false);
  const [spotlightStyle, setSpotlightStyle] = useState(null);
  const [tooltipStyle, setTooltipStyle]     = useState({});

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast  = step === STEPS.length - 1;

  // 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    if (!current.target) { setSpotlightStyle(null); setTooltipStyle({}); return; }
    
    const calc = () => {
      const el = document.querySelector(current.target);
      if (!el) { setTimeout(calc, 80); return; }
      
      const rect = el.getBoundingClientRect();
      const pad  = 10;
      setSpotlightStyle({ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 });

      const tipW = 300;
      const tipH = current.preview ? 320 : 200;
      const gap  = 16;
      let s = {};
      
      if (current.position === 'right')  s = { top: Math.max(8, rect.top + rect.height / 2 - tipH / 2), left: rect.right + gap };
      if (current.position === 'left')   s = { top: Math.max(8, rect.top + rect.height / 2 - tipH / 2), left: rect.left - tipW - gap };
      
      if (current.position === 'top' || current.position === 'bottom') {
        const spaceAbove = rect.top;
        const spaceBelow = window.innerHeight - rect.bottom;

        if (current.position === 'top' && spaceAbove < tipH + gap + 50) {
           s = { top: rect.bottom + gap, left: rect.left + rect.width / 2 - tipW / 2 };
        } else if (current.position === 'bottom' && spaceBelow < tipH + gap + 50) {
           s = { top: rect.top - tipH - gap, left: rect.left + rect.width / 2 - tipW / 2 };
        } else {
           s = current.position === 'top' 
             ? { top: rect.top - tipH - gap, left: rect.left + rect.width / 2 - tipW / 2 }
             : { top: rect.bottom + gap, left: rect.left + rect.width / 2 - tipW / 2 };
        }
      }
      
      // 최종 위치 보정 (화면 밖으로 나가는 것 방지)
      s.left = Math.max(8, Math.min(s.left, window.innerWidth  - tipW - 8));
      s.top  = Math.max(8, Math.min(s.top,  window.innerHeight - tipH - 80));
      
      setTooltipStyle(s);
    };

    calc();
  }, [step, current]);

  const handleClose = (markDone = false) => {
  // 🌟 체크박스나 완료 여부에 상관없이, '건너뛰기'를 눌러도 무조건 영구 저장!
  localStorage.setItem(TUTORIAL_KEY, '1');
  onClose();
};

  const isCenterModal = !current.target;

  const StepDots = ({ small }) => (
    <div className="flex items-center gap-1.5">
      {STEPS.map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${small ? 'h-1' : 'h-1.5'}`}
          style={{ width: i === step ? (small ? '14px' : '20px') : (small ? '4px' : '6px'), background: i === step ? '#2f6bfb' : '#e2e8f0' }} />
      ))}
    </div>
  );

  const NavRow = ({ small }) => (
    <div className="flex gap-2 mt-3">
      {!isFirst && (
        <button onClick={() => setStep(s => s - 1)}
          className={`flex items-center gap-1 rounded-xl font-medium border border-gray-200 text-gray-500 hover:bg-gray-100 transition ${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'}`}>
          <ChevronLeft className={small ? 'w-3.5 h-3.5' : 'w-4 h-4'} /> 이전
        </button>
      )}
      <button onClick={() => isLast ? handleClose(true) : setStep(s => s + 1)}
        className={`flex-1 flex items-center justify-center gap-1 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 transition shadow ${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'}`}>
        {isLast ? '시작하기 🚀' : <><span>다음</span><ChevronRight className={small ? 'w-3.5 h-3.5' : 'w-4 h-4'} /></>}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100]">
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="bh-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightStyle && (
              <rect x={spotlightStyle.left} y={spotlightStyle.top}
                width={spotlightStyle.width} height={spotlightStyle.height} rx="14" fill="black" />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#bh-mask)" />
      </svg>

      {spotlightStyle && (
        <div className="absolute rounded-2xl pointer-events-none transition-all duration-300"
          style={{
            top: spotlightStyle.top, left: spotlightStyle.left,
            width: spotlightStyle.width, height: spotlightStyle.height,
            boxShadow: '0 0 0 3px rgba(47,107,251,0.9), 0 0 32px rgba(47,107,251,0.35)',
          }} />
      )}

      {isCenterModal && (
        <div className="absolute inset-0 flex items-center justify-center" onClick={e => e.stopPropagation()}>
          <div className="w-[400px] bg-white rounded-3xl p-8 shadow-2xl border border-blue-100 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <button onClick={() => handleClose(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1a2332] mb-2">{current.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{current.description}</p>
            </div>
            <StepDots />
            {isLast && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={neverShow} onChange={e => setNeverShow(e.target.checked)} className="w-4 h-4 accent-blue-500" />
                <span className="text-xs text-gray-400">다음에 접속할 때 이 가이드를 보지 않기</span>
              </label>
            )}
            <NavRow />
            {!isLast && (
              <button onClick={() => handleClose(false)} className="text-xs text-center text-gray-400 hover:text-gray-500 transition">건너뛰기</button>
            )}
          </div>
        </div>
      )}

      {!isCenterModal && (
        <div className="absolute rounded-2xl shadow-2xl bg-white flex flex-col overflow-hidden transition-all duration-300"
          style={{ ...tooltipStyle, width: '300px', border: '1px solid rgba(47,107,251,0.12)' }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-1">
            <h3 className="font-black text-sm text-[#1a2332] leading-snug">{current.title}</h3>
            <button onClick={() => handleClose(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 flex-shrink-0 transition">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line px-4">{current.description}</p>
          <div className="px-4"><StepPreview type={current.preview} /></div>
          <div className="px-4 pt-2 pb-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <StepDots small />
              <span className="text-[10px] text-gray-400">{step + 1} / {STEPS.length}</span>
            </div>
            <NavRow small />
            <button onClick={() => handleClose(false)} className="text-[10px] text-center text-gray-400 hover:text-gray-500 transition">건너뛰기</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BookingHistory 본체
// ─────────────────────────────────────────────────────────────────────────────
export default function BookingHistory() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('requested');
  const [filter, setFilter]       = useState('전체');
  const [query, setQuery]         = useState('');
  const [expanded, setExpanded]   = useState(null);
  const [bookings, setBookings]   = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 🌟 [핵심 1] 삭제했던 튜토리얼 켜기/끄기 상태값 복구!
  const [showTutorial, setShowTutorial] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  let currentUserId = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('user_id');
  if (!currentUserId) {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        currentUserId = payload.user_id || payload.id;
        if (currentUserId) localStorage.setItem('userId', currentUserId);
      } catch (e) {}
    }
  }

  // 🌟 [핵심 2] 처음 접속했을 때 한 번만 튜토리얼 띄우기 복구!
  useEffect(() => {
    const isDone = localStorage.getItem(TUTORIAL_KEY);
    if (!isDone) {
      const timer = setTimeout(() => setShowTutorial(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!currentUserId) { setIsLoading(false); return; }
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const endpoint = activeTab === 'received'
          ? `${BACKEND_URL}/api/booking/mentor/${currentUserId}`
          : `${BACKEND_URL}/api/booking/mentee/${currentUserId}`;
        const res = await axios.get(endpoint);
        setBookings(res.data || []);
      } catch (e) {
        console.error('예약 내역 로드 실패:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
    setExpanded(null);
  }, [currentUserId, activeTab, BACKEND_URL]);

  const handleConfirm = async (bookingId) => {
    try {
      await axios.post(`${BACKEND_URL}/api/booking/confirm/${bookingId}`);
      alert('🎉 티타임 예약이 최종 확정되었습니다!');
      setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, status: 'CONFIRMED' } : b));
    } catch { alert('확정 처리에 실패했습니다.'); }
  };

  const handleReject = async (bookingId) => {
    if (!window.confirm('정말 이 티타임 신청을 거절하시겠습니까?')) return;
    try {
      await axios.post(`${BACKEND_URL}/api/booking/reject/${bookingId}`);
      alert('티타임 예약이 거절되었습니다.');
      setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, status: 'REJECTED' } : b));
    } catch { alert('거절 처리에 실패했습니다.'); }
  };

  const handleCancelRequest = async (bookingId) => {
    if (!window.confirm('정말 이 티타임 신청을 취소하시겠습니까?')) return;
    try {
      await axios.post(`${BACKEND_URL}/api/booking/reject/${bookingId}`);
      alert('티타임 신청이 취소되었습니다.');
      setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, status: 'REJECTED' } : b));
    } catch { alert('취소 처리에 실패했습니다.'); }
  };

  const processedBookings = Array.isArray(bookings) ? bookings.filter((b) => {
    if (activeTab === 'received' && b.status === 'PENDING') return false;
    const matchF = filter === '전체' || b.status === filter;
    const targetName = b.partner_name || b.mentee_name || '';
    const matchQ = query.trim() === '' ||
      targetName.toLowerCase().includes(query.toLowerCase()) ||
      (b.questions || '').toLowerCase().includes(query.toLowerCase());
    return matchF && matchQ;
  }) : [];

  const formatDate = (date, time) => {
    if (!date) return '시간 미정';
    const d    = new Date(`${date}T${time || '00:00'}`);
    const ampm = d.getHours() >= 12 ? '오후' : '오전';
    const h12  = d.getHours() % 12 || 12;
    const min  = String(d.getMinutes()).padStart(2, '0');
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${ampm} ${h12}:${min}`;
  };

  let firstCardMarked = false;

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-700 font-sans">
        <div className="flex-1 px-6 md:px-7 py-2 max-w-5xl mx-auto w-full">

          {/* ── 타이틀 + 가이드 버튼 ── */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TeacupIcon className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold tracking-widest text-blue-600 uppercase">Booking History</span>
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">예약 내역</h1>
              <p className="text-sm text-gray-500">지금까지 진행된 모든 티타임 요청과 예약 상태를 확인하세요.</p>
            </div>
            <button
              onClick={() => setShowTutorial(true)}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition shadow-sm mt-1"
            >
              <HelpCircle className="w-4 h-4" /> 가이드 보기
            </button>
          </div>

          {/* ── 탭 메뉴 — data-tour ── */}
          <div data-tour="main-tabs" className="flex gap-2 bg-gray-200/50 p-1.5 rounded-xl mb-8 max-w-sm">
            <button
              onClick={() => { setActiveTab('requested'); setFilter('전체'); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
                activeTab === 'requested' ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-700 shadow-none'
              }`}
            >
              내가 신청한 티타임
            </button>
            <button
              onClick={() => { setActiveTab('received'); setFilter('전체'); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
                activeTab === 'received' ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-700 shadow-none'
              }`}
            >
              신청받은 티타임
            </button>
          </div>

          {/* ── 검색 & 필터 — data-tour ── */}
          <div data-tour="search-filter" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text" value={query} onChange={e => setQuery(e.target.value)}
                  placeholder="이름 또는 질문 내용으로 검색..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition bg-gray-50"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {FILTERS.map(f => (
                  <button key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                      filter === f ? 'bg-[#1a2332] text-white border-[#1a2332]' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {FILTER_LABEL[f]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── 리스트 ── */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : processedBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-28 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                  <MessageSquare className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-base font-bold text-gray-500">예약 내역이 없습니다.</p>
                <p className="text-sm text-gray-400 mt-1">
                  {activeTab === 'received' ? '아직 도착한 신청이 없습니다.' : '새로운 멘토에게 티타임을 신청해보세요!'}
                </p>
              </div>
            ) : (
              processedBookings.map((b) => {
                const meta       = STATUS_META[b.status] || STATUS_META.PAID;
                const isExpanded = expanded === b.booking_id;
                const name       = b.partner_name || b.mentee_name || '알 수 없음';
                const isCancelled= b.status === 'REJECTED';

                const tourAttr = !firstCardMarked ? { 'data-tour': 'booking-card' } : {};
                if (!firstCardMarked) firstCardMarked = true;

                return (
                  <div
                    key={b.booking_id}
                    {...tourAttr}
                    className={`bg-white rounded-2xl overflow-hidden transition-all duration-200 border ${
                      isExpanded ? 'border-blue-300 shadow-md ring-2 ring-blue-50' : 'border-gray-200 hover:border-gray-300 shadow-sm'
                    }`}
                  >
                    <button
                      onClick={() => setExpanded(isExpanded ? null : b.booking_id)}
                      className="w-full flex flex-col md:flex-row md:items-center gap-4 px-6 py-5 text-left relative"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: meta.color }} />
                      <div className="flex items-center gap-4 w-full md:w-1/3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-lg shrink-0">
                          {name.slice(0, 1)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-extrabold text-gray-900 text-lg truncate">{name}</span>
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                              {activeTab === 'requested' ? '호스트' : '게스트'}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-gray-500 truncate">{b.topic || '자유 주제 티타임'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 md:w-1/3">
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm font-bold">{formatDate(b.booking_date, b.booking_time)}</span>
                      </div>
                      <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-1/3 mt-2 md:mt-0">
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${meta.bg} ${meta.text} ${meta.border}`}>
                          {meta.icon}{meta.label}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 bg-gray-50/50 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                          <div className="space-y-4">
                            <p className="text-xs font-extrabold text-gray-400 tracking-wider">세부 정보</p>
                            <div className="flex items-center gap-3">
                              <TrendingUp className="w-4 h-4 text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-500 w-16">예약번호</span>
                              <span className="text-sm font-bold text-gray-900">{b.booking_id}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
                              <span className="text-sm text-gray-500 w-16">결제금액</span>
                              <span className="text-sm font-bold text-gray-900">
                                {b.price ? `₩${b.price.toLocaleString()}` : '15000원'}
                              </span>
                            </div>
                            {b.questions && (
                              <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xs font-extrabold text-blue-600 mb-2">사전 질문 및 요청사항</p>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{b.questions}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col justify-end gap-3">
                            {activeTab === 'received' && b.status === 'PAID' && (
                              <div className="flex items-center gap-2 w-full mt-4">
                                <button onClick={() => handleReject(b.booking_id)}
                                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors">
                                  거절하기
                                </button>
                                <button onClick={() => handleConfirm(b.booking_id)}
                                  className="flex-[2] flex justify-center items-center gap-1 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors">
                                  티타임 수락하기 <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            {activeTab === 'requested' && (b.status === 'PAID' || b.status === 'CONFIRMED') && (
                              <div className="flex items-center gap-2 w-full mt-4">
                                <button onClick={() => handleCancelRequest(b.booking_id)}
                                  className="w-full py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors flex items-center justify-center gap-1.5">
                                  <XCircle className="w-4 h-4" /> 신청 취소하기
                                </button>
                              </div>
                            )}
                            {activeTab === 'requested' && b.status === 'CONFIRMED' && (
                              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 mt-1">
                                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                                <div>
                                  <p className="text-sm font-bold text-emerald-800">티타임이 확정되었습니다!</p>
                                  <p className="text-xs text-emerald-600 mt-1">예정된 시간에 맞춰 화상 채팅방 링크가 활성화됩니다.</p>
                                </div>
                              </div>
                            )}
                            {isCancelled && (
                              <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 rounded-xl border border-red-100 text-red-600">
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span className="text-xs font-bold leading-relaxed">
                                  이 예약은 취소되거나 거절되었습니다. 결제된 금액이 있다면 전액 환불 처리됩니다.
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 🌟 [핵심 3] 삭제했던 튜토리얼을 화면 맨 밑에 렌더링하도록 복구! */}
      {showTutorial && (
        <TutorialOverlay onClose={() => setShowTutorial(false)} />
      )}
    </>
  );
}