import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coffee, Calendar, Clock, ChevronLeft, ChevronRight, MessageSquare, Star, CheckCircle } from 'lucide-react';
import axios from 'axios';

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

export default function CoffeeChats() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [roleFilter, setRoleFilter] = useState('sent'); 
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  useEffect(() => {
    const currentUserId = getCleanUserId();
    if (!currentUserId) { setLoading(false); return; }

    const fetchBookings = async () => {
      try {
        let myMentorId = null;
        
        // 1. 내 멘토 ID 확보
        try {
          const mentorRes = await axios.get(`${BACKEND_URL}/api/mentors/list`);
          const myMentor = mentorRes.data.find(m => parseInt(m.user_id, 10) === currentUserId);
          if (myMentor) myMentorId = parseInt(myMentor.id, 10);
        } catch (err) {
          console.warn("멘토 정보 로드 패스", err);
        }

        // 2. 예약 데이터 가져오기
        const bookingRes = await axios.get(`${BACKEND_URL}/api/booking/${currentUserId}`);
        
        if (Array.isArray(bookingRes.data)) {
          const taggedBookings = bookingRes.data.map(booking => {
            const bUserId = parseInt(booking.user_id, 10);
            const bMentorId = parseInt(booking.mentor_id, 10);

            // 💡 승재 님 말씀대로 내 userid와 mentorid 기준으로 명확하게 분류!
            if (bUserId === currentUserId) {
              return { ...booking, type: 'sent' }; // 내가 보낸 신청
            } else if (myMentorId && bMentorId === myMentorId) {
              return { ...booking, type: 'received' }; // 내가 받은 신청
            }
            return { ...booking, type: 'sent' };
          });
          
          setBookings(taggedBookings);
        }
      } catch (err) {
        console.error("데이터 로드 실패", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // 💡 1차 필터링: 토글 버튼 기준 (보낸 신청 / 받은 신청)
  const filteredByRole = bookings.filter(b => b.type === roleFilter);

  // 💡 2차 필터링: 백엔드에서 넘겨준 b.tab_status 그대로 사용 (시간 계산 버그 완전 차단)
  const upcomingChats  = filteredByRole.filter(b => b.tab_status === 'upcoming');
  const ongoingChats   = filteredByRole.filter(b => b.tab_status === 'ongoing');
  const completedChats = filteredByRole.filter(b => b.tab_status === 'completed');

  // 빨간 뱃지 계산 (종료된 건 제외한 보낸/받은 신청 개수)
  const activeSentCount = bookings.filter(b => b.type === 'sent' && b.tab_status !== 'completed').length;
  const activeReceivedCount = bookings.filter(b => b.type === 'received' && b.tab_status !== 'completed').length;

  const getDDay = (dateString) => {
    if (!dateString) return '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'D-Day';
    if (diffDays < 0) return `종료`;
    return `D-${diffDays}`;
  };

  const renderChatCard = (chat) => {
    const isSent = chat.type === 'sent';
    
    // 💡 백엔드에서 partner_name을 전부 mentor_name 키에 담아주므로 깔끔하게 매핑 완료!
    const partnerName = chat.mentor_name || (isSent ? '멘토' : '멘티');
    const chatId = chat.id;
    const hasReview = chat.has_review;

    return (
      <div key={chatId} className={`bg-white rounded-2xl p-6 border shadow-sm flex flex-col justify-between min-h-[220px] transition-all hover:shadow-md hover:-translate-y-1 ${isSent ? 'border-blue-100 hover:shadow-blue-100/50' : 'border-orange-100 hover:shadow-orange-100/50'}`}>
        <div>
          <div className="flex items-start justify-between mb-4">
            <div className="flex flex-col gap-2">
              <span className={`w-fit px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide ${isSent ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                {isSent ? '내가 신청한 커피챗' : '내가 받은 커피챗'}
              </span>
              <h3 className="font-bold text-lg text-gray-900 m-0">
                {partnerName} {isSent ? '멘토' : '님'}
              </h3>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <span className={`text-xs font-black ${chat.tab_status === 'completed' ? 'text-gray-400' : 'text-red-500'}`}>
                {getDDay(chat.booking_date)}
              </span>
            </div>
          </div>
          
          <div className={`p-4 rounded-xl border mb-2 relative ${hasReview ? 'bg-purple-50/30 border-purple-100' : 'bg-slate-50 border-slate-100'}`}>
            <MessageSquare className="w-4 h-4 text-gray-300 absolute top-4 right-4" />
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 m-0 font-medium pr-6">
              {chat.questions || "작성된 사전 질문이 없습니다."}
            </p>
          </div>
        </div>
        
        <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between">
            <div className="flex flex-col gap-1 text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>{chat.booking_date}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{chat.booking_time} (30분)</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {chat.tab_status === 'ongoing' && (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/coffee-chat/${chatId}`); }}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  <Coffee className="w-3.5 h-3.5" /> 입장하기
                </button>
              )}
              {chat.tab_status === 'upcoming' && (
                <button 
                  onClick={() => navigate(isSent ? `/coffee-chat-detail/${chatId}` : `/booking-history`)}
                  className={`text-xs font-bold px-4 py-2 rounded-xl transition-colors ${isSent ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
                >
                  상세보기
                </button>
              )}
              {chat.tab_status === 'completed' && hasReview && (
                <button onClick={() => navigate(`/coffee-chat-report/${chatId}`)} className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" /> 리포트
                </button>
              )}
              {chat.tab_status === 'completed' && !hasReview && (
                <button onClick={() => navigate(`/coffee-chat-review/${chatId}`)} className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" /> 리뷰 쓰기
                </button>
              )}
            </div>
        </div>
      </div>
    );
  };

  const currentTabChats = activeTab === 'upcoming' ? upcomingChats : activeTab === 'ongoing' ? ongoingChats : completedChats;

  return (
    <div className="min-h-screen bg-[#fdfdfd]">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition no-underline font-medium text-sm">
            <ChevronLeft className="w-4 h-4" /> 대시보드로 돌아가기
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 m-0 mb-2">티타임 관리</h1>
            <p className="text-sm text-gray-500 m-0">신청한 커피챗 일정을 한눈에 확인하고 관리하세요.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 font-medium">일정을 불러오는 중입니다...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-200 pb-4">
              
              <div className="flex flex-wrap gap-2">
                {['upcoming', 'ongoing', 'completed'].map(tab => (
                   <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`px-5 py-2.5 font-bold rounded-xl text-sm transition-all duration-200 flex items-center gap-2 ${
                     activeTab === tab ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                   }`}
                 >
                   {tab === 'upcoming' ? '예정' : tab === 'ongoing' ? '진행중' : '종료'} 
                   <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {tab === 'upcoming' ? upcomingChats.length : tab === 'ongoing' ? ongoingChats.length : completedChats.length}
                   </span>
                 </button>
                ))}
              </div>

              <div className="bg-gray-100/80 p-1 rounded-xl flex items-center self-start md:self-auto border border-gray-200/60">
                <button
                  onClick={() => setRoleFilter('sent')}
                  className={`relative px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                    roleFilter === 'sent' 
                      ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  보낸 신청
                  {activeSentCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm ring-1 ring-white">
                      {activeSentCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setRoleFilter('received')}
                  className={`relative px-5 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                    roleFilter === 'received' 
                      ? 'bg-white text-orange-600 shadow-sm border border-gray-200/50' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  받은 신청
                  {activeReceivedCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-sm ring-1 ring-white">
                      {activeReceivedCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {currentTabChats.length === 0 ? (
               <div className="py-24 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center">
                 <Coffee className="w-10 h-10 text-gray-300 mb-3" />
                 <p className="text-gray-500 font-medium text-sm">해당하는 티타임 내역이 없습니다.</p>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentTabChats.map(renderChatCard)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}