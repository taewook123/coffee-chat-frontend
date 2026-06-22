import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, Calendar, MessageSquare, User,
  Award, HelpCircle, X, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import ScheduleManager from './ScheduleManager';
import BookingHistory from './BookingHistory';
import ProfileSetup from './ProfileSetup';

// 💡 분리된 UI 위젯들 임포트
import { MentorSection, MenteeSection } from '../components/DashboardWidgets';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

// ────────────────────────────────────────────────────────────────────────────
// 튜토리얼 데이터 & 범용 오버레이 컴포넌트
// ────────────────────────────────────────────────────────────────────────────
const TUTORIAL_KEY_DASHBOARD = 'dashboard_home_tutorial_done';
const DASHBOARD_STEPS = [
  { id: 'welcome', title: '👋 대시보드에 오신 것을 환영해요!', description: '나의 모든 티타임 활동을 한눈에 파악할 수 있어요.', target: '[data-tour="welcome-msg"]', position: 'bottom' },
  { id: 'activity', title: '📊 내 활동 요약', description: '호스트/게스트로서의 예약 상태와 수익을 확인할 수 있습니다.', target: '[data-tour="activity-sections"]', position: 'bottom' },
  { id: 'tabs', title: '🧭 메뉴 이동', description: '일정 관리나 예약 내역 탭으로 이동해보세요!', target: '[data-tour="sidebar-tabs"]', position: 'right' },
  { id: 'profile', title: '⚙️ 프로필 설정', description: '언제든 이곳을 눌러 내 정보를 업데이트해보세요!', target: '[data-tour="sidebar-profile"]', position: 'right' },
];

function TutorialOverlay({ steps, tutorialKey, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [maskRect, setMaskRect]   = useState({ x: 0, y: 0, width: 0, height: 0, padding: 8 });
  const [tipPos, setTipPos]       = useState({ top: 0, left: 0 });

  const current  = steps[stepIndex];
  const isFirst  = stepIndex === 0;
  const isLast   = stepIndex === steps.length - 1;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    let timer;
    const calcPosition = () => {
      if (!current?.target) {
        setMaskRect({ x: 0, y: 0, width: 0, height: 0, padding: 0 });
        setTipPos({ top: window.innerHeight / 2 - 130, left: window.innerWidth / 2 - 160 });
        return;
      }
      
      const el = document.querySelector(current.target);
      if (el) {
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
      } else {
        timer = setTimeout(calcPosition, 100);
      }
    };
    calcPosition();
    window.addEventListener('resize', calcPosition);
    return () => { clearTimeout(timer); window.removeEventListener('resize', calcPosition); };
  }, [current]);

  const forceSaveAndClose = (e) => {
    if (e) e.stopPropagation();
    localStorage.setItem(tutorialKey, 'true');
    setTimeout(() => onClose(), 0);
  };

  const isCenterModal = !current?.target;

  return (
    <div className="fixed inset-0 z-[100]">
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id={`tut-mask-${tutorialKey}`}>
            <rect width="100%" height="100%" fill="white" />
            {maskRect.width > 0 && <rect x={maskRect.x - maskRect.padding} y={maskRect.y - maskRect.padding} width={maskRect.width + maskRect.padding * 2} height={maskRect.height + maskRect.padding * 2} rx="16" fill="black" />}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask={`url(#tut-mask-${tutorialKey})`} />
      </svg>
      {maskRect.width > 0 && <div className="absolute rounded-2xl pointer-events-none transition-all duration-300" style={{ top: maskRect.y - maskRect.padding, left: maskRect.x - maskRect.padding, width: maskRect.width + maskRect.padding * 2, height: maskRect.height + maskRect.padding * 2, boxShadow: '0 0 0 3px rgba(47,107,251,0.9), 0 0 28px rgba(47,107,251,0.4)' }} />}

      <div className={`absolute bg-white rounded-2xl p-5 shadow-2xl border border-blue-100 transition-all duration-300 ${isCenterModal ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] p-8' : 'w-80'}`} style={!isCenterModal ? { top: tipPos.top, left: tipPos.left } : {}} onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2 mb-2">
          {isCenterModal && <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md mb-4"><Sparkles className="w-6 h-6 text-white" /></div>}
          <h3 className={`${isCenterModal ? 'text-xl' : 'text-sm'} font-black text-[#1a2332] leading-snug`}>{current.title}</h3>
          <button onClick={forceSaveAndClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 flex-shrink-0 transition"><X className="w-4 h-4" /></button>
        </div>
        <p className={`${isCenterModal ? 'text-sm' : 'text-xs'} text-gray-500 leading-relaxed whitespace-pre-line`}>{current.description}</p>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => <div key={i} className="h-1.5 rounded-full transition-all duration-300" style={{ width: i === stepIndex ? '18px' : '6px', background: i === stepIndex ? '#2f6bfb' : '#e2e8f0' }} />)}
          </div>
          <div className="flex items-center gap-2">
            {!isFirst && <button onClick={() => setStepIndex(i => i - 1)} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 border border-gray-200"><ChevronLeft className="w-3.5 h-3.5" /> 이전</button>}
            <button onClick={isLast ? forceSaveAndClose : () => setStepIndex(i => i + 1)} className="flex items-center gap-1 px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90">{isLast ? '완료 🎉' : <>다음<ChevronRight className="w-3.5 h-3.5" /></>}</button>
          </div>
        </div>
        {!isLast && <button onClick={forceSaveAndClose} className="text-[10px] w-full text-center text-gray-400 hover:text-gray-500 mt-2 transition">더 이상 보지 않기 (건너뛰기)</button>}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 유틸 (ID 추출)
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

  const [activeTutorial, setActiveTutorial] = useState(null);

  // 🌟 [에러 픽스] 튜토리얼 닫기 함수 선언!
  const closeTutorial = () => setActiveTutorial(null);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const uid = getCleanUserId();
    if (!uid) { alert('로그인 정보가 만료되었습니다.'); navigate('/login'); return; }

    async function load() {
      setLoading(true);
      try {
        // 1. 유저 정보
        try {
          const { data } = await axios.get(`${BACKEND_URL}/api/user/${uid}`);
          if (data?.name) { setUserName(data.name); localStorage.setItem('userName', data.name); }
        } catch {}

        // 2. 호스트 여부 체크
        let mentor = false;
        try {
          const { data } = await axios.get(`${BACKEND_URL}/api/mentors/list`);
          mentor = data.some(m => parseInt(m.user_id, 10) === uid);
          setIsMentor(mentor);
        } catch {}

        // 3. 🌟 호스트 데이터 매핑 (백엔드의 실제 키값 반영)
        if (mentor) {
          try {
            const { data } = await axios.get(`${BACKEND_URL}/api/mentor/dashboard/${uid}`);
            const stats = data.stats || data || {};
            
            console.log("🔥 백엔드 호스트 통계 원본:", stats); // 디버깅용 로그

            // 백엔드가 보내는 total_earnings, mentoring_hours 키를 명시적으로 찾습니다.
            setMentorStats({
              revenue: stats.total_earnings || stats.monthly_earnings || stats.revenue || 0,
              rating: stats.average_rating || stats.rating || '0.0',
              hours: stats.mentoring_hours || stats.total_hours || stats.hours || 0,
              rebookRate: stats.rebooking_rate || stats.retention_rate || 0,
              chats: stats.total_chats || 0
            });
            setUpcomingChats(data.upcoming_chats || []);
            setRecentReviews(data.recent_reviews || []);
          } catch (e) {
            console.error("호스트 데이터 로드 실패", e);
          }
        }

        // 4. 🌟 게스트 데이터 매핑 (백엔드의 실제 키값 반영)
        try {
          const { data } = await axios.get(`${BACKEND_URL}/api/mentee/dashboard/${uid}`);
          const stats = data.stats || data || {};

          console.log("🔥 백엔드 게스트 통계 원본:", stats); // 디버깅용 로그

          setMenteeStats({
            chats: stats.total_chats || stats.completed_sessions || stats.chats || 0,
            hours: stats.total_hours || stats.learning_hours || stats.hours || 0,
            pending: stats.pending_requests || stats.pending_bookings || stats.pending || 0,
            reviews: stats.written_reviews || stats.my_reviews || stats.reviews || 0
          });
          setUpcomingBookings(data.upcoming_bookings || []);
          setMentorHistory(data.mentor_history || data.recent_mentors || []);
        } catch (e) {
            console.error("게스트 데이터 로드 실패", e);
        }

      } finally {
        setLoading(false);
      }
    }
    load();
  }, [navigate]);

  useEffect(() => {
    if (loading) return;
    let timer;
    // 🌟 명확하게 'true' 라는 문자열이 저장되어 있는지 확인합니다.
    const isTutorialDone = localStorage.getItem(TUTORIAL_KEY_DASHBOARD) === 'true';

    if (activeTab === 'dashboard' && !isTutorialDone) {
      timer = setTimeout(() => setActiveTutorial('dashboard'), 400);
    } else {
      setActiveTutorial(null);
    }
    return () => clearTimeout(timer);
  }, [activeTab, loading]);

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
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              <div className="flex items-start justify-between">
                <div data-tour="welcome-msg" className="p-2 -m-2 rounded-xl">
                  <p className="text-sm text-gray-400 mb-1">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
                  <h1 className="text-3xl font-bold text-[#1a2332]">안녕하세요, <span className="text-blue-500">{userName}</span>님 👋</h1>
                  <p className="text-gray-500 mt-1 text-sm">{isMentor ? '호스트와 게스트 양쪽 활동을 한눈에 확인하세요.' : '오늘도 좋은 티타임이 기다리고 있어요.'}</p>
                </div>
                <button onClick={() => setActiveTutorial('dashboard')} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition shadow-sm">
                  <HelpCircle className="w-4 h-4" /> 가이드 보기
                </button>
              </div>

              <div data-tour="activity-sections" className="space-y-8 rounded-3xl p-2 -m-2">
                <div className="bg-gray-50/60 rounded-3xl p-6 border border-gray-100">
                  <MentorSection isMentor={isMentor} mentorStats={mentorStats} upcomingChats={upcomingChats} recentReviews={recentReviews} setActiveTab={setActiveTab} navigate={navigate} />
                </div>
                <div className="relative"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dashed border-gray-200" /></div></div>
                <div className="bg-gray-50/60 rounded-3xl p-6 border border-gray-100">
                  <MenteeSection menteeStats={menteeStats} upcomingBookings={upcomingBookings} mentorHistory={mentorHistory} setActiveTab={setActiveTab} navigate={navigate} />
                </div>
              </div>
            </div>
          )}
          {activeTab === 'schedule'  && <ScheduleManager />}
          {activeTab === 'history'   && <BookingHistory />}
          {activeTab === 'profile'   && <ProfileSetup />}
        </div>
      </main>

      {/* 🌟 수정 완료: onClose에 제대로된 함수 매핑 */}
      {activeTutorial === 'dashboard' && <TutorialOverlay steps={DASHBOARD_STEPS} tutorialKey={TUTORIAL_KEY_DASHBOARD} onClose={closeTutorial} />}
    </div>
  );
}