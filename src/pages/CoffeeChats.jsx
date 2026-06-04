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

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setLoading(false);
      return;
    }

    axios.get(`${BACKEND_URL}/api/booking/mentee/${userId}`)
      .then(res => {
        setBookings(res.data);
      })
      .catch(err => {
        console.error('예약 목록 조회 실패:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // [수정] 날짜/시간 기준으로 직접 분류
  const getTabStatus = (booking) => {
    const now = new Date();
    const dt = new Date(`${booking.booking_date}T${booking.booking_time}`);
    const diffMin = (dt - now) / 1000 / 60;

    if (diffMin > 5) return 'upcoming';
    if (diffMin <= 5 && diffMin >= -30) return 'ongoing';
    return 'completed';
  };

  const upcomingChats = bookings.filter(b => getTabStatus(b) === 'upcoming');
  const ongoingChats = bookings.filter(b => getTabStatus(b) === 'ongoing');
  const completedChats = bookings.filter(b => getTabStatus(b) === 'completed');

  const renderChatCard = (chat) => {
    const tabStatus = getTabStatus(chat);
    return (
      <div
        key={chat.booking_id}
        className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* 아바타 */}
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden">
              {chat.partner_image
                ? <img src={chat.partner_image} alt={chat.partner_name} className="w-full h-full object-cover" />
                : chat.partner_name?.slice(0, 1) || '#'
              }
            </div>
            <div>
              {/* [수정] partner_name 사용 */}
              <h3 className="font-bold text-gray-900 text-lg">
                {chat.partner_name ? `${chat.partner_name} 멘토` : '멘토'}
              </h3>
              <p className="text-sm text-gray-600">
                {chat.questions?.slice(0, 50)}...
              </p>
            </div>
          </div>

          {/* 상태 뱃지 */}
          {tabStatus === 'upcoming' && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
              예정
            </span>
          )}
          {tabStatus === 'ongoing' && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              진행중
            </span>
          )}
          {tabStatus === 'completed' && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
              종료
            </span>
          )}
        </div>

        {/* 날짜 시간 */}
        <div className="flex items-center gap-6 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{chat.booking_date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{chat.booking_time}</span>
          </div>
        </div>

        {/* 진행중 안내 */}
        {tabStatus === 'ongoing' && (
          <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">
              🟢 지금 입장 가능해요!
            </p>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          {tabStatus === 'upcoming' && (
            <button
              onClick={() => navigate(`/coffee-chat-detail/${chat.booking_id}`)}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition"
            >
              세부사항 보기
            </button>
          )}
          {tabStatus === 'ongoing' && (
            <button
              onClick={() => navigate(`/coffee-chat/${chat.booking_id}`)}
              className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <Coffee className="w-5 h-5" />
              티타임 입장
            </button>
          )}
          {tabStatus === 'completed' && (
            <button
              onClick={() => navigate(`/coffee-chat-review/${chat.booking_id}`)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              세부사항 보기
            </button>
          )}
        </div>
      </div>
    );
  };

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
                  : <p className="text-center text-gray-500 py-12">예정된 티타임이 없어요</p>
              )}
              {activeTab === 'ongoing' && (
                ongoingChats.length > 0
                  ? ongoingChats.map(renderChatCard)
                  : <p className="text-center text-gray-500 py-12">진행중인 티타임이 없어요</p>
              )}
              {activeTab === 'completed' && (
                completedChats.length > 0
                  ? completedChats.map(renderChatCard)
                  : <p className="text-center text-gray-500 py-12">종료된 티타임이 없어요</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}