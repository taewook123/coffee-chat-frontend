import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  User,
  TrendingUp,
  DollarSign,
  Clock,
  Repeat
} from 'lucide-react';

import ScheduleManager from './ScheduleManager';
import BookingHistory from './BookingHistory';

export default function MentorDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const [mentorName, setMentorName] = useState(() => {
    return localStorage.getItem('userName') || '멘토';
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
            console.log('토큰 디코딩 오류, 기본 ID 또는 localStorage ID를 사용합니다.');
          }
        }

        const BACKEND_URL =
          import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

        const response = await axios.get(
          `${BACKEND_URL}/api/mentor/dashboard/${currentUserId}`
        );

        const {
          stats: backendStats = {},
          upcoming_chats = []
        } = response.data;

        if (backendStats.name) {
          setMentorName(backendStats.name);
          localStorage.setItem('userName', backendStats.name);
        }

        const formattedStats = [
          {
            label: '이번 달 수익',
            value: `$${Number(backendStats.monthly_earnings || 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'bg-green-500'
          },
          {
            label: '평균 평점',
            value: `${backendStats.average_rating || 0}`,
            icon: TrendingUp,
            color: 'bg-purple-500'
          },
          {
            label: '총 멘토링 시간',
            value: `${backendStats.mentoring_hours || 0}시간`,
            icon: Clock,
            color: 'bg-orange-500'
          },
          {
            label: '재예약률',
            value: `${backendStats.rebooking_rate || 0}%`,
            icon: Repeat,
            color: 'bg-blue-500'
          }
        ];

        setStats(formattedStats);
        setUpcomingChats(upcoming_chats);
      } catch (error) {
        console.error('멘토 대시보드 데이터 연동 실패:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const renderDashboard = () => (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1a2332] mb-2">
          다시 오신 걸 환영해요, {mentorName}님
        </h1>
        <p className="text-gray-600">
          이번 달 멘토링 성과와 예정된 일정을 확인해보세요.
        </p>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-8 w-full min-w-[800px]">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
            >
              <div
                className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-4`}
              >
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-bold text-[#1a2332] mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[#1a2332]">
            예정된 멘토링
          </h2>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            일정 관리
          </button>
        </div>

        {upcomingChats.length === 0 ? (
          <p className="text-gray-500 text-sm">
            예정된 멘토링이 없습니다.
          </p>
        ) : (
          <ul className="space-y-3">
            {upcomingChats.map((chat, idx) => (
              <li
                key={chat.id || idx}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div>
                  <p className="font-medium text-[#1a2332]">
                    {chat.mentee_name || '멘티'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {chat.scheduled_time || '일정 미정'}
                  </p>
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
        멘토 대시보드 정보를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <div className="w-full flex min-h-screen bg-gray-50 text-gray-900">
      <aside className="w-64 bg-[#1a2332] text-white flex-shrink-0 relative z-10">
        <div className="p-6 sticky top-0">
          <nav className="space-y-2">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-left ${
                activeTab === 'dashboard'
                  ? 'bg-[#4a90e2] text-white'
                  : 'hover:bg-[#2a3342] text-gray-300'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              대시보드
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-left ${
                activeTab === 'schedule'
                  ? 'bg-[#4a90e2] text-white'
                  : 'hover:bg-[#2a3342] text-gray-300'
              }`}
            >
              <Calendar className="w-5 h-5" />
              일정 관리
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition text-left ${
                activeTab === 'history'
                  ? 'bg-[#4a90e2] text-white'
                  : 'hover:bg-[#2a3342] text-gray-300'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              예약 내역
            </button>

            <button
              type="button"
              onClick={() => {
                const token = localStorage.getItem('token');
                let uid = localStorage.getItem('userId') || 1;

                if (token) {
                  try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    uid = payload.user_id || payload.id || uid;
                  } catch (e) {
                    console.log('토큰 디코딩 오류');
                  }
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