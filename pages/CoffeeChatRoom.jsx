import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, Phone, MessageSquare, Settings, Flag } from 'lucide-react';

export default function CoffeeChatRoom() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 💡 TypeScript 타입(seconds: number)을 제거한 일반 JavaScript 함수
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    navigate(`/coffee-chat-review/${chatId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-700 via-orange-600 to-orange-800 flex flex-col">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="font-bold text-orange-600">용진</span>
            </div>
            <div className="text-white">
              <h2 className="font-bold">Yongjin</h2>
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
    {/* Mentee Video */}
    
    {/* 💡 호스트 카드와 똑같이 h-32, p-5로 여백과 높이를 꽉 줄였습니다 */}
    <div className="bg-black/40 backdrop-blur-sm rounded-2xl h-32 flex flex-row items-center justify-start p-5 gap-5 border-4 border-white/20 relative">
      
      {/* 💡 초상화 크기도 w-16 h-16으로 슬림하게 조정 */}
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0">
        JS
      </div>
      
      {/* 💡 이름과 신분 글씨 크기와 마진도 콤팩트하게 변경 */}
      <div className="flex flex-col justify-center text-left">
        <p className="text-white font-semibold text-lg mb-0.5">John Smith</p>
        <p className="text-white/70 text-xs">게스트</p>
      </div>

    </div>

          {/* Mentor Video (You) */}
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl h-32 flex flex-row items-center justify-start p-5 gap-5 border-4 border-yellow-400 relative overflow-hidden">
  {/* 💡 우측 상단 배지 (박스가 슬림해졌으므로 간격을 top-3, right-3으로 살짝 조정) */}
  <div>
  </div>

  {/* 💡 초상화 (왼쪽 고정, 박스 높이에 맞춰 w-16 h-16으로 최적화) */}
  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl shrink-0">
    SC
  </div>
  
  {/* 💡 이름과 신분 (초상화 오른쪽 배치, 왼쪽 정렬) */}
  <div className="flex flex-col justify-center text-left">
    <p className="text-white font-semibold text-lg mb-0.5">Sarah Chen (나)</p>
    <p className="text-white/70 text-xs">호스트</p>
  </div>
</div>
        </div>
      </div>

      {/* Question Section */}
      <div className="max-w-6xl mx-auto w-full px- mb-6 flex flex-col gap-6">
        {/* Question & Chat History Section */}
{/* 💡 grid grid-cols-2 gap-6를 주어 두 박스가 가로로 반씩 정확하게 나뉩니다. 비어있던 px- 속성도 px-8로 보정했습니다. */}
<div className="max-w-6xl mx-auto w-full px-8 mb-6 grid grid-cols-2 gap-6">
  
  {/* ◀ 왼쪽 박스: 추천 질문 */}
  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
    <div>
      <h3 className="font-bold text-gray-900 mb-3">추천 질문</h3>
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-gray-700 text-sm leading-relaxed">
          {/* 여기에 추천 질문 내용이나 상태(State)가 들어갑니다 */}
        </p>
      </div>
    </div>
  </div>
  
  {/* ▶ 오른쪽 박스: 실시간 대화 내역 */}
  <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
    <div>
      <h3 className="font-bold text-gray-900 mb-3">질문지</h3>
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-gray-700 text-sm leading-relaxed">
          {/* 여기에 실시간 대화 내역 텍스트나 채팅 리스트가 들어갑니다 */}
        </p>
      </div>
    </div>
  </div>


        </div>
        
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-2xl">
          <h3 className="font-bold text-gray-900 mb-3">실시간 대화 내역</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-gray-700 text-sm leading-relaxed">
              
            </p>
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
            {isMuted ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition ${
              isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            {isVideoOff ? (
              <VideoOff className="w-6 h-6 text-white" />
            ) : (
              <Video className="w-6 h-6 text-white" />
            )}
          </button>

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

          <button type="button" className="w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition">
            <Settings className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}