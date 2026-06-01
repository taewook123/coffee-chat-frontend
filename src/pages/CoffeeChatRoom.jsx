import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, Phone, MessageSquare, Settings } from 'lucide-react';
import axios from 'axios';

export default function CoffeeChatRoom() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // [추가] DB 연동 state
  const [booking, setBooking] = useState(null);
  const [session, setSession] = useState(null);
  const [myName, setMyName] = useState('나');
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  // [추가] 예약 정보 + 세션 정보 가져오기
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName') || '나';
    setMyName(userName);

    if (!userId) return;

    // 예약 정보 가져오기
    axios.get(`${BACKEND_URL}/api/bookings/${userId}`)
      .then(res => {
        const found = res.data.find(b => String(b.id) === String(chatId));
        if (found) setBooking(found);
      })
      .catch(err => console.error(err));

    // 세션 정보 가져오기
    axios.get(`${BACKEND_URL}/api/chat-session/${chatId}`)
      .then(res => {
        setSession(res.data);
      })
      .catch(err => console.error(err));
  }, [chatId]);

  // 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // [수정] 종료 버튼 - 세션 종료 API 호출
  const handleEndCall = async () => {
    try {
      if (session && session.session_id) {
        await axios.post(`${BACKEND_URL}/api/chat-session/end/${session.session_id}`);
      }
    } catch (err) {
      console.error('세션 종료 실패:', err);
    }
    navigate(`/coffee-chat-review/${chatId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-700 via-orange-600 to-orange-800 flex flex-col">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="font-bold text-orange-600 text-sm">
                {booking?.mentor_name?.slice(0, 2) || '멘토'}
              </span>
            </div>
            <div className="text-white">
              {/* [수정] DB에서 가져온 멘토 이름 */}
              <h2 className="font-bold">
                {booking?.mentor_name || '멘토'}
              </h2>
              <p className="text-sm text-white/80">커피챗 진행중</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
              <span className="text-white font-mono font-bold">{formatDuration(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-xl grid grid-cols-2 gap-6">
          {/* 멘티 카드 */}
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl h-32 flex flex-row items-center justify-start p-5 gap-5 border-4 border-white/20 relative">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0">
              {/* [수정] 내 이름 첫 글자 */}
              {myName.slice(0, 1)}
            </div>
            <div className="flex flex-col justify-center text-left">
              {/* [수정] 내 이름 */}
              <p className="text-white font-semibold text-lg mb-0.5">{myName} (나)</p>
              <p className="text-white/70 text-xs">게스트</p>
            </div>
          </div>

          {/* 멘토 카드 */}
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl h-32 flex flex-row items-center justify-start p-5 gap-5 border-4 border-yellow-400 relative overflow-hidden">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0">
              {/* [수정] 멘토 이름 첫 글자 */}
              {booking?.mentor_name?.slice(0, 1) || '멘'}
            </div>
            <div className="flex flex-col justify-center text-left">
              {/* [수정] 멘토 이름 */}
              <p className="text-white font-semibold text-lg mb-0.5">
                {booking?.mentor_name || '멘토'} (호스트)
              </p>
              <p className="text-white/70 text-xs">호스트</p>
            </div>
          </div>
        </div>
      </div>

      {/* Question Section */}
      <div className="max-w-6xl mx-auto w-full px-8 mb-6 grid grid-cols-2 gap-6">
        {/* 추천 질문 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
          <h3 className="font-bold text-gray-900 mb-3">추천 질문</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-500 text-sm">AI 추천 질문이 여기에 표시돼요</p>
          </div>
        </div>

        {/* [수정] 질문지 - DB에서 가져온 질문 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
          <h3 className="font-bold text-gray-900 mb-3">질문지</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {booking?.questions || '작성된 질문이 없어요'}
            </p>
          </div>
        </div>
      </div>

      {/* 실시간 대화 내역 */}
      <div className="max-w-6xl mx-auto w-full px-8 mb-6">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl">
          <h3 className="font-bold text-gray-900 mb-3">실시간 대화 내역</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-500 text-sm">STT 대화 내역이 여기에 표시돼요</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black/30 backdrop-blur-sm px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
              isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
          </button>

          <button
            type="button"
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
              isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
          </button>

          {/* [수정] 종료 버튼 - 세션 종료 API 호출 */}
          <button
            type="button"
            onClick={handleEndCall}
            className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-full flex items-center justify-center transition shadow-lg"
          >
            <Phone className="w-7 h-7 text-white rotate-[135deg]" />
          </button>

          <button
            type="button"
            onClick={() => setShowChat(!showChat)}
            className="w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition"
          >
            <MessageSquare className="w-6 h-6 text-white" />
          </button>

          <button
            type="button"
            className="w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition"
          >
            <Settings className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}