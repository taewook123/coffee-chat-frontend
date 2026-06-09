import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, 
  Settings, ChevronRight, Sparkles, Clock, Sun, Moon, Send, X, Volume2 
} from 'lucide-react';
import axios from 'axios';
import { useCoffeeChatWebRTC } from "../hooks/useCoffeeChatWebRTC"; 

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

function ControlBtn({ active, onClick, icon, danger = false, label }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 group">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-sm"
        style={{
          background: danger ? 'rgba(239,68,68,0.2)' : active ? 'var(--btn-active)' : 'var(--btn-bg)',
          border: danger ? '1px solid rgba(239,68,68,0.3)' : active ? '1px solid var(--btn-border-active)' : '1px solid var(--btn-border)',
          color: danger ? '#ef4444' : active ? 'var(--text-main)' : 'var(--text-muted)',
        }}
      >
        {icon}
      </div>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </button>
  );
}

export default function CoffeeChatRoom() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const [theme, setTheme] = useState('dark');
  const [showChat, setShowChat] = useState(false);
  const [isSTTExpanded, setIsSTTExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([{ sender: 'system', text: '채팅방이 개설되었습니다.' }]);
  const [llmInput, setLlmInput] = useState('');
  const [llmMessages, setLlmMessages] = useState([{ sender: 'ai', text: '무엇이든 물어보세요! 대화를 기반으로 조언해 드릴게요.' }]);
  
  const [booking, setBooking] = useState(null);
  const [session, setSession] = useState(null);
  const [myName, setMyName] = useState('나');
  const [userId, setUserId] = useState(null); 
  const [activeQuestion, setActiveQuestion] = useState(0);

  const chatScrollRef = useRef(null);
  const llmScrollRef = useRef(null);

  useEffect(() => {
    const id = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName') || '나';
    setMyName(userName);
    setUserId(id ? Number(id) : null); 
    if (!id) return;

    axios.get(`${BACKEND_URL}/api/booking/detail/${chatId}`)
      .then(res => {
        console.log("=== [☕ 디버깅] 백엔드 응답 Booking 데이터 원본 ===");
        console.log(res.data);
        setBooking(res.data); 
      }).catch(err => console.error('[예약 정보 로드 실패]', err));

    axios.get(`${BACKEND_URL}/api/chat-session/${chatId}`)
      .then(res => setSession(res.data))
      .catch(err => console.error('[세션 정보 로드 실패]', err));
  }, [chatId]);

  useEffect(() => {
    const timer = setInterval(() => setDuration((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatMessages]);
  useEffect(() => {
    if (llmScrollRef.current) llmScrollRef.current.scrollTop = llmScrollRef.current.scrollHeight;
  }, [llmMessages]);

  const isMentor = booking && userId 
    ? (Number(userId) === Number(booking.mentor_id) || Number(userId) === Number(booking.mentorId))
    : false;

  const opponentName = isMentor 
    ? (booking?.user_name || booking?.userName || '멘티 회원') 
    : (booking?.mentor_name || booking?.mentorName || '멘토 호스트');

  const {
    localVideoRef,
    remoteVideoRef,
    sttLogs,
    sendLLMQuestion,
    hangUp,
    llmStreaming,
    llmBuffer,
  } = useCoffeeChatWebRTC({
    chatId,
    userId,
    userName: myName,
    questions: booking?.questions,
  });

  useEffect(() => {
    if (!llmStreaming && llmBuffer) {
      setLlmMessages(prev => [...prev, { sender: 'ai', text: llmBuffer }]);
    }
  }, [llmStreaming]);

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    await hangUp();
    try {
      if (session?.session_id)
        await axios.post(`${BACKEND_URL}/api/chat-session/end/${session.session_id}`);
    } catch (err) {}
    navigate(`/coffee-chat-review/${chatId}`);
  };

  const handleSendMessage = (e, type) => {
    e.preventDefault();
    if (type === 'chat' && chatInput.trim()) {
      setChatMessages(prev => [...prev, { sender: 'me', text: chatInput }]);
      setChatInput('');
    }
  };

  const questions = booking?.questions
    ? booking.questions.split('\n').filter(q => q.trim()).map((q, i) => ({ text: q.replace(/^[-•]\s*/, '').trim(), tag: `질문 ${i + 1}` }))
    : [{ text: '작성된 질문이 없어요', tag: '질문' }];

  const recommendedQuestions = [
    '실무에서 가장 많이 쓰는 기술 스택은?',
    '신입 개발자로서 가장 중요하게 볼 역량은?',
    '코드 리뷰 시 가장 신경 쓰는 부분은?'
  ];

  const getInitials = (name) => name?.slice(0, 2) || '??';

  const themeStyles = theme === 'dark' ? {
    '--bg-gradient': 'linear-gradient(135deg, #0d1520 0%, #111d2e 50%, #0a1628 100%)',
    '--panel-bg': 'rgba(255,255,255,0.03)',
    '--panel-border': 'rgba(255,255,255,0.08)',
    '--text-main': '#ffffff',
    '--text-muted': 'rgba(255,255,255,0.5)',
    '--btn-bg': 'rgba(255,255,255,0.06)',
    '--btn-active': 'rgba(255,255,255,0.15)',
    '--btn-border': 'rgba(255,255,255,0.06)',
    '--btn-border-active': 'rgba(255,255,255,0.2)',
    '--chat-overlay': 'rgba(13,21,32,0.97)',
  } : {
    '--bg-gradient': 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
    '--panel-bg': 'rgba(255,255,255,0.8)',
    '--panel-border': 'rgba(0,0,0,0.1)',
    '--text-main': '#0f172a',
    '--text-muted': '#64748b',
    '--btn-bg': 'rgba(0,0,0,0.05)',
    '--btn-active': 'rgba(0,0,0,0.1)',
    '--btn-border': 'rgba(0,0,0,0.05)',
    '--btn-border-active': 'rgba(0,0,0,0.15)',
    '--chat-overlay': 'rgba(241,245,249,0.97)',
  };

  return (
    /* ─── 루트: 뷰포트 고정 ─── */
    <div
      className="h-screen flex flex-col overflow-hidden transition-colors duration-300"
      style={{ ...themeStyles, background: 'var(--bg-gradient)' }}
    >

      {/* ── 헤더 (flex-shrink-0) ── */}
      <header
        className="flex-shrink-0 relative z-10 flex items-center justify-between px-6 py-3"
        style={{ borderBottom: '1px solid var(--panel-border)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold tracking-wide" style={{ color: 'var(--text-main)' }}>Coffee Chat</span>
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-black/10 transition-colors"
            style={{ color: 'var(--text-main)' }}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          {booking && (
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {isMentor ? `${opponentName}님과의 코칭 세션` : `${opponentName} 호스트 세션`}
            </span>
          )}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm"
            style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
          >
            <Clock className="w-4 h-4" style={{ color: 'var(--text-main)' }} />
            <span className="font-mono font-semibold text-sm" style={{ color: 'var(--text-main)' }}>{formatDuration(duration)}</span>
          </div>
        </div>
      </header>

      {/* ── 바디: 헤더 아래 남은 공간 전부 ── */}
      <div className="flex-1 min-h-0 flex flex-col px-6 pt-4 pb-4 gap-3">

        {/* 상단 콘텐츠 행 (비디오 좌측 + 우측 패널) */}
        <div className="flex-1 min-h-0 flex gap-4">

          {/* ── 좌측: 비디오 + STT ── */}
          <div className="flex-1 min-h-0 flex flex-col gap-3">

            {/* 비디오 2개 */}
            <div className="flex-1 min-h-0 flex gap-4">

              {/* 나 */}
              <div
                className="flex-1 relative rounded-3xl overflow-hidden flex items-center justify-center shadow-lg"
                style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', backdropFilter: 'blur(20px)' }}
              >
                <video ref={localVideoRef} autoPlay playsInline muted
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ display: isVideoOff ? 'none' : 'block' }}
                />
                {isVideoOff && (
                  <div className="flex flex-col items-center gap-3 z-10">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl bg-gradient-to-br ${isMentor ? 'from-amber-500 to-red-500' : 'from-blue-500 to-indigo-600'}`}>
                      {getInitials(myName)}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-base" style={{ color: 'var(--text-main)' }}>{myName}</p>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium mt-1 inline-block ${isMentor ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-500'}`}>
                        {isMentor ? '멘토 (나)' : '멘티 (나)'}
                      </span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md z-10">
                  {isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-white/70" />}
                  <span className="text-xs text-white/70">{isMuted ? '음소거' : `${myName} (${isMentor ? '멘토' : '멘티'})`}</span>
                </div>
              </div>

              {/* 상대방 */}
              <div
                className="flex-1 relative rounded-3xl overflow-hidden flex items-center justify-center shadow-lg"
                style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', backdropFilter: 'blur(20px)' }}
              >
                <video ref={remoteVideoRef} autoPlay playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="flex flex-col items-center gap-3 z-10">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl bg-gradient-to-br ${isMentor ? 'from-blue-500 to-indigo-600' : 'from-amber-500 to-red-500'}`}>
                    {getInitials(opponentName)}
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-base" style={{ color: 'var(--text-main)' }}>{opponentName}</p>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium mt-1 inline-block ${isMentor ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-600'}`}>
                      {isMentor ? '멘티 회원' : '호스트 (멘토)'}
                    </span>
                  </div>
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md z-10">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400">연결 대기 중</span>
                </div>
              </div>
            </div>

            {/* STT — 접힘: 고정 높이 / 펼침: flex-1 */}
            <div
              onClick={() => setIsSTTExpanded(!isSTTExpanded)}
              className={`flex-shrink-0 rounded-2xl p-4 cursor-pointer flex flex-col shadow-md hover:border-blue-400/50 transition-all duration-300 overflow-hidden ${isSTTExpanded ? '!flex-shrink !flex-1' : ''}`}
              style={{
                background: 'var(--panel-bg)',
                border: '1px solid var(--panel-border)',
                backdropFilter: 'blur(12px)',
                height: isSTTExpanded ? undefined : '7rem',
              }}
            >
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>
                    실시간 대화 내역 {isSTTExpanded ? '(전체)' : '(최신)'}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {isSTTExpanded ? '접기 ▲' : '펼치기 ▼'}
                </span>
              </div>
              <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar flex-1 min-h-0">
                {sttLogs.length === 0 && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>대화가 시작되면 여기에 표시됩니다.</p>
                )}
                {(isSTTExpanded ? sttLogs : sttLogs.slice(-2)).map((log, idx) => (
                  <div key={idx} className="flex gap-3 text-sm">
                    <span className={`font-semibold shrink-0 ${log.speaker === myName ? 'text-blue-500' : 'text-amber-500'}`}>{log.speaker}</span>
                    <p style={{ color: 'var(--text-main)' }}>{log.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 우측 패널: 3분할 고정 비율 ── */}
          <div className="w-80 flex-shrink-0 min-h-0 flex flex-col gap-3 relative">

            {/* 확정 질문 — flex-1: 항상 동일 비율 */}
            <div
              className="flex-1 min-h-0 flex flex-col rounded-2xl p-4 shadow-md"
              style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
            >
              <h3 className="flex-shrink-0 font-semibold text-sm mb-3" style={{ color: 'var(--text-main)' }}>내 확정 질문</h3>
              {/* 내용이 많아도 이 div 안에서만 스크롤 */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
                {questions.map((q, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveQuestion(i)}
                    className={`p-3 rounded-xl cursor-pointer text-sm transition-colors flex-shrink-0 ${activeQuestion === i ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-black/5 border border-transparent'}`}
                    style={{ color: 'var(--text-main)' }}
                  >
                    <span className="text-xs text-blue-500 block mb-1 font-semibold">{q.tag}</span>
                    {q.text}
                  </div>
                ))}
              </div>
            </div>

            {/* AI 추천 질문 — flex-1 */}
            <div
              className="flex-1 min-h-0 flex flex-col rounded-2xl p-4 shadow-md"
              style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
            >
              <h3 className="flex-shrink-0 font-semibold text-sm mb-3" style={{ color: 'var(--text-main)' }}>AI 추천 질문</h3>
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
                {recommendedQuestions.map((q, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl text-sm bg-black/5 flex items-start gap-2 hover:bg-black/10 transition-colors cursor-pointer flex-shrink-0"
                    style={{ color: 'var(--text-main)' }}
                  >
                    <ChevronRight className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* LLM 어시스턴트 — flex-[1.4] (조금 더 크게) */}
            <div
              className="flex-[1.4] min-h-0 flex flex-col rounded-2xl p-4 shadow-md border border-blue-500/30 bg-blue-500/5"
            >
              <div className="flex-shrink-0 flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h3 className="font-semibold text-sm text-blue-500">LLM 어시스턴트</h3>
                {llmStreaming && (
                  <span className="text-xs text-blue-400 animate-pulse ml-auto">답변 생성 중...</span>
                )}
              </div>
              <div ref={llmScrollRef} className="flex-1 min-h-0 overflow-y-auto pr-1 mb-2 flex flex-col gap-2 custom-scrollbar">
                {llmMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl text-xs max-w-[85%] flex-shrink-0 ${m.sender === 'me' ? 'bg-blue-500 text-white self-end rounded-tr-sm' : 'bg-black/10 self-start rounded-tl-sm'}`}
                    style={m.sender !== 'me' ? { color: 'var(--text-main)' } : {}}
                  >
                    {m.text}
                  </div>
                ))}
                {llmStreaming && llmBuffer && (
                  <div className="p-2.5 rounded-xl text-xs max-w-[85%] bg-black/10 self-start rounded-tl-sm opacity-70 flex-shrink-0" style={{ color: 'var(--text-main)' }}>
                    {llmBuffer}
                    <span className="inline-block w-1 h-3 bg-blue-400 ml-1 animate-pulse" />
                  </div>
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!llmInput.trim()) return;
                  setLlmMessages(prev => [...prev, { sender: 'me', text: llmInput }]);
                  sendLLMQuestion(llmInput);
                  setLlmInput('');
                }}
                className="flex-shrink-0 flex items-center gap-2 relative"
              >
                <input
                  type="text"
                  value={llmInput}
                  onChange={(e) => setLlmInput(e.target.value)}
                  placeholder="AI에게 질문하기..."
                  disabled={llmStreaming}
                  className="w-full bg-black/10 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                  style={{ color: 'var(--text-main)' }}
                />
                <button type="submit" disabled={llmStreaming}
                  className="absolute right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white disabled:opacity-50">
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>

            {/* ── 채팅 오버레이: 우측 패널 위에 절대 위치로 슬라이드업 ── */}
            <div
              className="absolute inset-0 rounded-2xl flex flex-col transition-all duration-300 ease-in-out"
              style={{
                background: 'var(--chat-overlay)',
                border: '1px solid var(--panel-border)',
                backdropFilter: 'blur(20px)',
                // 닫힌 상태: 아래로 밀고 투명하게, 열린 상태: 정위치 + 불투명
                transform: showChat ? 'translateY(0)' : 'translateY(100%)',
                opacity: showChat ? 1 : 0,
                pointerEvents: showChat ? 'auto' : 'none',
                zIndex: 20,
              }}
            >
              <div className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-3"
                style={{ borderBottom: '1px solid var(--panel-border)' }}>
                <h3 className="font-semibold text-sm text-indigo-400 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> 채팅방
                </h3>
                <button onClick={() => setShowChat(false)}>
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-200 transition-colors" />
                </button>
              </div>
              <div
                ref={chatScrollRef}
                className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-2 custom-scrollbar"
              >
                {chatMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl text-xs max-w-[85%] flex-shrink-0
                      ${m.sender === 'me'
                        ? 'bg-indigo-500 text-white self-end rounded-tr-sm'
                        : m.sender === 'system'
                        ? 'self-center bg-transparent text-gray-400 text-[10px]'
                        : 'bg-black/10 self-start rounded-tl-sm'}`}
                    style={m.sender === 'other' ? { color: 'var(--text-main)' } : {}}
                  >
                    {m.text}
                  </div>
                ))}
              </div>
              <form
                onSubmit={(e) => handleSendMessage(e, 'chat')}
                className="flex-shrink-0 flex items-center gap-2 relative px-4 pb-4 pt-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="메시지 입력..."
                  className="w-full bg-black/10 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  style={{ color: 'var(--text-main)' }}
                />
                <button type="submit"
                  className="absolute right-5 top-1/2 -translate-y-1/2 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>

          </div>{/* 우측 패널 끝 */}
        </div>{/* 상단 콘텐츠 행 끝 */}

        {/* ── 하단 컨트롤 바 (flex-shrink-0, 절대 잘리지 않음) ── */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <div
            className="flex items-center gap-3 px-6 py-3 rounded-2xl shadow-lg backdrop-blur-xl"
            style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
          >
            <ControlBtn
              active={!isMuted}
              onClick={() => setIsMuted(!isMuted)}
              icon={isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              danger={isMuted}
              label={isMuted ? '음소거' : '마이크'}
            />
            <ControlBtn
              active={!isVideoOff}
              onClick={() => setIsVideoOff(!isVideoOff)}
              icon={isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              danger={isVideoOff}
              label={isVideoOff ? '비디오 꺼짐' : '비디오'}
            />
            <div className="w-px h-8 mx-1" style={{ background: 'var(--panel-border)' }} />
            <button onClick={handleEndCall} className="flex flex-col items-center gap-1 group">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 shadow-xl bg-gradient-to-br from-red-500 to-red-700">
                <PhoneOff className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs text-red-500 font-medium">종료</span>
            </button>
            <div className="w-px h-8 mx-1" style={{ background: 'var(--panel-border)' }} />
            <ControlBtn active={showChat} onClick={() => setShowChat(!showChat)} icon={<MessageSquare className="w-5 h-5" />} label="채팅" />
            <ControlBtn active={showSettings} onClick={() => setShowSettings(true)} icon={<Settings className="w-5 h-5" />} label="설정" />
          </div>
        </div>

      </div>{/* 바디 끝 */}

      {/* ── 설정 모달 ── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-96 rounded-2xl p-6 shadow-2xl" style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-main)' }}>장치 설정</h2>
              <button onClick={() => setShowSettings(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-main)' }}><Mic className="w-4 h-4" /> 마이크</label>
                <select className="w-full p-2.5 rounded-lg bg-black/10 text-sm focus:outline-none" style={{ color: 'var(--text-main)' }}>
                  <option>기본 마이크 (내장 마이크)</option>
                  <option>외부 USB 마이크</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-main)' }}><Volume2 className="w-4 h-4" /> 스피커</label>
                <select className="w-full p-2.5 rounded-lg bg-black/10 text-sm focus:outline-none" style={{ color: 'var(--text-main)' }}>
                  <option>기본 스피커 (MacBook Pro)</option>
                  <option>블루투스 헤드폰</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-main)' }}><Video className="w-4 h-4" /> 카메라</label>
                <select className="w-full p-2.5 rounded-lg bg-black/10 text-sm focus:outline-none" style={{ color: 'var(--text-main)' }}>
                  <option>FaceTime HD Camera</option>
                </select>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full mt-6 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
            >
              완료
            </button>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(150,150,150,0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(150,150,150,0.5); }
      `}</style>
    </div>
  );
}