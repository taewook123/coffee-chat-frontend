import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coffee, Calendar, Clock, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import axios from 'axios';

export default function CoffeeChats() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  const getTabStatus = (booking) => {
  const now = new Date();
  const [year, month, day] = booking.booking_date.split('-');
  const [hour, minute] = booking.booking_time.split(':');
  const dt = new Date(year, month - 1, day, hour, minute);
  const diffMin = (dt - now) / 1000 / 60;
  if (diffMin > 5) return 'upcoming';
  if (diffMin <= 5 && diffMin >= -30) return 'ongoing';
  return 'completed';
};


  useEffect(() => {
  const userId = localStorage.getItem('userId');
  if (!userId) { setLoading(false); return; }
  axios.get(`${BACKEND_URL}/api/booking/mentee/${userId}`)
    .then(res => setBookings(res.data))
    .catch(err => console.error(err))
    .finally(() => setLoading(false));

}, []);

  // tab_status 기준으로 분류
  const upcomingChats = bookings.filter(b => getTabStatus(b) === 'upcoming');
  const ongoingChats = bookings.filter(b => getTabStatus(b) === 'ongoing');
  const completedChats = bookings.filter(b => getTabStatus(b) === 'completed');

  const handleJoinChat = (e, chatId) => {
    e.stopPropagation(); // 카드 클릭 이벤트 막기
    navigate(`/coffee-chat/${chatId}`);
  };


  // 💡 [추가됨] D-Day 자동 계산 함수
  const getDDay = (dateString) => {
    if (!dateString) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'D-Day';
    if (diffDays > 0) return `D-${diffDays}`;
    return `D+${Math.abs(diffDays)}`;
  };

  // 🚀 [디자인 대폭 수정됨] 세련된 카드 UI
  const renderChatCard = (chat) => (
    <div
      key={chat.booking_id}
      onClick={() => {
        if (getTabStatus(chat) === 'upcoming') navigate(`/coffee-chat-detail/${chat.booking_id}`);
        if (getTabStatus(chat) === 'completed') navigate(`/coffee-chat-review/${chat.booking_id}`);
      }}
      className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[280px] cursor-pointer group"
    >
      <div>
        {/* 상단: 프로필 & 뱃지 */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner">
              {chat.mentor_name ? chat.mentor_name.slice(0, 1) : '#'}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 m-0">
                {chat.mentor_name ? `${chat.mentor_name} 멘토` : `멘토 #${chat.mentor_id}`}
              </h3>
              {/* 진행 상태 뱃지 */}
              <div className="mt-1">
                {chat.tab_status === 'upcoming' && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">예정</span>}
                {chat.tab_status === 'ongoing' && <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-bold animate-pulse">진행중</span>}
                {chat.tab_status === 'completed' && <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">종료</span>}
              </div>
            </div>
          </div>
          
          {/* 디데이 뱃지 */}
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs font-black ${chat.tab_status === 'completed' ? 'text-gray-400' : 'text-red-500'}`}>
              {getDDay(chat.booking_date)}
            </span>
          </div>
        </div>

        {/* 중단: 작성한 사전 질문 (말풍선 스타일) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-5 relative group-hover:bg-blue-50/30 transition-colors">
          <MessageSquare className="w-4 h-4 text-gray-300 absolute top-4 right-4" />
          <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 m-0 font-medium pr-6">
            {chat.questions || "작성된 사전 질문이 없습니다."}
          </p>
        </div>
      </div>

      {/* 하단: 날짜/시간 및 액션 버튼 */}
      <div>
        {chat.tab_status === 'ongoing' && (
          <div className="mb-4">
            <p className="text-xs text-green-600 font-bold bg-green-50 px-3 py-2 rounded-lg text-center m-0 border border-green-100">
              🟢 지금 티타임 방에 입장해 주세요!
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex flex-col gap-1.5 text-xs text-gray-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{chat.booking_date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{chat.booking_time} (30분)</span>
            </div>
          </div>
          
          {/* 상태별 액션 버튼 처리 */}
          {chat.tab_status === 'ongoing' ? (
            <button
              onClick={(e) => handleJoinChat(e, chat.booking_id)}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md"
            >
              <Coffee className="w-3.5 h-3.5" /> 입장하기
            </button>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors text-gray-400">
              <ChevronRight className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fdfdfd]">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition no-underline font-medium text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            대시보드로 돌아가기
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 m-0 mb-2">
              티타임 관리
            </h1>
            <p className="text-sm text-gray-500 m-0">신청한 커피챗 일정을 한눈에 확인하고 관리하세요.</p>
          </div>
        </div>

        {/* 로딩 중 */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 font-medium">일정을 불러오는 중입니다...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* 탭 버튼 */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-2.5 font-bold rounded-xl text-sm transition-all duration-200 ${
                  activeTab === 'upcoming'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                예정 <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{upcomingChats.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('ongoing')}
                className={`px-6 py-2.5 font-bold rounded-xl text-sm transition-all duration-200 ${
                  activeTab === 'ongoing'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                진행중 <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'ongoing' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{ongoingChats.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-2.5 font-bold rounded-xl text-sm transition-all duration-200 ${
                  activeTab === 'completed'
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                종료 <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{completedChats.length}</span>
              </button>
            </div>

            {/* 🚀 카드 목록 (Grid 레이아웃 적용: 1열 -> 2열 -> 3열) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTab === 'upcoming' && (
                upcomingChats.length > 0
                  ? upcomingChats.map(renderChatCard)
                  : <div className="col-span-full py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                      <p className="text-gray-500 font-medium">예정된 티타임이 없습니다.</p>
                    </div>
              )}
              {activeTab === 'ongoing' && (
                ongoingChats.length > 0
                  ? ongoingChats.map(renderChatCard)
                  : <div className="col-span-full py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                      <p className="text-gray-500 font-medium">현재 진행중인 티타임이 없습니다.</p>
                    </div>
              )}
              {activeTab === 'completed' && (
                completedChats.length > 0
                  ? completedChats.map(renderChatCard)
                  : <div className="col-span-full py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                      <p className="text-gray-500 font-medium">종료된 티타임 기록이 없습니다.</p>
                    </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}