import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard, Calendar, MessageSquare, User,
  TrendingUp, DollarSign, Clock, Repeat, Star,
  BookOpen, Award, ChevronRight, Coffee, Users,
  Heart, ArrowUpRight, Sparkles, Bell, Hourglass // 💡 Hourglass(모래시계) 아이콘 추가
} from 'lucide-react';
import ScheduleManager from './ScheduleManager';
import BookingHistory from './BookingHistory';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

// ── 공통 헬퍼 ──────────────────────────────────────────────────────
function getCleanUserId() {
  let finalUserId = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('user_id');
  
  if (!finalUserId || finalUserId === 'null' || finalUserId === 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        finalUserId = payload.user_id || payload.id;
        if (finalUserId) localStorage.setItem('userId', finalUserId);
      } catch (e) {
        console.error('토큰 디코딩 실패:', e);
      }
    }
  }
  return finalUserId ? parseInt(String(finalUserId).replace(/[^0-9]/g, ''), 10) : null;
}

// ── 서브 컴포넌트 ────────────────────────────────────────────────────
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
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating}</span>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);

  const [userName, setUserName] = useState(localStorage.getItem('userName') || '회원');

  const [isMentor, setIsMentor] = useState(false);
  const [mentorStats, setMentorStats] = useState(null);
  const [upcomingChats, setUpcomingChats] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);

  const [menteeStats, setMenteeStats] = useState(null);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [mentorHistory, setMentorHistory] = useState([]);

  useEffect(() => {
    if (location.state && location.state.activeTab) {
      setActiveTab(location.state.activeTab);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const uid = getCleanUserId();
    
    if (!uid) {
      alert("로그인 정보가 만료되었습니다.");
      navigate('/login');
      return;
    }

    async function load() {
      setLoading(true);
      try {
        // 0. 서버에서 내 진짜 유저 이름부터 받아와서 세팅
        try {
          const userRes = await axios.get(`${BACKEND_URL}/api/user/${uid}`);
          if (userRes.data && userRes.data.name) {
            setUserName(userRes.data.name);
            localStorage.setItem('userName', userRes.data.name);
          }
        } catch (e) {
          console.error("유저 이름 동기화 실패");
        }

        // 1. 멘토 권한 확인
        let checkIsMentor = false;
        try {
          const mentorsRes = await axios.get(`${BACKEND_URL}/api/mentors/list`);
          checkIsMentor = mentorsRes.data.some(m => parseInt(m.user_id, 10) === uid);
          setIsMentor(checkIsMentor);
        } catch (err) {
          console.error("멘토 검증 실패:", err);
        }

        // 2. 멘토 대시보드 로드
        if (checkIsMentor) {
          try {
            const { data } = await axios.get(`${BACKEND_URL}/api/mentor/dashboard/${uid}`);
            const s = data.stats || {};
            setMentorStats(s);
            setUpcomingChats(data.upcoming_chats || []);
            setRecentReviews(data.recent_reviews || []);
          } catch (err) {
            console.error("멘토 대시보드 데이터 로드 실패", err);
          }
        }

        // 3. 멘티 대시보드 로드
        try {
          const { data } = await axios.get(`${BACKEND_URL}/api/mentee/dashboard/${uid}`);
          const s = data.stats || {};
          setMenteeStats(s);
          setUpcomingBookings(data.upcoming_bookings || []);
          setMentorHistory(data.mentor_history || []);
        } catch (err) {
          console.error("멘티 대시보드 데이터 로드 실패", err);
          setMenteeStats(null);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [navigate]);

  // ── 멘토 섹션 ──────────────────────────────────────────────────────
  const renderMentorSection = () => {
    if (!isMentor) {
      return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">멘토 활동</span>
            </div>
            <h3 className="text-lg font-bold text-[#1a2332] mb-1">멘토로 활동해보세요</h3>
            <p className="text-sm text-gray-500">경험을 나누고 수익을 얻을 수 있어요. 지금 바로 시작해보세요.</p>
          </div>
          <button
            onClick={() => navigate('/profile-setup')}
            className="flex-shrink-0 ml-6 bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            시작하기 <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-5 bg-amber-400 rounded-full" />
          <h2 className="text-base font-bold text-[#1a2332]">멘토 활동</h2>
          <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-medium">활성</span>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-5">
          <StatCard icon={DollarSign} label="이번 달 수익" value={`₩${Number(mentorStats?.monthly_earnings||0).toLocaleString()}`} accent="bg-emerald-500" sub="↑ 지난달 대비" />
          <StatCard icon={Star}       label="평균 평점"    value={`${mentorStats?.average_rating||'—'}`}                            accent="bg-amber-400" />
          <StatCard icon={Clock}      label="총 멘토링"    value={`${mentorStats?.mentoring_hours||0}시간`}                         accent="bg-orange-400" />
          <StatCard icon={Repeat}     label="재예약률"     value={`${mentorStats?.rebooking_rate||0}%`}                             accent="bg-violet-500" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <SectionHeader title="예정된 멘토링" action="일정 관리" onAction={() => setActiveTab('schedule')} />
            {upcomingChats.length === 0
              ? <EmptyState icon={Calendar} message="예정된 멘토링이 없습니다." />
              : <ul className="space-y-2">
                  {upcomingChats.slice(0,4).map((c, i) => (
                    <li key={c.id||i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-[#1a2332]">{c.mentee_name||'멘티'}</p>
                        <p className="text-xs text-gray-400">{c.scheduled_time||'일정 미정'}</p>
                      </div>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">{c.status||'예정'}</span>
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
                  {recentReviews.slice(0,3).map((r, i) => (
                    <li key={i} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[#1a2332]">{r.mentee_name||'멘티'}</span>
                        <StarRating rating={r.rating||5} />
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{r.content||'리뷰 내용'}</p>
                    </li>
                  ))}
                </ul>
            }
          </div>
        </div>
      </div>
    );
  };

  // ── 멘티 섹션 ──────────────────────────────────────────────────────
  const renderMenteeSection = () => (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
        <h2 className="text-base font-bold text-[#1a2332]">멘티 활동</h2>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard icon={Coffee}        label="참여한 커피챗"    value={`${menteeStats?.total_chats||0}회`}         accent="bg-blue-500" />
        <StatCard icon={Clock}         label="총 학습 시간"     value={`${menteeStats?.learning_hours||0}시간`}    accent="bg-cyan-500" />
        
        {/* 💡 [수정] 만난 멘토 -> 수락 대기 (오렌지색 모래시계) */}
        <StatCard icon={Hourglass}     label="수락 대기"        value={`${menteeStats?.pending_requests||0}건`}    accent="bg-orange-400" />
        
        {/* 💡 [수정] 관심 멘토 -> 작성한 후기 (초록색 메시지창) */}
        <StatCard icon={MessageSquare} label="작성한 후기"      value={`${menteeStats?.written_reviews||0}개`}     accent="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHeader title="다가오는 예약" action="예약 내역" onAction={() => setActiveTab('history')} />
          {upcomingBookings.length === 0
            ? <EmptyState icon={Calendar} message="예정된 커피챗이 없어요." cta="멘토 찾기" onCta={() => navigate('/mentors')} />
            : <ul className="space-y-2">
                {upcomingBookings.slice(0,4).map((b, i) => (
                  <li key={b.id||i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-semibold text-[#1a2332]">{b.mentor_name||'멘토'}</p>
                      <p className="text-xs text-gray-400">{b.scheduled_time||'일정 미정'}</p>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-medium">{b.status||'예정'}</span>
                  </li>
                ))}
              </ul>
          }
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHeader title="최근 만난 멘토" />
          {mentorHistory.length === 0
            ? <EmptyState icon={BookOpen} message="아직 커피챗 기록이 없어요." cta="첫 커피챗 예약하기" onCta={() => navigate('/host-list')} />
            : <ul className="space-y-3">
                {mentorHistory.slice(0,4).map((m, i) => (
                  <li key={i} className="flex items-center gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(m.mentor_name||'M').slice(0,1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1a2332] truncate">{m.mentor_name||'멘토'}</p>
                      <p className="text-xs text-gray-400 truncate">{m.topic||m.date||'—'}</p>
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

  // ── 대시보드 전체 ──────────────────────────────────────────────────
  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">
            {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
          <h1 className="text-3xl font-bold text-[#1a2332]">
            안녕하세요, <span className="text-blue-500">{userName}</span>님 👋
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {isMentor
              ? '멘토와 멘티 양쪽 활동을 한눈에 확인하세요.'
              : '오늘도 좋은 커피챗이 기다리고 있어요.'}
          </p>
        </div>
        <button className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
          <Bell className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="bg-gray-50/60 rounded-3xl p-6 border border-gray-100">
        {renderMentorSection()}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dashed border-gray-200" />
        </div>
      </div>

      <div className="bg-gray-50/60 rounded-3xl p-6 border border-gray-100">
        {renderMenteeSection()}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">대시보드 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex min-h-screen bg-gray-50 text-gray-900">
      {/* ── 사이드바 ── */}
      <aside className="w-64 bg-[#1a2332] text-white flex-shrink-0">
        <div className="p-6 sticky top-0">
          <div className="flex items-center gap-3 mb-8 p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {userName.slice(0,1)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{userName}</p>
              <p className="text-xs text-gray-400">{isMentor ? '멘토 · 멘티' : '멘티'}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { key: 'dashboard', icon: LayoutDashboard, label: '대시보드' },
              { key: 'schedule',  icon: Calendar,        label: '일정 관리',  mentorOnly: true },
              { key: 'history',   icon: MessageSquare,   label: '예약 내역' },
            ].filter(item => !item.mentorOnly || isMentor).map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-left text-sm font-medium ${
                    activeTab === item.key
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}

            <div className="my-2 border-t border-white/10" />

            <button
              type="button"
              onClick={() => navigate(`/profile-setup?id=${getCleanUserId()}`)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-left text-sm font-medium hover:bg-white/5 text-gray-400 hover:text-white"
            >
              <User className="w-4 h-4" />
              프로필 설정
            </button>

            {!isMentor && (
              <button
                type="button"
                onClick={() => navigate('/profile-setup')}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-left text-sm font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20"
              >
                <Award className="w-4 h-4" />
                멘토 등록하기
              </button>
            )}
          </nav>
        </div>
      </aside>

      {/* ── 메인 ── */}
      <main className="flex-1 min-w-0 p-8 overflow-x-hidden overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'schedule' && <ScheduleManager />}
          {activeTab === 'history'  && <BookingHistory />}
        </div>
      </main>
    </div>
  );
}