import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Coffee, Calendar, Clock, ChevronLeft } from 'lucide-react';
import axios from 'axios';

export default function CoffeeChats() {
  const [activeTab, setActiveTab] = useState('upcoming');
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = 'http://localhost:8000';

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setLoading(false);
      return;
    }

    axios.get(`${BACKEND_URL}/api/bookings/${userId}`)
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

  // tab_status 기준으로 분류
  const upcomingChats = bookings.filter(b => b.tab_status === 'upcoming');
  const ongoingChats = bookings.filter(b => b.tab_status === 'ongoing');
  const completedChats = bookings.filter(b => b.tab_status === 'completed');

  const handleJoinChat = (chatId) => {
    navigate(`/coffee-chat/${chatId}`);
  };

  // 기존 handleJoinChat 함수 아래의 renderChatCard를 이 코드로 교체하세요!
  const renderChatCard = (chat) => (
    <div
      key={chat.id}
      className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* 동그란 아바타 영역 */}
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {chat.mentor_name ? chat.mentor_name.slice(0, 1) : '#'}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">
              {chat.mentor_name ? `${chat.mentor_name} 멘토` : `멘토 #${chat.mentor_id}`}
            </h3>
            <p className="text-sm text-gray-600">
              {chat.questions?.slice(0, 50)}...
            </p>
          </div>
        </div>

        {/* 상태 뱃지 */}
        {chat.tab_status === 'upcoming' && (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
            예정
          </span>
        )}
        {chat.tab_status === 'ongoing' && (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
            진행중
          </span>
        )}
        {chat.tab_status === 'completed' && (
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
      {chat.tab_status === 'ongoing' && (
        <div className="mb-4 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700 font-medium">
            🟢 지금 입장 가능해요!
          </p>
        </div>
      )}

      {/* 🔴 버튼 구역 (onClick 이벤트 추가된 부분) */}
      <div className="flex gap-3">
        {chat.tab_status === 'upcoming' && (
          <button 
            onClick={() => navigate(`/coffee-chat-detail/${chat.id}`)} // 👈 클릭 시 이동하도록 추가
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition"
          >
            세부사항 보기
          </button>
        )}
        {chat.tab_status === 'ongoing' && (
          <button
            onClick={() => handleJoinChat(chat.id)}
            className="flex-1 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            <Coffee className="w-5 h-5" />
            티타임 입장
          </button>
        )}
        {chat.tab_status === 'completed' && (
          <button 
            onClick={() => navigate(`/coffee-chat-review/${chat.id}`)}
            className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            세부사항 보기
          </button>
)}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            대시보드로 돌아가기
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          티타임 관리
        </h1>

        {/* 로딩 중 */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 animate-pulse">불러오는 중...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* 탭 버튼 */}
            <div className="flex gap-2 mb-8">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-8 py-3 font-semibold rounded-lg transition ${
                  activeTab === 'upcoming'
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                예정 ({upcomingChats.length})
              </button>
              <button
                onClick={() => setActiveTab('ongoing')}
                className={`px-8 py-3 font-semibold rounded-lg transition ${
                  activeTab === 'ongoing'
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                진행중 ({ongoingChats.length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-8 py-3 font-semibold rounded-lg transition ${
                  activeTab === 'completed'
                    ? 'bg-black text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                종료 ({completedChats.length})
              </button>
            </div>

            {/* 카드 목록 */}
            <div className="grid gap-6">
              {activeTab === 'upcoming' && (
                upcomingChats.length > 0
                  ? upcomingChats.map(renderChatCard)
                  : <p className="text-center text-gray-500 py-12">
                      예정된 티타임이 없어요
                    </p>
              )}
              {activeTab === 'ongoing' && (
                ongoingChats.length > 0
                  ? ongoingChats.map(renderChatCard)
                  : <p className="text-center text-gray-500 py-12">
                      진행중인 티타임이 없어요
                    </p>
              )}
              {activeTab === 'completed' && (
                completedChats.length > 0
                  ? completedChats.map(renderChatCard)
                  : <p className="text-center text-gray-500 py-12">
                      종료된 티타임이 없어요
                    </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}