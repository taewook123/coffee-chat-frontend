import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, ChevronLeft, Coffee } from 'lucide-react';
import axios from 'axios';

export default function CoffeeChatDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [session, setSession] = useState(null); // [추가]
  const [loading, setLoading] = useState(true);
  const [canEnter, setCanEnter] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    axios.get(`${BACKEND_URL}/api/booking/${userId}`)
      .then(res => {
        const found = res.data.find(b => String(b.id) === String(id));
        setBooking(found);

        if (found) {
          // 5분 전 입장 가능 여부 체크
          const bookingDateTime = new Date(
            `${found.booking_date}T${found.booking_time}`
          );
          const now = new Date();
          const diffMin = (bookingDateTime - now) / 1000 / 60;

        //   if (diffMin <= 5 && diffMin >= -30) {  //기존 ❌ 5분 전만 입장 가능
        //     setCanEnter(true);
        //   }
        
        setCanEnter(true); // 수정 ✅ 항상 입장 가능 (테스트용)

          // [추가] chat_session 조회
          axios.get(`${BACKEND_URL}/api/chat-session/${found.id}`)
            .then(sessionRes => {
              setSession(sessionRes.data);
            })
            .catch(err => console.error(err));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  // 1분마다 입장 가능 여부 체크
  useEffect(() => {
    const timer = setInterval(() => {
      if (booking) {
        const bookingDateTime = new Date(
          `${booking.booking_date}T${booking.booking_time}`
        );
        const now = new Date();
        const diffMin = (bookingDateTime - now) / 1000 / 60;
        setCanEnter(diffMin <= 5 && diffMin >= -30);
      }
    }, 60000);
    return () => clearInterval(timer);
  }, [booking]);

  // [추가] 입장 버튼 클릭시 세션 시작
  const handleEnter = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/chat-session/start`, null, {
        params: { booking_id: id }
      });
    } catch (err) {
      console.error('세션 시작 실패:', err);
    }
    navigate(`/coffee-chat/${id}`);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 animate-pulse">불러오는 중...</p>
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-red-500">예약 정보를 찾을 수 없어요</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate('/coffee-chats')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            티타임 목록으로
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-6">

        {/* 상태 뱃지 */}
        <div className="flex justify-center">
          {booking.tab_status === 'upcoming' && (
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
              📅 예정된 티타임
            </span>
          )}
          {booking.tab_status === 'ongoing' && (
            <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              🟢 진행중
            </span>
          )}
          {booking.tab_status === 'completed' && (
            <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">
              ✅ 종료된 티타임
            </span>
          )}
        </div>

        {/* [추가] 세션 상태 표시 */}
        {session && session.status === 'COMPLETED' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
            <p className="text-blue-700 font-semibold">
              ✅ 이미 진행된 티타임이에요
            </p>
            {session.duration_sec && (
              <p className="text-blue-500 text-sm mt-1">
                진행 시간: {Math.floor(session.duration_sec / 60)}분
              </p>
            )}
          </div>
        )}

        {/* 멘토/멘티 정보 */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6">참여자 정보</h2>
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                나
              </div>
              <p className="font-semibold text-gray-900">나 (멘티)</p>
            </div>

            <div className="flex flex-col items-center">
              <Coffee className="w-8 h-8 text-amber-500" />
              <p className="text-xs text-gray-400 mt-1">티타임</p>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {booking.mentor_name ? booking.mentor_name.slice(0, 1) : '#'}
              </div>
              <p className="font-semibold text-gray-900">
                {booking.mentor_name ? `${booking.mentor_name} 멘토` : `멘토 #${booking.mentor_id}`}
              </p>
            </div>
          </div>
        </div>

        {/* 날짜 시간 */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">예약 일정</h2>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span className="font-medium">{booking.booking_date}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="font-medium">{booking.booking_time}</span>
            </div>
          </div>
        </div>

        {/* 질문지 */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">📝 미리 작성한 질문지</h2>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {booking.questions || '작성된 질문이 없어요'}
            </p>
          </div>
        </div>

        {/* 입장 버튼 */}
        <div className="pt-4">
          {canEnter ? (
            <button
              onClick={handleEnter}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold text-lg transition shadow-lg flex items-center justify-center gap-2"
            >
              <Coffee className="w-6 h-6" />
              티타임 입장하기
            </button>
          ) : (
            <button
              disabled
              className="w-full py-4 bg-gray-200 text-gray-400 rounded-xl font-bold text-lg cursor-not-allowed"
            >
              {booking.tab_status === 'completed'
                ? '종료된 티타임이에요'
                : '입장 버튼은 5분 전에 활성화돼요'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}