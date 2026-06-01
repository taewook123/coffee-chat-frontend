import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  User,
  Coffee,
  TrendingUp,
  DollarSign,
  Clock
} from 'lucide-react';

import ScheduleManager from './ScheduleManager';
import BookingHistory from './BookingHistory';
export default function MentorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const [mentorName, setMentorName] = useState(() => {
    return localStorage.getItem('userName') || '호스트';
  });
  const [upcomingChats, setUpcomingChats] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        let currentUserId = localStorage.getItem('userId') || 1;

        if (token) {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));

            if (payload.user_id) {
              currentUserId = payload.user_id;
            } else if (payload.id) {
              currentUserId = payload.id;
            }
          } catch (e) {
            console.log("토큰 디코딩 에러, 기본 ID 혹은 스토리지 ID 사용");
          }
        }
            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

            // 2. axios 요청에서 하드코딩된 주소를 BACKEND_URL 변수로 교체
            const response = await axios.get(`${BACKEND_URL}/api/mentor/dashboard/${currentUserId}`);
        const { stats: backendStats, upcoming_chats } = response.data;

        if (backendStats && backendStats.name) {
          setMentorName(backendStats.name);
          localStorage.setItem('userName', backendStats.name);
        }

        const formattedStats = [
          { label: '총 채팅 수', value: String(backendStats.total_chats), icon: MessageSquare, color: 'bg-blue-500' },
          { label: '총 수익', value: `$${backendStats.total_earnings.toLocaleString()}`, icon: DollarSign, color: 'bg-green-500' },
          { label: '평균 평점', value: String(backendStats.average_rating), icon: TrendingUp, color: 'bg-purple-500' },
          { label: '티타임 시간', value: String(backendStats.mentoring_hours), icon: Clock, color: 'bg-orange-500' }
        ];
        setStats(formattedStats);
        setUpcomingChats(upcoming_chats);

      } catch (error) {
        console.error("❌ 대시보드 실시간 연동 실패:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // 대시보드 메인 화면을 별도의 변수로 분리
  const renderDashboard = () => (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a2332] mb-2">
          다시 오셨군요, {mentorName}님! 👋
        </h1>
        <p className="text-gray-600">멘토링 세션 현황을 확인해보세요</p>
      </div>

      {/* 통계 카드 리스트 */}
      <div className="grid grid-cols-4 gap-6 mb-8 w-full min-w-[800px]">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-[#1a2332] mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* 예정된 티타임 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-[#1a2332] mb-4">예정된 티타임</h2>
        {upcomingChats.length === 0 ? (
          <p className="text-gray-500 text-sm">예정된 티타임이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
            {upcomingChats.map((chat, idx) => (
              <li key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="font-medium text-[#1a2332]">{chat.mentee_name}</p>
                  <p className="text-sm text-gray-500">{chat.scheduled_time}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-medium">
                  {chat.status || '예정'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-semibold animate-pulse">
        ☕ 티타임 실시간 통계 정보를 로드하고 있습니다...
      </div>
    );
  }

  return (
    <div className="w-full flex min-h-screen bg-gray-50 text-gray-900">

      {/* 사이드바 영역 */}
      <aside className="w-64 bg-[#1a2332] text-white flex-shrink-0 relative z-10">
        <div className="p-6 sticky top-0">
          
          <nav className="space-y-2">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-left ${
                activeTab === 'dashboard' ? 'bg-[#4a90e2] text-white' : 'hover:bg-[#2a3342] text-gray-300'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              대시보드
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-left ${
                activeTab === 'schedule' ? 'bg-[#4a90e2] text-white' : 'hover:bg-[#2a3342] text-gray-300'
              }`}
            >
              <Calendar className="w-5 h-5" />
              일정 관리
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')} 
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-left ${
                activeTab === 'history' ? 'bg-[#4a90e2] text-white' : 'hover:bg-[#2a3342] text-gray-300'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              예약 내역
            </button>
            <button
              type="button"
              onClick={() => {
                const token = localStorage.getItem('token');
                let uid = 1;
                if (token) {
                  try {
                    uid = JSON.parse(atob(token.split('.')[1])).user_id || 1;
                  } catch(e){}
                }
                navigate(`/profile-setup?id=${uid}`);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-left hover:bg-[#2a3342] text-gray-300"
            >
              <User className="w-5 h-5" />
              프로필 설정
            </button>
          </nav>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 min-w-0 p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'schedule' && <ScheduleManager />}
          {activeTab === 'history' && <BookingHistory />}
          
        </div>
      </main>
    </div>
  );
}