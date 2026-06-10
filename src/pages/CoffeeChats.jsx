import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coffee, Calendar, Clock, ChevronLeft, ChevronRight, MessageSquare, Star, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function CoffeeChats() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  // 💡 백엔드 계산을 무시하고, 프론트엔드(브라우저) 시간 기준으로 완벽하게 판별하는 함수!
  const getTabStatus = (booking) => {
    if (!booking.booking_date || !booking.booking_time) return 'upcoming';

    // PAID = 멘토 수락 전 -> 대기 상태 혹은 내부 로직에 맞춤 (여기서는 일단 'waiting' 반환)
    //if (booking.status === 'PAID') return 'waiting';
    
    const now = new Date();
    const [year, month, day] = booking.booking_date.split('-');
    const [hour, minute] = booking.booking_time.split(':');
    const dt = new Date(year, month - 1, day, hour, minute);
    
    if (booking.status === 'COMPLETED' || booking.status === 'REVIEWED') return 'completed';

    const diffMin = (dt - now) / 1000 / 60;

    if (diffMin > 5) return 'upcoming';
    if (diffMin <= 5 && diffMin >= -30) return 'ongoing';
    return 'completed';
  };

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) { setLoading(false); return; }
    
    axios.get(`${BACKEND_URL}/api/booking/${userId}`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setBookings(res.data);
        } else {
          setBookings([]);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // 🚨 b.tab_status 대신 getTabStatus(b) 함수를 호출해서 정확하게 분류합니다!
  const upcomingChats  = bookings.filter(b => getTabStatus(b) === 'upcoming');
  const ongoingChats   = bookings.filter(b => getTabStatus(b) === 'ongoing');
  const completedChats = bookings.filter(b => getTabStatus(b) === 'completed');

  const handleJoinChat = (e, chatId) => {
    e.stopPropagation();
    navigate(`/coffee-chat/${chatId}`);
  };

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

  const renderChatCard = (chat) => {
    const mentorName    = chat.mentor_name || chat.partner_name || '알 수 없는 멘토';
    
    // 🚨 여기서도 chat.tab_status 대신 getTabStatus(chat)를 호출합니다!
    const currentStatus = getTabStatus(chat);
    
    const hasReview     = chat.has_review;
    const chatId        = chat.id || chat.booking_id;

    return (
      <div
        key={chatId}
        onClick={() => {
          if (currentStatus === 'upcoming') navigate(`/coffee-chat-detail/${chatId}`);
          if (currentStatus === 'ongoing')  navigate(`/coffee-chat/${chatId}`);
          if (currentStatus === 'completed') {
            if (hasReview) {
              navigate(`/coffee-chat-report/${chatId}`);
            } else {
              navigate(`/coffee-chat-review/${chatId}`);
            }
          }
        }}
        className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm transition-all duration-300 flex flex-col justify-between min-h-[280px] group cursor-pointer hover:shadow-lg hover:-translate-y-1"
      >
        <div>
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner shrink-0">
                {mentorName.slice(0, 1)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 m-0">
                  {mentorName} 멘토
                </h3>
                <div className="mt-1 flex items-center gap-1.5">
                  {currentStatus === 'upcoming' && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">예정</span>}
                  {currentStatus === 'ongoing' && <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-[10px] font-bold animate-pulse">진행중</span>}
                  
                  {currentStatus === 'completed' && !hasReview && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold">종료 (리뷰 미작성)</span>
                  )}
                  {currentStatus === 'completed' && hasReview && (
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-[10px] font-bold">리뷰 작성 완료</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <span className={`text-xs font-black ${currentStatus === 'completed' ? 'text-gray-400' : 'text-red-500'}`}>
                {getDDay(chat.booking_date)}
              </span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border mb-5 relative transition-colors ${
            hasReview ? 'bg-purple-50/30 border-purple-100/50' : 'bg-slate-50 border-slate-100 group-hover:bg-blue-50/30'
          }`}>
            <MessageSquare className="w-4 h-4 text-gray-300 absolute top-4 right-4" />
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 m-0 font-medium pr-6">
              {chat.questions || "작성된 사전 질문이 없습니다."}
            </p>
          </div>
        </div>

        <div>
          {currentStatus === 'ongoing' && (
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
            
            {currentStatus === 'ongoing' && (
              <button
                onClick={(e) => handleJoinChat(e, chatId)}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md"
              >
                <Coffee className="w-3.5 h-3.5" /> 입장하기
              </button>
            )}

            {currentStatus === 'upcoming' && (
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors text-gray-400">
                <ChevronRight className="w-4 h-4" />
              </div>
            )}

            {currentStatus === 'completed' && (
              hasReview ? (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/coffee-chat-report/${chatId}`); }}
                  className="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> 리포트 보기
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/coffee-chat-review/${chatId}`); }}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  <Star className="w-3.5 h-3.5" /> 리뷰 쓰기
                </button>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fdfdfd]">
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

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 font-medium">일정을 불러오는 중입니다...</p>
          </div>
        )}

        {!loading && (
          <>
            <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-4">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-2.5 font-bold rounded-xl text-sm transition-all duration-200 ${
                  activeTab === 'upcoming' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                예정 <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'upcoming' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{upcomingChats.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('ongoing')}
                className={`px-6 py-2.5 font-bold rounded-xl text-sm transition-all duration-200 ${
                  activeTab === 'ongoing' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                진행중 <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'ongoing' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{ongoingChats.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-2.5 font-bold rounded-xl text-sm transition-all duration-200 ${
                  activeTab === 'completed' ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                종료 <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'completed' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{completedChats.length}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTab === 'upcoming' && upcomingChats.map(renderChatCard)}
              {activeTab === 'upcoming' && upcomingChats.length === 0 && (
                <div className="col-span-full py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                  <p className="text-gray-500 font-medium">예정된 티타임이 없습니다.</p>
                </div>
              )}
              
              {activeTab === 'ongoing' && ongoingChats.map(renderChatCard)}
              {activeTab === 'ongoing' && ongoingChats.length === 0 && (
                <div className="col-span-full py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                  <p className="text-gray-500 font-medium">현재 진행중인 티타임이 없습니다.</p>
                </div>
              )}
              
              {activeTab === 'completed' && completedChats.map(renderChatCard)}
              {activeTab === 'completed' && completedChats.length === 0 && (
                <div className="col-span-full py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
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