import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare,
  Settings, ChevronRight, Sparkles, Clock, Sun, Moon, Send, X, Volume2,
  RefreshCw,
} from 'lucide-react';
import axios from 'axios';
import { useCoffeeChatWebRTC } from "../hooks/useCoffeeChatWebRTC";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';
const WS_URL = BACKEND_URL.replace(/^http/, 'ws');

const RECOMMEND_INTERVAL_MS = 45000;
const MIN_BUFFER_LENGTH = 0;

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
  const [isQuestionsExpanded, setIsQuestionsExpanded] = useState(true);
  const [isAIExpanded, setIsAIExpanded] = useState(true);
  const [isLLMExpanded, setIsLLMExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const chatWsRef = useRef(null);
  const llmWsRef  = useRef(null);
  const [chatInput, setChatInput]     = useState('');
  const [chatMessages, setChatMessages] = useState([{ sender: 'system', text: '채팅방이 개설되었습니다.' }]);

  const [llmInput, setLlmInput]         = useState('');
  const [llmMessages, setLlmMessages]   = useState([{ sender: 'ai', text: '무엇이든 물어보세요! 대화를 기반으로 조언해 드릴게요.' }]);
  const [llmStreaming, setLlmStreaming]  = useState(false);
  const [llmBuffer, setLlmBuffer]       = useState('');

  const [recommendedQuestions, setRecommendedQuestions] = useState([
    '대화가 시작되면 AI가 맥락에 맞는 추천 질문을 생성합니다.',
  ]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const sttBufferRef       = useRef('');
  const lastFinalCountRef  = useRef(0);
  const [nextRefreshIn, setNextRefreshIn] = useState(RECOMMEND_INTERVAL_MS / 1000);

  const [booking, setBooking]   = useState(null);
  const [session, setSession]   = useState(null);
  const [myName, setMyName]     = useState('나');
  const [userId, setUserId]     = useState(null);
  const [activeQuestion, setActiveQuestion] = useState(0);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);

  const chatScrollRef = useRef(null);
  const llmScrollRef  = useRef(null);

  useEffect(() => {
    const id = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName') || '나';
    setMyName(userName);
    setUserId(id ? Number(id) : null);
    if (!id) return;

    axios.get(`${BACKEND_URL}/api/booking/detail/${chatId}`)
      .then(res => setBooking(res.data))
      .catch(err => console.error('[예약 정보 로드 실패]', err));

    axios.get(`${BACKEND_URL}/api/chat-session/${chatId}`)
      .then(res => setSession(res.data))
      .catch(err => console.error('[세션 정보 로드 실패]', err));
  }, [chatId]);

  useEffect(() => {
    const timer = setInterval(() => setDuration(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatMessages]);
  useEffect(() => {
    if (llmScrollRef.current) llmScrollRef.current.scrollTop = llmScrollRef.current.scrollHeight;
  }, [llmMessages, llmBuffer]);

  useEffect(() => {
    if (!userId || !chatId) return;

    const ws = new WebSocket(`${WS_URL}/ws/chat/${chatId}/${userId}`);
    chatWsRef.current = ws;

    ws.onopen = () => console.log('[Chat WS] 연결됨');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Number(data.sender_id) === Number(userId)) return;
        setChatMessages(prev => [...prev, {
          sender: 'other',
          name: data.sender_name || '상대방',
          text: data.message,
        }]);
      } catch (e) {
        console.warn('[Chat WS] 메시지 파싱 오류', e);
      }
    };
    ws.onclose = () => console.log('[Chat WS] 연결 종료');
    ws.onerror = (e) => console.error('[Chat WS] 오류', e);

    return () => ws.close();
  }, [userId, chatId]);

  useEffect(() => {
    if (!userId || !chatId) return;

    const ws = new WebSocket(`${WS_URL}/ws/llm/${chatId}/${userId}`);
    llmWsRef.current = ws;

    ws.onopen = () => console.log('[LLM WS] 연결 성공');
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chunk') {
          setLlmStreaming(true);
          setLlmBuffer(prev => prev + data.text);
        } else if (data.type === 'done') {
          setLlmStreaming(false);
          setLlmMessages(prev => [...prev, { sender: 'ai', text: data.text }]);
          setLlmBuffer('');
        } else if (data.type === 'error') {
          setLlmStreaming(false);
          setLlmMessages(prev => [...prev, { sender: 'ai', text: `❌ 오류: ${data.text}` }]);
          setLlmBuffer('');
        } else if (data.type === 'recommended_questions') {
          setIsGeneratingQuestions(false);
          if (Array.isArray(data.questions) && data.questions.length > 0) {
            setRecommendedQuestions(data.questions);
          }
        }
      } catch (e) {
        console.warn('[LLM WS] 데이터 파싱 실패:', e);
      }
    };
    ws.onclose = () => console.log('[LLM WS] 연결 종료');
    ws.onerror = (e) => console.error('[LLM WS] 에러 발생:', e);

    return () => ws.close();
  }, [userId, chatId]);

  const {
    localVideoRef,
    remoteVideoRef,
    sttLogs,
    hangUp,
  } = useCoffeeChatWebRTC({
    chatId,
    userId,
    userName: myName,
    questions: booking?.questions,
  });

  useEffect(() => {
    const finals = sttLogs.filter(l => l.type === 'final');
    if (finals.length <= lastFinalCountRef.current) return;
    const newFinals = finals.slice(lastFinalCountRef.current);
    newFinals.forEach(log => {
      const line = `${log.speaker}: ${log.text}`;
      sttBufferRef.current += (sttBufferRef.current ? '\n' : '') + line;
    });
    lastFinalCountRef.current = finals.length;
  }, [sttLogs]);

  useEffect(() => {
    if (!userId || !chatId) return;

    const countdown = setInterval(() => {
      setNextRefreshIn(prev => {
        if (prev <= 1) return RECOMMEND_INTERVAL_MS / 1000;
        return prev - 1;
      });
    }, 1000);

    const interval = setInterval(() => {
      const buffer = sttBufferRef.current.trim();
      if (buffer.length < MIN_BUFFER_LENGTH) return;
      if (llmWsRef.current?.readyState !== WebSocket.OPEN) return;

      setIsGeneratingQuestions(true);
      llmWsRef.current.send(JSON.stringify({
        type: 'recommend_questions',
        conversation: buffer,
        mentor_profile: booking?.mentor_profile || booking?.mentorProfile || '',
        mentee_profile: booking?.user_profile  || booking?.userProfile  || '',
        preset_questions: booking?.questions || '',
      }));
      sttBufferRef.current = '';
    }, RECOMMEND_INTERVAL_MS);

    return () => {
      clearInterval(countdown);
      clearInterval(interval);
    };
  }, [userId, chatId, booking]);

  const handleManualRefresh = useCallback(() => {
    const buffer = sttBufferRef.current.trim();
    if (!buffer || buffer.length < MIN_BUFFER_LENGTH) return;
    if (llmWsRef.current?.readyState !== WebSocket.OPEN) return;

    setIsGeneratingQuestions(true);
    setNextRefreshIn(RECOMMEND_INTERVAL_MS / 1000);
    llmWsRef.current.send(JSON.stringify({
      type: 'recommend_questions',
      conversation: buffer,
      mentor_profile: booking?.mentor_profile || booking?.mentorProfile || '',
      mentee_profile: booking?.user_profile  || booking?.userProfile  || '',
      preset_questions: booking?.questions || '',
    }));
    sttBufferRef.current = '';
  }, [booking]);

  const isMentor = booking && userId
    ? Number(userId) === Number(booking.mentor_user_id)
    : false;

  const myRole    = isMentor ? '멘토 (나)' : '멘티 (나)';
  const theirRole = isMentor ? '멘티' : '멘토';
  const opponentName = isMentor
    ? (booking?.user_name   || booking?.userName   || '멘티')
    : (booking?.mentor_name || booking?.mentorName || '멘토');

  const handleLlmSubmit = (e) => {
    e.preventDefault();
    if (!llmInput.trim() || llmStreaming) return;
    const text = llmInput.trim();
    setLlmMessages(prev => [...prev, { sender: 'me', text }]);
    setLlmInput('');
    if (llmWsRef.current?.readyState === WebSocket.OPEN) {
      setLlmStreaming(true);
      setLlmBuffer('');
      llmWsRef.current.send(JSON.stringify({
        type: 'question',
        text,
        questions: booking?.questions || '',
      }));
    } else {
      setLlmMessages(prev => [...prev, { sender: 'ai', text: 'AI 연결이 원활하지 않습니다. 잠시 후 다시 시도해 주세요.' }]);
    }
  };

  const handleToggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localVideoRef?.current?.srcObject?.getAudioTracks()
      .forEach(track => { track.enabled = !newMuted; });
  }, [isMuted, localVideoRef]);

  const handleToggleVideo = useCallback(() => {
    const newOff = !isVideoOff;
    setIsVideoOff(newOff);
    localVideoRef?.current?.srcObject?.getVideoTracks()
      .forEach(track => { track.enabled = !newOff; });
  }, [isVideoOff, localVideoRef]);

  const handleRemoteVideoPlay    = useCallback(() => setIsRemoteConnected(true), []);
  const handleRemoteVideoEmptied = useCallback(() => setIsRemoteConnected(false), []);

  const handleEndCall = async () => {
    await hangUp();
    chatWsRef.current?.close();
    try {
      if (session?.session_id)
        await axios.post(`${BACKEND_URL}/api/chat-session/end/${session.session_id}`);
    } catch (err) {}
    navigate(`/coffee-chat-review/${chatId}`);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'me', text }]);
    setChatInput('');
    if (chatWsRef.current?.readyState === WebSocket.OPEN) {
      chatWsRef.current.send(JSON.stringify({
        sender_id:   userId,
        sender_name: myName,
        message:     text,
      }));
    }
  };

  const formatDuration = (s) => {
    const m = Math.floor(s / 60);
    return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  };

  const getInitials = (name) => name?.slice(0, 2) || '??';

  const questions = booking?.questions
    ? booking.questions.split('\n').filter(q => q.trim())
        .map((q, i) => ({ text: q.replace(/^[-•]\s*/, '').trim(), tag: `질문 ${i + 1}` }))
    : [{ text: '작성된 질문이 없어요', tag: '질문' }];

  const themeStyles = theme === 'dark' ? {
    '--bg-gradient':       'linear-gradient(135deg, #0d1520 0%, #111d2e 50%, #0a1628 100%)',
    '--panel-bg':          'rgba(255,255,255,0.03)',
    '--panel-border':      'rgba(255,255,255,0.08)',
    '--text-main':         '#ffffff',
    '--text-muted':        'rgba(255,255,255,0.5)',
    '--btn-bg':            'rgba(255,255,255,0.06)',
    '--btn-active':        'rgba(255,255,255,0.15)',
    '--btn-border':        'rgba(255,255,255,0.06)',
    '--btn-border-active': 'rgba(255,255,255,0.2)',
    '--chat-overlay':      'rgba(13,21,32,0.97)',
  } : {
    '--bg-gradient':       'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
    '--panel-bg':          'rgba(255,255,255,0.8)',
    '--panel-border':      'rgba(0,0,0,0.1)',
    '--text-main':         '#0f172a',
    '--text-muted':        '#64748b',
    '--btn-bg':            'rgba(0,0,0,0.05)',
    '--btn-active':        'rgba(0,0,0,0.1)',
    '--btn-border':        'rgba(0,0,0,0.05)',
    '--btn-border-active': 'rgba(0,0,0,0.15)',
    '--chat-overlay':      'rgba(241,245,249,0.97)',
  };

  return (
    <div
      className="h-screen flex flex-col overflow-hidden transition-colors duration-300"
      style={{ ...themeStyles, background: 'var(--bg-gradient)' }}
    >
      {/* ── 헤더 ── */}
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
              {isMentor ? `${opponentName}님과의 코칭 세션` : `${opponentName}님과의 세션`}
            </span>
          )}
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm"
            style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
          >
            <Clock className="w-4 h-4" style={{ color: 'var(--text-main)' }} />
            <span className="font-mono font-semibold text-sm" style={{ color: 'var(--text-main)' }}>
              {formatDuration(duration)}
            </span>
          </div>
        </div>
      </header>

      {/* ── 바디 ── */}
      <div className="flex-1 min-h-0 flex flex-col px-6 pt-4 pb-4 gap-3">
        <div className="flex-1 min-h-0 flex gap-4">

          {/* ── 좌측: 비디오 + STT ── */}
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            <div className="flex-1 min-h-0 flex gap-4">

              {/* 내 화면 */}
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
                        {myRole}
                      </span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md z-10">
                  {isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-white/70" />}
                  <span className="text-xs text-white/70">
                    {isMuted ? '음소거' : `${myName} (${isMentor ? '멘토' : '멘티'})`}
                  </span>
                </div>
              </div>

              {/* 상대방 화면 */}
              <div
                className="flex-1 relative rounded-3xl overflow-hidden flex items-center justify-center shadow-lg"
                style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', backdropFilter: 'blur(20px)' }}
              >
                <video ref={remoteVideoRef} autoPlay playsInline
                  onPlay={handleRemoteVideoPlay}
                  onEmptied={handleRemoteVideoEmptied}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ display: isRemoteConnected ? 'block' : 'none' }}
                />
                {!isRemoteConnected && (
                  <div className="flex flex-col items-center gap-3 z-10">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl bg-gradient-to-br ${isMentor ? 'from-blue-500 to-indigo-600' : 'from-amber-500 to-red-500'}`}>
                      {getInitials(opponentName)}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-base" style={{ color: 'var(--text-main)' }}>{opponentName}</p>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium mt-1 inline-block ${isMentor ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-600'}`}>
                        {theirRole}
                      </span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md z-10">
                  {isRemoteConnected ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs text-green-400">연결됨</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                      <span className="text-xs text-yellow-400">연결 대기 중</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* STT 패널 */}
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
                    <span className={`font-semibold shrink-0 ${log.speaker === myName ? 'text-blue-500' : 'text-amber-500'}`}>
                      {log.speaker}
                    </span>
                    <p style={{ color: log.type === 'interim' ? 'var(--text-muted)' : 'var(--text-main)', fontStyle: log.type === 'interim' ? 'italic' : 'normal' }}>
                      {log.text}
                      {log.type === 'interim' && <span className="inline-block w-1 h-3 bg-current ml-1 animate-pulse" />}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 우측 패널 ── */}
          <div className="w-80 flex-shrink-0 min-h-0 flex flex-col gap-3 relative">

            {/* ── 확정 질문 ── */}
            <div
              className="flex-1 min-h-0 flex flex-col rounded-2xl p-4 shadow-md overflow-hidden transition-all duration-300"
              style={{
              background: 'var(--panel-bg)',
              border: '1px solid var(--panel-border)',
              maxHeight: isQuestionsExpanded ? '500px' : '52px',  // ← 높이로 접기
              }}
            >
              <div
                className="flex-shrink-0 flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => setIsQuestionsExpanded(!isQuestionsExpanded)}
              >
                <h3 className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>내 확정 질문</h3>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {isQuestionsExpanded ? '접기 ▲' : '펼치기 ▼'}
                </span>
              </div>
              {isQuestionsExpanded && (
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
              )}
            </div>

            {/* ── AI 추천 질문 ── */}
            <div
            className="flex-1 min-h-0 flex flex-col rounded-2xl p-4 shadow-md overflow-hidden transition-all duration-300"
              style={{
                background: 'var(--panel-bg)',
                border: '1px solid var(--panel-border)',
                maxHeight: isAIExpanded ? '500px' : '52px',  // ← 높이로 접기
                    }}
                >
              <div
                className="flex-shrink-0 flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => setIsAIExpanded(!isAIExpanded)}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>AI 추천 질문</h3>
                </div>
                <div className="flex items-center gap-2">
                  {!isGeneratingQuestions && sttBufferRef.current.length >= MIN_BUFFER_LENGTH && (
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {nextRefreshIn}s
                    </span>
                  )}
                  {isGeneratingQuestions ? (
                    <span className="text-xs text-amber-400 animate-pulse flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> 생성 중...
                    </span>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleManualRefresh(); }}
                      disabled={sttBufferRef.current.length < MIN_BUFFER_LENGTH}
                      className="p-1 rounded-lg transition-colors hover:bg-amber-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="지금 바로 추천 질문 갱신"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                    </button>
                  )}
                  <span className="text-xs text-amber-400">
                    {isAIExpanded ? '접기 ▲' : '펼치기 ▼'}
                  </span>
                </div>
              </div>

              {isAIExpanded && (
                <>
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
                    {recommendedQuestions.map((q, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl text-sm flex items-start gap-2 hover:bg-amber-500/5 transition-colors cursor-pointer flex-shrink-0 border border-transparent hover:border-amber-500/20"
                        style={{ background: 'rgba(0,0,0,0.04)', color: 'var(--text-main)' }}
                      >
                        <ChevronRight className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <span>{q}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex-shrink-0 mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>대화 수집 중</span>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {Math.min(100, Math.round((nextRefreshIn / (RECOMMEND_INTERVAL_MS / 1000)) * 100 * -1 + 100))}%
                      </span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-black/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-1000"
                        style={{ width: `${Math.min(100, Math.round((1 - nextRefreshIn / (RECOMMEND_INTERVAL_MS / 1000)) * 100))}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── LLM 어시스턴트 ── */}
            <div
            className="flex-1 min-h-0 flex flex-col rounded-2xl p-4 shadow-md overflow-hidden transition-all duration-300"
            style={{
              background: 'var(--panel-bg)',
               border: '1px solid var(--panel-border)',
               maxHeight: isLLMExpanded ? '500px' : '52px',  // ← 높이로 접기
              }}
              >
              <div
                className="flex-shrink-0 flex items-center justify-between mb-3 cursor-pointer"
                onClick={() => setIsLLMExpanded(!isLLMExpanded)}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-500" />
                  <h3 className="font-semibold text-sm text-blue-500">LLM 어시스턴트</h3>
                  {llmStreaming && (
                    <span className="text-xs text-blue-400 animate-pulse ml-2">답변 생성 중...</span>
                  )}
                </div>
                <span className="text-xs text-blue-400">
                  {isLLMExpanded ? '접기 ▲' : '펼치기 ▼'}
                </span>
              </div>
              {isLLMExpanded && (
                <>
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
                  <form onSubmit={handleLlmSubmit} className="flex-shrink-0 flex items-center gap-2 relative">
                    <input
                      type="text"
                      value={llmInput}
                      onChange={(e) => setLlmInput(e.target.value)}
                      placeholder={llmStreaming ? 'AI가 답변을 작성 중입니다...' : 'AI에게 질문하기...'}
                      disabled={llmStreaming}
                      className="w-full bg-black/10 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                      style={{ color: 'var(--text-main)' }}
                    />
                    <button
                      type="submit"
                      disabled={llmStreaming || !llmInput.trim()}
                      className="absolute right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:bg-gray-500 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* 채팅 오버레이 */}
            <div
              className="absolute inset-0 rounded-2xl flex flex-col transition-all duration-300 ease-in-out"
              style={{
                background: 'var(--chat-overlay)',
                border: '1px solid var(--panel-border)',
                backdropFilter: 'blur(20px)',
                transform: showChat ? 'translateY(0)' : 'translateY(100%)',
                opacity: showChat ? 1 : 0,
                pointerEvents: showChat ? 'auto' : 'none',
                zIndex: 20,
              }}
            >
              <div
                className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-3"
                style={{ borderBottom: '1px solid var(--panel-border)' }}
              >
                <h3 className="font-semibold text-sm text-indigo-400 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> 채팅방
                </h3>
                <button onClick={() => setShowChat(false)}>
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-200 transition-colors" />
                </button>
              </div>
              <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-2 custom-scrollbar">
                {chatMessages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex flex-col max-w-[85%] flex-shrink-0 ${m.sender === 'me' ? 'self-end items-end' : m.sender === 'system' ? 'self-center' : 'self-start items-start'}`}
                  >
                    {m.sender === 'other' && m.name && (
                      <span className="text-[10px] mb-0.5 ml-1" style={{ color: 'var(--text-muted)' }}>{m.name}</span>
                    )}
                    <div
                      className={`p-2.5 rounded-xl text-xs ${m.sender === 'me' ? 'bg-indigo-500 text-white rounded-tr-sm' : m.sender === 'system' ? 'bg-transparent text-gray-400 text-[10px]' : 'bg-black/10 rounded-tl-sm'}`}
                      style={m.sender === 'other' ? { color: 'var(--text-main)' } : {}}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <form
                onSubmit={handleSendMessage}
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
                <button
                  type="submit"
                  className="absolute right-5 top-1/2 -translate-y-1/2 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white"
                >
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── 하단 컨트롤 바 ── */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <div
            className="flex items-center gap-3 px-6 py-3 rounded-2xl shadow-lg backdrop-blur-xl"
            style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}
          >
            <ControlBtn active={!isMuted} onClick={handleToggleMute}
              icon={isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              danger={isMuted} label={isMuted ? '음소거' : '마이크'} />
            <ControlBtn active={!isVideoOff} onClick={handleToggleVideo}
              icon={isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              danger={isVideoOff} label={isVideoOff ? '비디오 꺼짐' : '비디오'} />
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
      </div>

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
                <label className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                  <Mic className="w-4 h-4" /> 마이크
                </label>
                <select className="w-full p-2.5 rounded-lg bg-black/10 text-sm focus:outline-none" style={{ color: 'var(--text-main)' }}>
                  <option>기본 마이크 (내장 마이크)</option>
                  <option>외부 USB 마이크</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                  <Volume2 className="w-4 h-4" /> 스피커
                </label>
                <select className="w-full p-2.5 rounded-lg bg-black/10 text-sm focus:outline-none" style={{ color: 'var(--text-main)' }}>
                  <option>기본 스피커</option>
                  <option>블루투스 헤드폰</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-main)' }}>
                  <Video className="w-4 h-4" /> 카메라
                </label>
                <select className="w-full p-2.5 rounded-lg bg-black/10 text-sm focus:outline-none" style={{ color: 'var(--text-main)' }}>
                  <option>FaceTime HD Camera</option>
                  <option>외부 웹캠</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}