import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, Calendar, MessageSquare, User,
  DollarSign, Clock, Repeat, Star,
  BookOpen, Award, ChevronRight, Coffee, Users,
  ArrowUpRight, Sparkles, Bell, Hourglass, HelpCircle, X,
  CheckCircle, AlertCircle, ChevronLeft,
} from 'lucide-react';
import ScheduleManager from './ScheduleManager';
import BookingHistory from './BookingHistory';
import ProfileSetup from './ProfileSetup';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

// ────────────────────────────────────────────────────────────────────────────
// 튜토리얼 스텝 정의
// ────────────────────────────────────────────────────────────────────────────
const TUTORIAL_KEY_DASHBOARD = 'dashboard_home_tutorial_done';
const TUTORIAL_KEY_SCHEDULE  = 'dashboard_schedule_tutorial_done';
const TUTORIAL_KEY_HISTORY   = 'dashboard_history_tutorial_done';

// 대시보드 홈 스텝
const DASHBOARD_STEPS = [
  {
    id: 'welcome',
    title: '👋 티타임즈 대시보드에 오신 것을 환영해요!',
    description: '이곳은 나의 모든 티타임 활동을 한눈에 파악할 수 있는 메인 공간입니다.',
    target: '[data-tour="welcome-msg"]',
    position: 'bottom',
  },
  {
    id: 'activity-sections',
    title: '📊 내 활동 요약',
    description: '호스트로서의 수익과 일정, 게스트로서의 예약 상태를 이곳에서 바로 확인할 수 있습니다.',
    target: '[data-tour="activity-sections"]',
    position: 'bottom',
  },
  {
    id: 'sidebar-tabs',
    title: '🧭 메뉴 이동',
    description: '일정 관리나 예약 내역 탭으로 이동해보세요!\n해당 메뉴에 처음 들어가시면 맞춤형 튜토리얼이 추가로 진행됩니다.',
    target: '[data-tour="sidebar-tabs"]',
    position: 'right',
  },
  {
    id: 'sidebar-profile',
    title: '⚙️ 프로필 설정',
    description: '언제든 이곳을 눌러 내 정보를 업데이트해보세요!',
    target: '[data-tour="sidebar-profile"]',
    position: 'right',
  },
];

// 일정 관리 스텝 (예시 데이터와 함께 각 UI 요소를 spotlight)
const SCHEDULE_STEPS = [
  {
    id: 'schedule-intro',
    title: '📅 일정 관리 페이지예요',
    description: '호스트로서 내 티타임 일정을 한눈에 확인하고 관리할 수 있어요.\n아래에서 각 기능을 하나씩 살펴볼게요!',
    target: null,
    mockData: true,
  },
  {
    id: 'schedule-calendar',
    title: '🗓️ 캘린더 영역',
    description: '월별 캘린더에서 예약이 잡힌 날짜를 한눈에 볼 수 있어요.\n• 파란 점 = 확정된 예약이 있는 날\n• 날짜를 클릭하면 해당 날의 상세 일정이 오른쪽에 표시돼요.',
    target: '[data-tour="schedule-calendar"]',
    position: 'right',
    mockData: true,
  },
  {
    id: 'schedule-list',
    title: '📋 예약 목록',
    description: '선택한 날짜의 예약 목록이 여기에 표시돼요.\n• 게스트 이름, 예약 시간, 상태를 확인할 수 있어요.\n• "수락" / "거절" 버튼으로 대기 중인 예약을 처리할 수 있어요.',
    target: '[data-tour="schedule-list"]',
    position: 'left',
    mockData: true,
    exampleCard: {
      type: 'booking',
      name: '김민준',
      time: '오후 2:00 – 2:30',
      status: 'pending',
      topic: 'UX 포트폴리오 리뷰',
    },
  },
  {
    id: 'schedule-status',
    title: '🔖 예약 상태 종류',
    description:
      '예약 상태는 세 가지예요.\n\n• 🟡 대기 중 — 게스트가 신청, 호스트 수락 전\n• 🟢 확정됨 — 호스트가 수락 완료, 커피챗 예정\n• 🔴 취소됨 — 게스트 또는 호스트가 취소한 예약',
    target: '[data-tour="schedule-list"]',
    position: 'left',
    mockData: true,
  },
  {
    id: 'schedule-timeslot',
    title: '⏰ 가용 시간 등록',
    description: '게스트가 예약할 수 있는 시간대를 직접 설정해요.\n"가용 시간 추가" 버튼을 눌러 요일·시간을 지정하면, 해당 슬롯이 예약 가능 상태로 노출돼요.',
    target: '[data-tour="schedule-timeslot"]',
    position: 'top',
    mockData: true,
  },
];

// 예약 내역 스텝
const HISTORY_STEPS = [
  {
    id: 'history-intro',
    title: '🗂️ 예약 내역 페이지예요',
    description: '게스트로서 신청하거나 완료한 모든 티타임 기록을 확인할 수 있어요.\n아래에서 각 기능을 살펴볼게요!',
    target: null,
    mockData: true,
  },
  {
    id: 'history-filter',
    title: '🔍 필터 탭',
    description: '상단 탭으로 예약 상태별 필터링이 가능해요.\n• 전체 — 모든 예약\n• 대기 중 — 호스트 수락 전\n• 확정 — 곧 진행될 티타임\n• 완료 — 이미 끝난 티타임\n• 취소 — 취소된 예약',
    target: '[data-tour="history-filter"]',
    position: 'bottom',
    mockData: true,
  },
  {
    id: 'history-card',
    title: '📄 예약 카드',
    description: '각 예약은 카드 형태로 표시돼요.\n• 호스트 이름과 주제를 한눈에 확인\n• 예약 날짜와 시간\n• 현재 상태 배지 (대기/확정/완료/취소)',
    target: '[data-tour="history-card"]',
    position: 'bottom',
    mockData: true,
    exampleCard: {
      type: 'history',
      name: '박지수 (커리어 코치)',
      time: '2025년 7월 14일 · 오후 3:00',
      status: 'confirmed',
      topic: '커리어 전환 상담',
    },
  },
  {
    id: 'history-action',
    title: '✅ 완료 후 리뷰 작성',
    description: '티타임이 완료되면 카드 하단에 "후기 작성" 버튼이 생겨요.\n솔직한 후기를 남기면 다른 게스트에게도 큰 도움이 됩니다 ⭐',
    target: '[data-tour="history-card"]',
    position: 'bottom',
    mockData: true,
  },
  {
    id: 'history-cancel',
    title: '❌ 예약 취소',
    description: '확정 전(대기 중) 상태의 예약은 취소할 수 있어요.\n확정된 예약을 취소할 경우 패널티가 적용될 수 있으니, 신중하게 결정해주세요.',
    target: '[data-tour="history-card"]',
    position: 'bottom',
    mockData: true,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// 유틸
// ────────────────────────────────────────────────────────────────────────────
function getCleanUserId() {
  let id = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('user_id');
  if (!id || id === 'null' || id === 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        id = payload.user_id || payload.id;
        if (id) localStorage.setItem('userId', id);
      } catch (e) {}
    }
  }
  return id ? parseInt(String(id).replace(/[^0-9]/g, ''), 10) : null;
}

// ────────────────────────────────────────────────────────────────────────────
// 공용 소형 컴포넌트
// ────────────────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${accent}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-2xl font-bold text-[#1a2332] mb-0.5">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
      {sub && <div className="text-xs text-emerald-500 mt-1 font-medium">{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-[#1a2332]">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-xs font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1">
          {action} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, message, cta, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm text-gray-400 mb-3">{message}</p>
      {cta && (
        <button onClick={onCta} className="text-xs font-semibold text-blue-500 hover:text-blue-600 border border-blue-200 px-4 py-2 rounded-full hover:bg-blue-50 transition-colors">
          {cta}
        </button>
      )}
    </div>
  );
}

function StarRating({ rating }) {
  const r = isNaN(Number(rating)) ? 0 : Number(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(r) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
      <span className="text-xs text-gray-500 ml-1">{r.toFixed(1)}</span>
    </div>
  );
}

// 예시 카드 컴포넌트 (튜토리얼 중 말풍선에 표시)
function ExampleCard({ card }) {
  if (!card) return null;
  const statusMap = {
    pending:   { label: '대기 중',  bg: 'bg-yellow-50',  text: 'text-yellow-600',  dot: 'bg-yellow-400' },
    confirmed: { label: '확정됨',   bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-400' },
    completed: { label: '완료',     bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-400' },
    cancelled: { label: '취소됨',   bg: 'bg-red-50',     text: 'text-red-500',     dot: 'bg-red-400' },
  };
  const s = statusMap[card.status] || statusMap.pending;
  return (
    <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs">
      <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mb-2">예시 카드</p>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-gray-800">{card.name}</p>
          <p className="text-gray-500 mt-0.5">{card.topic}</p>
          <p className="text-gray-400 mt-0.5">{card.time}</p>
        </div>
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold ${s.bg} ${s.text} whitespace-nowrap`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 범용 튜토리얼 오버레이
// ────────────────────────────────────────────────────────────────────────────
function TutorialOverlay({ steps, tutorialKey, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [maskRect, setMaskRect]   = useState({ x: 0, y: 0, width: 0, height: 0, padding: 8 });
  const [tipPos, setTipPos]       = useState({ top: 0, left: 0 });
  const [neverShow, setNeverShow] = useState(false);

  const current  = steps[stepIndex];
  const isFirst  = stepIndex === 0;
  const isLast   = stepIndex === steps.length - 1;

  // 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // spotlight 위치 계산
  const calcPosition = useCallback(() => {
    if (!current?.target) {
      setMaskRect({ x: 0, y: 0, width: 0, height: 0, padding: 0 });
      setTipPos({ top: window.innerHeight / 2 - 120, left: window.innerWidth / 2 - 160 });
      return;
    }
    const el = document.querySelector(current.target);
    if (!el) { setTimeout(calcPosition, 80); return; }

    const rect = el.getBoundingClientRect();
    const pad  = 12;
    setMaskRect({ x: rect.left, y: rect.top, width: rect.width, height: rect.height, padding: pad });

    const TIP_W = 320, TIP_H = 260, GAP = 18;
    let top, left;
    const pos = current.position || 'bottom';

    if (pos === 'bottom') { top = rect.bottom + pad + GAP; left = rect.left + rect.width / 2 - TIP_W / 2; }
    if (pos === 'top')    { top = rect.top - pad - TIP_H - GAP; left = rect.left + rect.width / 2 - TIP_W / 2; }
    if (pos === 'right')  { top = rect.top + rect.height / 2 - TIP_H / 2; left = rect.right + pad + GAP; }
    if (pos === 'left')   { top = rect.top + rect.height / 2 - TIP_H / 2; left = rect.left - TIP_W - pad - GAP; }

    top  = Math.max(12, Math.min(top,  window.innerHeight - TIP_H - 12));
    left = Math.max(12, Math.min(left, window.innerWidth  - TIP_W - 12));
    setTipPos({ top, left });
  }, [current]);

  useEffect(() => {
    calcPosition();
    window.addEventListener('resize', calcPosition);
    return () => window.removeEventListener('resize', calcPosition);
  }, [calcPosition]);

  const handleClose = (markDone = false) => {
    if (markDone || neverShow) localStorage.setItem(tutorialKey, 'true');
    onClose();
  };

  const isCenterModal = !current?.target;

  // 스텝 도트
  const StepDots = () => (
    <div className="flex items-center gap-1.5">
      {steps.map((_, i) => (
        <div key={i} className="h-1.5 rounded-full transition-all duration-300"
          style={{ width: i === stepIndex ? '18px' : '6px', background: i === stepIndex ? '#2f6bfb' : '#e2e8f0' }} />
      ))}
    </div>
  );

  // 공통 버튼 영역
  const NavButtons = () => (
    <div className="flex items-center justify-between mt-4">
      <StepDots />
      <div className="flex items-center gap-2">
        {!isFirst && (
          <button onClick={() => setStepIndex(i => i - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 border border-gray-200 transition">
            <ChevronLeft className="w-3.5 h-3.5" /> 이전
          </button>
        )}
        <button onClick={() => isLast ? handleClose(true) : setStepIndex(i => i + 1)}
          className="flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 shadow transition">
          {isLast ? '시작하기 🚀' : <><span>다음</span><ChevronRight className="w-3.5 h-3.5" /></>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100]">
      {/* 어두운 배경 + spotlight 구멍 */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="tut-mask">
            <rect width="100%" height="100%" fill="white" />
            {maskRect.width > 0 && (
              <rect
                x={maskRect.x - maskRect.padding} y={maskRect.y - maskRect.padding}
                width={maskRect.width + maskRect.padding * 2} height={maskRect.height + maskRect.padding * 2}
                rx="16" fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#tut-mask)" />
      </svg>

      {/* 파란 spotlight 테두리 */}
      {maskRect.width > 0 && (
        <div className="absolute rounded-2xl pointer-events-none transition-all duration-300"
          style={{
            top: maskRect.y - maskRect.padding, left: maskRect.x - maskRect.padding,
            width: maskRect.width + maskRect.padding * 2, height: maskRect.height + maskRect.padding * 2,
            boxShadow: '0 0 0 3px rgba(47,107,251,0.9), 0 0 28px rgba(47,107,251,0.4)',
          }} />
      )}

      {/* 중앙 모달 (타겟 없는 스텝) */}
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
            {isLast && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={neverShow} onChange={e => setNeverShow(e.target.checked)} className="w-4 h-4 accent-blue-500" />
                <span className="text-xs text-gray-400">다음에 접속할 때 이 가이드를 보지 않기</span>
              </label>
            )}
            <NavButtons />
            {!isLast && (
              <button onClick={() => handleClose(false)} className="text-xs text-center text-gray-400 hover:text-gray-500 transition">
                건너뛰기
              </button>
            )}
          </div>
        </div>
      )}

      {/* 툴팁 말풍선 (타겟 있는 스텝) */}
      {!isCenterModal && (
        <div className="absolute w-80 bg-white rounded-2xl p-5 shadow-2xl border border-blue-100 transition-all duration-300"
          style={{ top: tipPos.top, left: tipPos.left }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-black text-sm text-[#1a2332] leading-snug">{current.title}</h3>
            <button onClick={() => handleClose(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 flex-shrink-0 transition">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">{current.description}</p>
          {current.exampleCard && <ExampleCard card={current.exampleCard} />}
          <NavButtons />
          <button onClick={() => handleClose(false)} className="text-[10px] w-full text-center text-gray-400 hover:text-gray-500 mt-2 transition">
            건너뛰기
          </button>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 메인 Dashboard
// ────────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading]     = useState(true);

  const [userName, setUserName] = useState(localStorage.getItem('userName') || '회원');
  const [isMentor, setIsMentor] = useState(false);
  const [mentorStats, setMentorStats]   = useState({});
  const [upcomingChats, setUpcomingChats]     = useState([]);
  const [recentReviews, setRecentReviews]     = useState([]);
  const [menteeStats, setMenteeStats]   = useState({});
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [mentorHistory, setMentorHistory]     = useState([]);

  // 튜토리얼 상태
  const [activeTutorial, setActiveTutorial] = useState(null); // null | 'dashboard' | 'schedule' | 'history'

  // 탭 변경 시 URL state 반영
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 데이터 로드
  useEffect(() => {
    const uid = getCleanUserId();
    if (!uid) { alert('로그인 정보가 만료되었습니다.'); navigate('/login'); return; }

    async function load() {
      setLoading(true);
      try {
        try {
          const { data } = await axios.get(`${BACKEND_URL}/api/user/${uid}`);
          if (data?.name) { setUserName(data.name); localStorage.setItem('userName', data.name); }
        } catch {}

        let mentor = false;
        try {
          const { data } = await axios.get(`${BACKEND_URL}/api/mentors/list`);
          mentor = data.some(m => parseInt(m.user_id, 10) === uid);
          setIsMentor(mentor);
        } catch {}

        if (mentor) {
          try {
            const { data } = await axios.get(`${BACKEND_URL}/api/mentor/dashboard/${uid}`);
            setMentorStats(data.stats || {});
            setUpcomingChats(data.upcoming_chats || []);
            setRecentReviews(data.recent_reviews || []);
          } catch {}
        }

        try {
          const { data } = await axios.get(`${BACKEND_URL}/api/mentee/dashboard/${uid}`);
          setMenteeStats(data.stats || {});
          setUpcomingBookings(data.upcoming_bookings || []);
          setMentorHistory(data.mentor_history || data.recent_mentors || []);
        } catch {}
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  // 탭 전환 시 해당 튜토리얼 자동 노출 (최초 1회)
  useEffect(() => {
    if (loading) return;
    if (activeTab === 'dashboard' && !localStorage.getItem(TUTORIAL_KEY_DASHBOARD)) {
      setActiveTutorial('dashboard');
    } else if (activeTab === 'schedule' && !localStorage.getItem(TUTORIAL_KEY_SCHEDULE)) {
      // ScheduleManager 렌더 후 data-tour 요소가 생길 시간을 줌
      setTimeout(() => setActiveTutorial('schedule'), 400);
    } else if (activeTab === 'history' && !localStorage.getItem(TUTORIAL_KEY_HISTORY)) {
      setTimeout(() => setActiveTutorial('history'), 400);
    }
  }, [activeTab, loading]);

  // 튜토리얼 닫기
  const closeTutorial = () => setActiveTutorial(null);

  // ── 렌더 함수들 ──────────────────────────────────────
  const renderMentorSection = () => {
    if (!isMentor) {
      return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">호스트 활동</span>
            </div>
            <h3 className="text-lg font-bold text-[#1a2332] mb-1">호스트로 등록해보세요</h3>
            <p className="text-sm text-gray-500">경험을 나누고 수익을 얻을 수 있어요.</p>
          </div>
          <button onClick={() => setActiveTab('profile')}
            className="flex-shrink-0 ml-6 bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-600 transition flex items-center gap-2">
            시작하기 <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-5 bg-amber-400 rounded-full" />
          <h2 className="text-base font-bold text-[#1a2332]">호스트 활동</h2>
          <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-medium">활성</span>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-5">
          <StatCard icon={DollarSign} label="이번 달 수익" value={`₩${Number(mentorStats?.monthly_earnings || mentorStats?.revenue || mentorStats?.total_earnings || 0).toLocaleString()}`} accent="bg-emerald-500" sub="↑ 꾸준히 상승중" />
          <StatCard icon={Star}       label="평균 평점"    value={`${mentorStats?.average_rating || '0.0'}`}                             accent="bg-amber-400" />
          <StatCard icon={Clock}      label="총 멘토링"    value={`${mentorStats?.mentoring_hours || mentorStats?.total_hours || 0}시간`} accent="bg-orange-400" />
          <StatCard icon={Repeat}     label="재예약률"     value={`${mentorStats?.rebooking_rate || 0}%`}                               accent="bg-violet-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="예정된 티타임" action="일정 관리" onAction={() => setActiveTab('schedule')} />
            {upcomingChats.length === 0
              ? <EmptyState icon={Calendar} message="예정된 티타임이 없습니다." />
              : <ul className="space-y-2">
                  {upcomingChats.slice(0,4).map((c, i) => (
                    <li 
                      key={c.id||i} 
                      onClick={() => c.id && navigate(`/coffee-chat-detail/${c.id}`)} // 💡 클릭 시 상세 페이지로 이동
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors" // 💡 마우스 효과 추가
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#1a2332]">{c.mentee_name||c.partner_name||'티타임 참여자'}</p>
                        <p className="text-xs text-gray-400">{c.scheduled_time||c.booking_date||'일정 미정'}</p>
                      </div>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">{c.status==='CONFIRMED'?'확정됨':'예정'}</span>
                    </li>
                  ))}
                </ul>
            }
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="최근 리뷰" />
            {recentReviews.length === 0
              ? <EmptyState icon={MessageSquare} message="아직 받은 리뷰가 없습니다." />
              : <ul className="space-y-3">
                  {recentReviews.slice(0,3).map((r,i) => (
                    <li key={i} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[#1a2332]">{r.author_name||r.mentee_name||'익명'}</span>
                        <StarRating rating={r.rating||5} />
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{r.content||r.review||r.comment||'내용 없음'}</p>
                    </li>
                  ))}
                </ul>
            }
          </div>
        </div>
      </div>
    );
  };

  const renderMenteeSection = () => (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
        <h2 className="text-base font-bold text-[#1a2332]">게스트 활동</h2>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard icon={Coffee}        label="참여한 티타임" value={`${menteeStats?.total_chats||menteeStats?.completed_sessions||0}회`} accent="bg-blue-500" />
        <StatCard icon={Clock}         label="총 학습 시간"  value={`${menteeStats?.learning_hours||0}시간`}    accent="bg-cyan-500" />
        <StatCard icon={Hourglass}     label="수락 대기"     value={`${menteeStats?.pending_requests||menteeStats?.pending_bookings||0}건`} accent="bg-orange-400" />
        <StatCard icon={MessageSquare} label="작성한 후기"   value={`${menteeStats?.written_reviews||menteeStats?.my_reviews||0}개`} accent="bg-emerald-500" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHeader title="다가오는 예약" action="예약 내역" onAction={() => setActiveTab('history')} />
          {upcomingBookings.length === 0
            ? <EmptyState icon={Calendar} message="예정된 티타임이 없어요." cta="호스트 찾기" onCta={() => navigate('/mentors')} />
            : <ul className="space-y-2">
                {upcomingBookings.slice(0,4).map((b, i) => (
                  <li 
                    key={b.id||i} 
                    onClick={() => b.id && navigate(`/coffee-chat-detail/${b.id}`)} // 💡 클릭 시 상세 페이지로 이동
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors" // 💡 마우스 효과 추가
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#1a2332]">{b.mentor_name||b.partner_name||'호스트'}</p>
                      <p className="text-xs text-gray-400">{b.scheduled_time||b.booking_date||'일정 미정'}</p>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-medium">{b.status==='CONFIRMED'?'확정됨':'예정'}</span>
                  </li>
                ))}
              </ul>
          }
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHeader title="최근 만난 호스트" />
          {(!Array.isArray(mentorHistory)||mentorHistory.length===0)
            ? <EmptyState icon={BookOpen} message="아직 티타임 기록이 없어요." cta="첫 티타임 예약하기" onCta={() => navigate('/host-list')} />
            : <ul className="space-y-3">
                {mentorHistory.slice(0,4).map((m,i) => (
                  <li key={i} className="flex items-center gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(m.name||m.mentor_name||'M').slice(0,1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1a2332] truncate">{m.name||m.mentor_name||'호스트'}</p>
                      <p className="text-xs text-gray-400 truncate">{m.topic||m.company||'—'}</p>
                    </div>
                    {m.my_rating && <StarRating rating={m.my_rating} />}
                  </li>
                ))}
              </ul>
          }
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div data-tour="welcome-msg" className="p-2 -m-2 rounded-xl">
          <p className="text-sm text-gray-400 mb-1">
            {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
          <h1 className="text-3xl font-bold text-[#1a2332]">
            안녕하세요, <span className="text-blue-500">{userName}</span>님 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isMentor ? '호스트와 게스트 양쪽 활동을 한눈에 확인하세요.' : '오늘도 좋은 티타임이 기다리고 있어요.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTutorial('dashboard')}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition shadow-sm"
          >
            <HelpCircle className="w-4 h-4" /> 가이드 보기
          </button>

        </div>
      </div>

      <div data-tour="activity-sections" className="space-y-8 rounded-3xl p-2 -m-2">
        <div className="bg-gray-50/60 rounded-3xl p-6 border border-gray-100">{renderMentorSection()}</div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-dashed border-gray-200" />
          </div>
        </div>
        <div className="bg-gray-50/60 rounded-3xl p-6 border border-gray-100">{renderMenteeSection()}</div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">티타임즈 대시보드를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex h-screen overflow-hidden bg-gray-50 text-gray-900">
      {/* ── 사이드바 ── */}
      <aside className="w-64 bg-[#1a2332] text-white flex-shrink-0 flex flex-col">
        <div className="p-6 flex-1 flex flex-col min-h-0">
          {/* 유저 정보 */}
          <div className="flex items-center gap-3 mb-8 p-3 bg-white/5 rounded-xl border border-white/10 flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {userName.slice(0,1)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              <p className="text-xs text-gray-400">{isMentor ? '호스트 · 게스트' : '게스트'}</p>
            </div>
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto">
            {/* 메인 탭 — data-tour */}
            <div data-tour="sidebar-tabs" className="space-y-1 rounded-xl">
              {[
                { key: 'dashboard', icon: LayoutDashboard, label: '대시보드' },
                { key: 'schedule',  icon: Calendar,        label: '일정 관리',  mentorOnly: true },
                { key: 'history',   icon: MessageSquare,   label: '예약 내역' },
              ].filter(item => !item.mentorOnly || isMentor).map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.key} type="button" onClick={() => setActiveTab(item.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-left text-sm font-medium ${
                      activeTab === item.key ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-white/5 text-gray-400 hover:text-white'
                    }`}>
                    <Icon className="w-4 h-4" />{item.label}
                  </button>
                );
              })}
            </div>

            <div className="my-4 border-t border-white/10" />

            {/* 프로필 — data-tour */}
            <div data-tour="sidebar-profile" className="rounded-xl">
              <button type="button" onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-left text-sm font-medium ${
                  activeTab === 'profile' ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-white/5 text-gray-400 hover:text-white'
                }`}>
                <User className="w-4 h-4" />프로필 설정
              </button>
              {!isMentor && (
                <button type="button" onClick={() => setActiveTab('profile')}
                  className="mt-2 w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-left text-sm font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20">
                  <Award className="w-4 h-4" />호스트 등록하기
                </button>
              )}
            </div>
          </nav>
        </div>
      </aside>

      {/* ── 메인 콘텐츠 ── */}
      <main className="flex-1 min-w-0 p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'schedule'  && <ScheduleManager />}
          {activeTab === 'history'   && <BookingHistory />}
          {activeTab === 'profile'   && <ProfileSetup />}
        </div>
      </main>

      {/* ── 튜토리얼 오버레이 ── */}
      {activeTutorial === 'dashboard' && (
        <TutorialOverlay
          steps={DASHBOARD_STEPS}
          tutorialKey={TUTORIAL_KEY_DASHBOARD}
          onClose={closeTutorial}
        />
      )}
      {activeTutorial === 'schedule' && (
        <TutorialOverlay
          steps={SCHEDULE_STEPS}
          tutorialKey={TUTORIAL_KEY_SCHEDULE}
          onClose={closeTutorial}
        />
      )}
      {activeTutorial === 'history' && (
        <TutorialOverlay
          steps={HISTORY_STEPS}
          tutorialKey={TUTORIAL_KEY_HISTORY}
          onClose={closeTutorial}
        />
      )}
    </div>
  );
}