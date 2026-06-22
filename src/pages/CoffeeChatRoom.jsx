import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare, ChevronLeft, Sparkles, Clock, Sun, Moon, Send, ChevronRight, X, RefreshCw, HelpCircle, Mic, MicOff, Video, VideoOff
} from 'lucide-react';
import axios from 'axios';

// 커스텀 훅 및 외부 컴포넌트
import { useCoffeeChatWebRTC } from "../hooks/useCoffeeChatWebRTC";
import { useChatTimer } from "../hooks/useChatTimer";
import ControlBar from "../components/CoffeeChat/ControlBar";
import SettingsModal from "../components/CoffeeChat/SettingsModal";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';
const WS_URL = BACKEND_URL.replace(/^http/, 'ws');

const RECOMMEND_INTERVAL_MS = 45000;
const MIN_BUFFER_LENGTH = 0;
const TUTORIAL_KEY = 'coffeechat_tutorial_done';

// ── 튜토리얼 스텝 정의 ────────────────────────────────────
const STEPS = [
  {
    id: 'welcome',
    title: '커피챗에 오신 걸 환영해요! ☕',
    description: '이 화면에서 멘토와 실시간 영상 통화를 하며 커피챗을 진행할 수 있어요.\n잠깐, 주요 기능들을 빠르게 안내해 드릴게요!',
    target: null,
  },
  {
    id: 'video',
    title: '📹 영상 화면',
    description: '왼쪽에 내 화면, 오른쪽에 상대방 화면이 표시돼요.\n연결되면 초록 불이 켜지고, 상대방이 대기 중이면 노란 불이 표시돼요.',
    target: 'video-area',
    position: 'right',
  },
  {
    id: 'stt',
    title: '💬 실시간 대화 내역',
    description: '대화 내용이 자동으로 텍스트로 변환돼요.\n기본은 숨김 상태이고, "대화 내역 보기" 버튼을 누르면 최신 2줄을 볼 수 있어요.\n한 번 더 누르면 전체 내역을 최신순으로 확인할 수 있어요.',
    target: 'stt-area',
    position: 'right',
  },
  {
    id: 'tabs',
    title: '📋 오른쪽 패널 (탭)',
    description: '세 가지 탭으로 구성되어 있어요.\n• 확정 질문: 미리 준비한 내 질문 목록\n• AI 추천: 대화 흐름에 맞게 AI가 실시간으로 추천해주는 질문\n• LLM: 대화 중 궁금한 것을 AI에게 바로 물어볼 수 있어요',
    target: 'tab-panel',
    position: 'left',
  },
  {
    id: 'ai',
    title: '✨ AI 추천 질문',
    description: '45초마다 대화 내용을 분석해서 맥락에 맞는 질문을 자동으로 추천해줘요.\n새로고침 버튼으로 수동으로 갱신할 수도 있어요.\n대화가 막힐 때 참고해보세요!',
    target: 'tab-panel',
    position: 'left',
  },
  {
    id: 'controls',
    title: '🎛️ 하단 컨트롤 바',
    description: '• 마이크 버튼: 음소거 / 해제\n• 비디오 버튼: 카메라 켜기 / 끄기\n• 빨간 버튼: 통화 종료 후 리뷰 페이지로 이동\n• 채팅 버튼: 텍스트 채팅창 열기\n• 설정 버튼: 마이크·카메라 장치 변경',
    target: 'controls',
    position: 'top',
  },
  {
    id: 'timer',
    title: '⏱️ 자동 종료 안내',
    description: '예약된 30분이 지나면 세션이 자동으로 종료되고 리뷰 페이지로 이동해요.\n헤더의 타이머로 진행 시간을 확인할 수 있어요.',
    target: 'header-timer',
    position: 'bottom',
  },
  {
    id: 'done',
    title: '이제 시작할 준비가 됐어요! 🎉',
    description: '편하게 대화를 시작해보세요.\n언제든 다시 이 가이드를 보고 싶다면 하단의 ? 버튼을 눌러 다시 볼 수 있어요.',
    target: null,
  },
];

// ── 튜토리얼 오버레이 컴포넌트 ──────────────────────────
function TutorialOverlay({ onClose }) {
  const [step, setStep] = useState(0);
  const [neverShow, setNeverShow] = useState(false);
  const [spotlightStyle, setSpotlightStyle] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({});

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast  = step === STEPS.length - 1;

  useEffect(() => {
    if (!current.target) {
      setSpotlightStyle(null);
      setTooltipStyle({});
      return;
    }
    const el = document.querySelector(`[data-tutorial="${current.target}"]`);
    if (!el) { setSpotlightStyle(null); return; }

    const rect = el.getBoundingClientRect();
    const pad = 10;
    const sp = {
      top: rect.top - pad, left: rect.left - pad,
      width: rect.width + pad * 2, height: rect.height + pad * 2,
    };
    setSpotlightStyle(sp);

    const tipW = 320, tipH = 210, gap = 18;
    let s = {};
    if (current.position === 'right')  s = { top: rect.top + rect.height / 2 - tipH / 2, left: rect.right + gap };
    if (current.position === 'left')   s = { top: rect.top + rect.height / 2 - tipH / 2, left: rect.left - tipW - gap };
    if (current.position === 'bottom') s = { top: rect.bottom + gap, left: rect.left + rect.width / 2 - tipW / 2 };
    if (current.position === 'top')    s = { top: rect.top - tipH - gap, left: rect.left + rect.width / 2 - tipW / 2 };
    s.left = Math.max(12, Math.min(s.left, window.innerWidth  - tipW - 12));
    s.top  = Math.max(12, Math.min(s.top,  window.innerHeight - tipH - 12));
    setTooltipStyle(s);
  }, [step, current]);

  const handleClose = (markDone = false) => {
    if (markDone || neverShow) localStorage.setItem(TUTORIAL_KEY, '1');
    onClose();
  };
  const handleNext = () => isLast ? handleClose(true) : setStep(s => s + 1);
  const handlePrev = () => !isFirst && setStep(s => s - 1);

  const isCenterModal = !current.target;

  const StepDots = ({ small }) => (
    <div className="flex items-center gap-1.5">
      {STEPS.map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${small ? 'h-1' : 'h-1.5'}`}
          style={{ width: i === step ? (small ? '14px' : '20px') : (small ? '4px' : '6px'), background: i === step ? '#2f6bfb' : '#e2e8f0' }} />
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100]">
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightStyle && (
              <rect x={spotlightStyle.left} y={spotlightStyle.top}
                width={spotlightStyle.width} height={spotlightStyle.height} rx="16" fill="black" />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#spotlight-mask)" />
      </svg>

      {spotlightStyle && (
        <div className="absolute rounded-2xl pointer-events-none transition-all duration-300"
          style={{
            top: spotlightStyle.top, left: spotlightStyle.left,
            width: spotlightStyle.width, height: spotlightStyle.height,
            boxShadow: '0 0 0 3px rgba(47,107,251,0.85), 0 0 32px rgba(47,107,251,0.35)',
          }} />
      )}

      {isCenterModal && (
        <div className="absolute inset-0 flex items-center justify-center" onClick={e => e.stopPropagation()}>
          <div className="w-[420px] rounded-3xl p-8 shadow-2xl flex flex-col gap-5 bg-white"
            style={{ border: '1px solid rgba(47,107,251,0.12)' }}>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <button onClick={() => handleClose(false)} className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{current.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{current.description}</p>
            </div>
            <StepDots />
            {isLast && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={neverShow} onChange={e => setNeverShow(e.target.checked)} className="w-4 h-4 accent-blue-500" />
                <span className="text-xs text-gray-400">다음에 접속할 때 이 가이드를 보지 않기</span>
              </label>
            )}
            <div className="flex gap-3">
              {!isFirst && (
                <button onClick={handlePrev}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200">
                  <ChevronLeft className="w-4 h-4" /> 이전
                </button>
              )}
              <button onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 transition-opacity shadow-md">
                {isLast ? '시작하기 🚀' : <><span>다음</span><ChevronRight className="w-4 h-4" /></>}
              </button>
            </div>
            {!isLast && (
              <button onClick={() => handleClose(false)} className="text-xs text-center text-gray-400 hover:text-gray-500 transition-colors">
                건너뛰기
              </button>
            )}
          </div>
        </div>
      )}

      {!isCenterModal && (
        <div className="absolute w-80 rounded-2xl p-5 shadow-2xl flex flex-col gap-3 bg-white transition-all duration-300"
          style={{ ...tooltipStyle, border: '1px solid rgba(47,107,251,0.12)' }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-gray-900 text-sm leading-snug">{current.title}</h3>
            <button onClick={() => handleClose(false)} className="p-1 rounded-full hover:bg-gray-100 transition-colors text-gray-400 flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line">{current.description}</p>
          <StepDots small />
          <div className="flex gap-2">
            {!isFirst && (
              <button onClick={handlePrev}
                className="flex items-center px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors border border-gray-200">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 transition-opacity">
              {isLast ? '완료 🎉' : <><span>다음</span><ChevronRight className="w-3.5 h-3.5" /></>}
            </button>
          </div>
          <button onClick={() => handleClose(false)} className="text-[10px] text-center text-gray-400 hover:text-gray-500 transition-colors">
            건너뛰기
          </button>
        </div>
      )}
    </div>
  );
}

const STT_MODES = ['hidden', 'preview', 'expanded'];

export default function CoffeeChatRoom() {
  const { chatId } = useParams();
  const navigate = useNavigate();

  // ════════════════════════════════════════════════════════
  // 1. 상태(State)와 Ref 선언
  // ════════════════════════════════════════════════════════
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [theme, setTheme] = useState('light');
  const [showChat, setShowChat] = useState(false);
  const [sttMode, setSttMode] = useState('hidden');
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('questions'); // 탭 방식 관리

  // 튜토리얼 상태
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(TUTORIAL_KEY);
    if (!done) {
      const t = setTimeout(() => setShowTutorial(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  const chatWsRef = useRef(null);
  const llmWsRef  = useRef(null);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([{ sender: 'system', text: '채팅방이 개설되었습니다.' }]);
  const [llmInput, setLlmInput] = useState('');
  const [llmMessages, setLlmMessages] = useState([{ sender: 'ai', text: '무엇이든 물어보세요! 대화를 기반으로 조언해 드릴게요.' }]);
  const [llmStreaming, setLlmStreaming] = useState(false);
  const [llmBuffer, setLlmBuffer] = useState('');
  const [recommendedQuestions, setRecommendedQuestions] = useState(['대화가 시작되면 AI가 맥락에 맞는 추천 질문을 생성합니다.']);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  
  const sttBufferRef = useRef('');
  const lastFinalCountRef = useRef(0);
  const fullTranscriptRef = useRef('');
  
  const [pastTranscript, setPastTranscript] = useState('');
  const [restoredLogs, setRestoredLogs] = useState([]); // 🌟 과거 대화 복구용 배열
  
  const [nextRefreshIn, setNextRefreshIn] = useState(RECOMMEND_INTERVAL_MS / 1000);
  const [booking, setBooking] = useState(null);
  const [session, setSession] = useState(null);
  const [myName, setMyName] = useState('나');
  const [userId, setUserId] = useState(null);

  const [activeQuestion, setActiveQuestion] = useState(0);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const chatScrollRef = useRef(null);
  const llmScrollRef = useRef(null);
  const sttScrollRef = useRef(null);

  // ════════════════════════════════════════════════════════
  // 2. 초기 데이터 로딩 및 WebRTC
  // ════════════════════════════════════════════════════════
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
      .then(res => {
        setSession(res.data);
        if (res.data.session_id) {
          axios.get(`${BACKEND_URL}/api/chat-session/${res.data.session_id}/transcript`)
            .then(tRes => {
              if (tRes.data.transcript) {
                setPastTranscript(tRes.data.transcript);
                fullTranscriptRef.current = tRes.data.transcript + '\n';
                
                // 🌟 텍스트를 파싱해서 화면에 그릴 수 있는 배열로 변환
                const lines = tRes.data.transcript.split('\n');
                const parsed = lines.map(line => {
                  const match = line.match(/^(.+?):\s*(.*)$/);
                  if (match) return { speaker: match[1], text: match[2], type: 'final' };
                  return null;
                }).filter(Boolean);
                setRestoredLogs(parsed);
              }
            })
            .catch(() => console.log("과거 기록 없음"));
        }
      })
      .catch(err => console.error('[세션 정보 로드 실패]', err));
  }, [chatId]);

  const { localVideoRef, remoteVideoRef, sttLogs, hangUp } = useCoffeeChatWebRTC({
    chatId, userId, userName: myName, questions: booking?.questions,
  });

  // ════════════════════════════════════════════════════════
  // 3. 핵심 기능 (통화 종료 시 로딩 없이 즉시 이동)
  // ════════════════════════════════════════════════════════
  const isMentor = booking && userId ? Number(userId) === Number(booking.mentor_user_id) : false;

  const handleEndCall = useCallback(() => {
  // 🌟 1. 기다림 없이 누르자마자 즉시 역할에 맞는 페이지로 먼저 번개처럼 이동!
  if (isMentor) {
    navigate(`/coffee-chat-report/${chatId}`); 
  } else {
    navigate(`/coffee-chat-review/${chatId}`);
  }

  // 🌟 2. 무거운 작업(종료, 저장, AI 호출)은 뒤에서 조용히 비동기로 처리 (Fire-and-Forget)
  (async () => {
    // 🚨 [수정] 마운트 시 가져온 session state는 stale할 수 있음
    //     (useCoffeeChatWebRTC 훅이 비동기로 세션을 생성하는 것과 레이스 컨디션 발생 가능)
    //     → 종료 직전에 최신 세션 정보를 다시 조회해서 session_id를 확실히 확보
    let liveSessionId = session?.session_id || null;
    try {
      const freshRes = await axios.get(`${BACKEND_URL}/api/chat-session/${chatId}`);
      if (freshRes.data?.session_id) {
        liveSessionId = freshRes.data.session_id;
      }
    } catch (err) {
      console.error("🚨 최신 세션 정보 재조회 실패", err);
    }

    // 대화 저장
    if (liveSessionId && fullTranscriptRef.current.trim()) {
      try {
        await axios.post(`${BACKEND_URL}/api/chat-session/${liveSessionId}/save-transcript`, {
          transcript: fullTranscriptRef.current
        });
      } catch (err) {
        console.error("🚨 대화 기록 저장 실패", err);
      }
    } else {
      console.warn("⚠️ session_id가 없어 대화 기록 저장을 건너뜁니다.", { chatId, liveSessionId });
    }

    // WebRTC 마이크/캠 안전하게 끄기 (에러 나도 무시)
    try { await hangUp(); } catch (e) { console.warn("오디오 끄기 무시:", e); }
    chatWsRef.current?.close();

    // 세션 완전 종료 처리 (이 호출이 CoffeeChatReport 스켈레톤 row를 생성함 — 빠지면 안 됨!)
    if (liveSessionId) {
      try {
        await axios.post(`${BACKEND_URL}/api/chat-session/end/${liveSessionId}`);
      } catch (err) {
        console.error("🚨 세션 종료 처리 실패", err);
      }
    } else {
      console.error("🚨 session_id를 끝내 찾지 못해 /end 호출을 건너뜁니다. CoffeeChatReport row가 생성되지 않습니다!");
    }

    // AI 리포트/요약 백그라운드 호출
    axios.post(`${BACKEND_URL}/api/chat-session/${chatId}/generate-summary`)
      .catch((err) => console.error("🚨 generate-summary 호출 실패", err));
    axios.post(`${BACKEND_URL}/api/wrap-up/${chatId}`)
      .catch((err) => console.error("🚨 wrap-up 호출 실패", err));
  })();
}, [isMentor, navigate, chatId, session, hangUp]);

  // 타이머 훅
  const { formattedDuration } = useChatTimer(booking, handleEndCall);

  // ════════════════════════════════════════════════════════
  // 4. 기타 useEffect (스크롤, 소켓, STT 등)
  // ════════════════════════════════════════════════════════
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (session?.session_id && fullTranscriptRef.current.trim()) {
        const url = `${BACKEND_URL}/api/chat-session/${session.session_id}/save-transcript`;
        const blob = new Blob([JSON.stringify({ transcript: fullTranscriptRef.current })], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // 안전하게 백그라운드로 마지막 기록 저장
      if (session?.session_id && fullTranscriptRef.current.trim()) {
        axios.post(`${BACKEND_URL}/api/chat-session/${session.session_id}/save-transcript`, {
          transcript: fullTranscriptRef.current
        }).catch(()=>{});
      }
    };
  }, [session]);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chatMessages]);

  useEffect(() => {
    if (llmScrollRef.current) llmScrollRef.current.scrollTop = llmScrollRef.current.scrollHeight;
  }, [llmMessages, llmBuffer]);

  useEffect(() => {
    if (sttScrollRef.current) sttScrollRef.current.scrollTop = sttScrollRef.current.scrollHeight;
  }, [sttLogs, sttMode]);

  // Chat WebSockets
  useEffect(() => {
    if (!userId || !chatId) return;
    const ws = new WebSocket(`${WS_URL}/ws/chat/${chatId}/${userId}`);
    chatWsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Number(data.sender_id) === Number(userId)) return;
        setChatMessages(prev => [...prev, { sender: 'other', name: data.sender_name || '상대방', text: data.message }]);
      } catch (e) {}
    };
    return () => ws.close();
  }, [userId, chatId]);

  // LLM WebSockets
  useEffect(() => {
    if (!userId || !chatId) return;
    const ws = new WebSocket(`${WS_URL}/ws/llm/${chatId}/${userId}`);
    llmWsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chunk') { setLlmStreaming(true); setLlmBuffer(prev => prev + data.text); }
        else if (data.type === 'done') { setLlmStreaming(false); setLlmMessages(prev => [...prev, { sender: 'ai', text: data.text }]); setLlmBuffer(''); }
        else if (data.type === 'error') { setLlmStreaming(false); setLlmMessages(prev => [...prev, { sender: 'ai', text: `❌ 오류: ${data.text}` }]); setLlmBuffer(''); }
        else if (data.type === 'recommended_questions') {
          setIsGeneratingQuestions(false);
          if (Array.isArray(data.questions) && data.questions.length > 0) {
            setRecommendedQuestions(data.questions);
          }
        }
      } catch (e) {}
    };
    return () => ws.close();
  }, [userId, chatId]);

  // STT Logs 처리 (안전망 강화: sttLogs가 null이어도 죽지 않게 보호)
  useEffect(() => {
    const safeSttLogs = sttLogs || [];
    const finals = safeSttLogs.filter(l => l && l.type === 'final');
    if (finals.length <= lastFinalCountRef.current) return;
    
    finals.slice(lastFinalCountRef.current).forEach(log => {
      const line = `${log.speaker}: ${log.text}`; 
      sttBufferRef.current += (sttBufferRef.current ? '\n' : '') + line;
      fullTranscriptRef.current += (fullTranscriptRef.current ? '\n' : '') + line;
    });
    lastFinalCountRef.current = finals.length;
  }, [sttLogs]);

  // 추천 질문 갱신 타이머
  useEffect(() => {
    if (!userId || !chatId) return;
    const countdown = setInterval(() => {
      setNextRefreshIn(prev => (prev <= 1 ? RECOMMEND_INTERVAL_MS / 1000 : prev - 1));
    }, 1000);
    const interval = setInterval(() => {
      const buffer = sttBufferRef.current.trim();
      if (buffer.length < MIN_BUFFER_LENGTH || llmWsRef.current?.readyState !== WebSocket.OPEN) return;
      setIsGeneratingQuestions(true);
      llmWsRef.current.send(JSON.stringify({
        type: 'recommend_questions', conversation: buffer,
        mentor_profile: booking?.mentor_profile || booking?.mentorProfile || '',
        mentee_profile: booking?.user_profile || booking?.userProfile || '',
        preset_questions: booking?.questions || '',
      }));
      sttBufferRef.current = '';
    }, RECOMMEND_INTERVAL_MS);
    return () => {
      clearInterval(countdown);
      clearInterval(interval);
    };
  }, [userId, chatId, booking]);


  // ════════════════════════════════════════════════════════
  // 5. UI 이벤트 핸들러 및 유틸리티
  // ════════════════════════════════════════════════════════
  const handleManualRefresh = useCallback(() => {
    const buffer = sttBufferRef.current.trim();
    if (!buffer || buffer.length < MIN_BUFFER_LENGTH || llmWsRef.current?.readyState !== WebSocket.OPEN) return;
    setIsGeneratingQuestions(true);
    setNextRefreshIn(RECOMMEND_INTERVAL_MS / 1000);
    llmWsRef.current.send(JSON.stringify({
      type: 'recommend_questions', conversation: buffer,
      mentor_profile: booking?.mentor_profile || booking?.mentorProfile || '',
      mentee_profile: booking?.user_profile || booking?.userProfile || '',
      preset_questions: booking?.questions || '',
    }));
    sttBufferRef.current = '';
  }, [booking]);

  const handleLlmSubmit = (e) => {
    e.preventDefault();
    if (!llmInput.trim() || llmStreaming) return;
    const text = llmInput.trim();
    setLlmMessages(prev => [...prev, { sender: 'me', text }]);
    setLlmInput('');
    if (llmWsRef.current?.readyState === WebSocket.OPEN) {
      setLlmStreaming(true);
      setLlmBuffer('');
      llmWsRef.current.send(JSON.stringify({ type: 'question', text, questions: booking?.questions || '' }));
    } else {
      setLlmMessages(prev => [...prev, { sender: 'ai', text: 'AI 연결이 원활하지 않습니다.' }]);
    }
  };

  const handleToggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localVideoRef?.current?.srcObject?.getAudioTracks().forEach(track => track.enabled = !newMuted);
  }, [isMuted, localVideoRef]);

  const handleToggleVideo = useCallback(() => {
    const newOff = !isVideoOff;
    setIsVideoOff(newOff);
    localVideoRef?.current?.srcObject?.getVideoTracks().forEach(track => track.enabled = !newOff);
  }, [isVideoOff, localVideoRef]);

  const handleRemoteVideoPlay = useCallback(() => setIsRemoteConnected(true), []);
  const handleRemoteVideoEmptied = useCallback(() => setIsRemoteConnected(false), []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatMessages(prev => [...prev, { sender: 'me', text }]);
    setChatInput('');
    if (chatWsRef.current?.readyState === WebSocket.OPEN)
      chatWsRef.current.send(JSON.stringify({ sender_id: userId, sender_name: myName, message: text }));
  };

  const cycleSttMode = () => setSttMode(prev => STT_MODES[(STT_MODES.indexOf(prev) + 1) % STT_MODES.length]);
  const sttModeLabel = { hidden: '대화 내역 숨김', preview: '대화 내역 (최신)', expanded: '대화 내역 (전체)' };
  const sttModeNext  = { hidden: '보기', preview: '전체 보기', expanded: '숨기기' };

  const myRole = isMentor ? '호스트 (나)' : '게스트 (나)';
  const theirRole = isMentor ? '게스트' : '호스트';
  const opponentName = isMentor
    ? (booking?.user_name || booking?.userName || '게스트')
    : (booking?.mentor_name || booking?.mentorName || '호스트');
    
  const getInitials = (name) => name?.slice(0, 2) || '??';
  const questions = booking?.questions
    ? booking.questions.split('\n').filter(q => q.trim()).map((q, i) => ({ text: q.replace(/^[-•]\s*/, '').trim(), tag: `질문 ${i + 1}` }))
    : [{ text: '작성된 질문이 없어요', tag: '질문' }];

  const themeStyles = theme === 'dark' ? {
    '--bg-gradient': 'linear-gradient(135deg, #0d1520 0%, #111d2e 50%, #0a1628 100%)',
    '--panel-bg': 'rgba(255,255,255,0.03)', '--panel-border': 'rgba(255,255,255,0.08)',
    '--text-main': '#ffffff', '--text-muted': 'rgba(255,255,255,0.5)',
    '--btn-bg': 'rgba(255,255,255,0.06)', '--btn-active': 'rgba(255,255,255,0.15)',
    '--btn-border': 'rgba(255,255,255,0.06)', '--btn-border-active': 'rgba(255,255,255,0.2)',
    '--chat-overlay': 'rgba(13,21,32,0.97)',
    '--tab-inactive-bg': 'rgba(255,255,255,0.04)', '--tab-active-bg': 'rgba(255,255,255,0.12)',
  } : {
    '--bg-gradient': 'linear-gradient(135deg, #f4f8ff 0%, #e6f0fa 100%)',
    '--panel-bg': '#ffffff', '--panel-border': 'rgba(47, 107, 251, 0.1)',
    '--text-main': '#1a1f27', '--text-muted': '#718096',
    '--btn-bg': '#ffffff', '--btn-active': '#eff6ff',
    '--btn-border': 'rgba(47, 107, 251, 0.2)', '--btn-border-active': '#2f6bfb',
    '--chat-overlay': 'rgba(255,255,255,0.95)',
    '--tab-inactive-bg': 'rgba(0,0,0,0.04)', '--tab-active-bg': '#eff6ff',
  };

  const tabs = [
    { key: 'questions', label: '확정 질문' },
    { key: 'ai',        label: 'AI 추천' },
    { key: 'llm',       label: 'LLM' },
  ];

  // 🌟 (가장 중요) STT 배열들을 합쳐서 에러 없이 화면에 전달할 수 있도록 완벽하게 방어!
  const safeSttLogs = sttLogs || [];
  const safeRestoredLogs = restoredLogs || [];
  const allSttLogs = [...safeRestoredLogs, ...safeSttLogs];

  // ════════════════════════════════════════════════════════
  // 6. 렌더링 영역
  // ════════════════════════════════════════════════════════
  return (
    <div className="h-screen flex flex-col overflow-hidden transition-colors duration-300" style={{ ...themeStyles, background: 'var(--bg-gradient)' }}>
      
      {/* ── 헤더 ── */}
      <header className="flex-shrink-0 relative z-10 flex items-center justify-between px-6 py-3" style={{ borderBottom: '1px solid var(--panel-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold tracking-wide" style={{ color: 'var(--text-main)' }}>Coffee Chat</span>
          <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />LIVE
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full hover:bg-black/10 transition-colors" style={{ color: 'var(--text-main)' }}>
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button onClick={() => setShowTutorial(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-black/10 transition-colors" style={{ color: 'var(--text-muted)' }}>
            <HelpCircle className="w-4 h-4" />
            <span className="text-xs font-medium">가이드</span>
          </button>

          {booking && (
            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              {isMentor ? `${opponentName}님과의 코칭 세션` : `${opponentName}님과의 세션`}
            </span>
          )}
          
          <div data-tutorial="header-timer" className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm" style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}>
            <Clock className="w-4 h-4" style={{ color: 'var(--text-main)' }} />
            <span className="font-mono font-semibold text-sm" style={{ color: 'var(--text-main)' }}>
              {formattedDuration}
            </span>
          </div>
        </div>
      </header>

      {/* ── 바디 ── */}
      <div className="flex-1 min-h-0 flex flex-col px-6 pt-4 pb-4 gap-3">
        <div className="flex-1 min-h-0 flex gap-4">

          {/* 좌측 영역 (비디오 + STT) */}
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            <div data-tutorial="video-area" className={`flex gap-4 transition-all duration-300 ${sttMode === 'expanded' ? 'flex-1 min-h-0' : 'flex-[3] min-h-0'}`}>
              
              {/* 내 화면 */}
              <div className="flex-1 relative rounded-3xl overflow-hidden flex items-center justify-center shadow-lg" style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', backdropFilter: 'blur(20px)' }}>
                <video ref={localVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" style={{ display: isVideoOff ? 'none' : 'block' }} />
                {isVideoOff && (
                  <div className="flex flex-col items-center gap-3 z-10">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl bg-gradient-to-br ${isMentor ? 'from-amber-500 to-red-500' : 'from-blue-500 to-indigo-600'}`}>
                      {getInitials(myName)}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-base" style={{ color: 'var(--text-main)' }}>{myName}</p>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium mt-1 inline-block ${isMentor ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-500'}`}>{myRole}</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md z-10">
                  {isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-white/70" />}
                  <span className="text-xs text-white/70">{isMuted ? '음소거' : `${myName} (${isMentor ? '호스트' : '게스트'})`}</span>
                </div>
              </div>

              {/* 상대방 화면 */}
              <div className="flex-1 relative rounded-3xl overflow-hidden flex items-center justify-center shadow-lg" style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', backdropFilter: 'blur(20px)' }}>
                <video ref={remoteVideoRef} autoPlay playsInline onPlay={handleRemoteVideoPlay} onEmptied={handleRemoteVideoEmptied} className="absolute inset-0 w-full h-full object-cover" style={{ display: isRemoteConnected ? 'block' : 'none' }} />
                {!isRemoteConnected && (
                  <div className="flex flex-col items-center gap-3 z-10">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl bg-gradient-to-br ${isMentor ? 'from-blue-500 to-indigo-600' : 'from-amber-500 to-red-500'}`}>
                      {getInitials(opponentName)}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-base" style={{ color: 'var(--text-main)' }}>{opponentName}</p>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium mt-1 inline-block ${isMentor ? 'bg-blue-500/10 text-blue-500' : 'bg-amber-500/10 text-amber-600'}`}>{theirRole}</span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-md z-10">
                  {isRemoteConnected
                    ? <><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="text-xs text-green-400">연결됨</span></>
                    : <><div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" /><span className="text-xs text-yellow-400">연결 대기 중</span></>}
                </div>
              </div>
            </div>

            {/* STT 영역 */}
            <div data-tutorial="stt-area" className={`flex flex-col transition-all duration-300 ${sttMode === 'expanded' ? 'flex-[2] min-h-0' : 'flex-shrink-0'}`}>
              {sttMode !== 'hidden' && (
                <div className="rounded-2xl p-4 flex flex-col shadow-md overflow-hidden flex-1 min-h-0"
                  style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', backdropFilter: 'blur(12px)', height: sttMode === 'preview' ? '7.5rem' : '100%' }}>
                  <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-semibold" style={{ color: 'var(--text-main)' }}>{sttModeLabel[sttMode]}</span>
                    </div>
                    <button onClick={cycleSttMode} className="text-xs px-2 py-0.5 rounded-full transition-colors hover:bg-blue-500/10" style={{ color: 'var(--text-muted)' }}>
                      {sttModeNext[sttMode]} {sttMode === 'expanded' ? '▼' : '▲'}
                    </button>
                  </div>

                  {/* 미리보기 (최신 2줄) */}
                  {sttMode === 'preview' && (
                    <div className="flex flex-col gap-2 overflow-hidden flex-1 min-h-0">
                      {allSttLogs.length === 0 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>대화가 시작되면 여기에 표시됩니다.</p>}
                      {allSttLogs.slice(-2).map((log, idx) => (
                        <div key={idx} className="flex gap-3 text-sm">
                          <span className={`font-semibold shrink-0 ${log.speaker === myName ? 'text-blue-500' : 'text-amber-500'}`}>{log.speaker}</span>
                          <p className="truncate" style={{ color: log.type === 'interim' ? 'var(--text-muted)' : 'var(--text-main)', fontStyle: log.type === 'interim' ? 'italic' : 'normal' }}>
                            {log.text}{log.type === 'interim' && <span className="inline-block w-1 h-3 bg-current ml-1 animate-pulse" />}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 🌟 전체보기 (스크롤 버그 및 가림 현상 해결) */}
                  {sttMode === 'expanded' && (
                    <div ref={sttScrollRef} className="flex flex-col gap-2 overflow-y-auto pr-2 pb-12 custom-scrollbar flex-1 min-h-0">
                      {allSttLogs.length === 0 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>대화가 시작되면 여기에 표시됩니다.</p>}
                      {allSttLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-3 text-sm">
                          <span className={`font-semibold shrink-0 ${log.speaker === myName ? 'text-blue-500' : 'text-amber-500'}`}>{log.speaker}</span>
                          <p style={{ color: log.type === 'interim' ? 'var(--text-muted)' : 'var(--text-main)', fontStyle: log.type === 'interim' ? 'italic' : 'normal' }}>
                            {log.text}{log.type === 'interim' && <span className="inline-block w-1 h-3 bg-current ml-1 animate-pulse" />}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {sttMode === 'hidden' && (
                <button onClick={cycleSttMode} className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs transition-colors hover:opacity-80 shadow-sm" style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', color: 'var(--text-muted)' }}>
                  <MessageSquare className="w-3.5 h-3.5 text-blue-500" />대화 내역 보기
                </button>
              )}
            </div>
          </div>

          {/* 우측 패널 (통합된 탭 UI) */}
          <div data-tutorial="tab-panel" className="w-80 flex-shrink-0 min-h-0 flex flex-col relative">
            <div className="flex-1 min-h-0 flex flex-col rounded-2xl shadow-md overflow-hidden" style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}>
              
              <div className="flex-shrink-0 flex" style={{ borderBottom: '1px solid var(--panel-border)' }}>
                {tabs.map((tab) => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className="flex-1 py-3 text-xs font-semibold transition-colors duration-150"
                    style={{
                      background: activeTab === tab.key ? 'var(--tab-active-bg)' : 'var(--tab-inactive-bg)',
                      color: activeTab === tab.key ? (tab.key === 'ai' ? '#f59e0b' : '#2f6bfb') : 'var(--text-muted)',
                      borderBottom: activeTab === tab.key ? `2px solid ${tab.key === 'ai' ? '#f59e0b' : '#2f6bfb'}` : '2px solid transparent',
                    }}>
                    {(tab.key === 'ai' || tab.key === 'llm') && <Sparkles className="w-3 h-3 inline mr-1 mb-0.5" />}
                    {tab.label}
                    {tab.key === 'ai' && isGeneratingQuestions && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" />}
                    {tab.key === 'llm' && llmStreaming && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-blue-400 inline-block animate-pulse" />}
                  </button>
                ))}
              </div>

              <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-4">
                
                {/* 1. 확정 질문 탭 */}
                {activeTab === 'questions' && (
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
                    {questions.map((q, i) => (
                      <div key={i} onClick={() => setActiveQuestion(i)}
                        className={`p-3 rounded-xl cursor-pointer text-sm transition-colors flex-shrink-0 ${activeQuestion === i ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-black/5 border border-transparent'}`}
                        style={{ color: 'var(--text-main)' }}>
                        <span className="text-xs text-blue-500 block mb-1 font-semibold">{q.tag}</span>
                        {q.text}
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. AI 추천 질문 탭 */}
                {activeTab === 'ai' && (
                  <>
                    <div className="flex-shrink-0 flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-amber-500">대화 맞춤 질문</span>
                      <div className="flex items-center gap-2">
                        {!isGeneratingQuestions && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{nextRefreshIn}s</span>}
                        {isGeneratingQuestions
                          ? <span className="text-xs text-amber-400 animate-pulse flex items-center gap-1"><Sparkles className="w-3 h-3" /> 생성 중...</span>
                          : <button onClick={handleManualRefresh} disabled={sttBufferRef.current.length < MIN_BUFFER_LENGTH} className="p-1 rounded-lg transition-colors hover:bg-amber-500/10 disabled:opacity-30 disabled:cursor-not-allowed">
                              <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                            </button>}
                      </div>
                    </div>
                    <div className="flex-1 min-h-0 overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
                      {recommendedQuestions.map((q, i) => (
                        <div key={i} onClick={() => setSelectedQuestion(selectedQuestion === q ? null : q)}
                          className={`p-3 rounded-xl text-sm flex items-start gap-2 hover:bg-amber-500/5 transition-colors cursor-pointer flex-shrink-0 border ${selectedQuestion === q ? 'border-amber-500/50 bg-amber-500/10' : 'border-transparent'}`}
                          style={{ background: selectedQuestion === q ? undefined : 'rgba(0,0,0,0.04)', color: 'var(--text-main)' }}>
                          <ChevronRight className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                          <span>{q}</span>
                        </div>
                      ))}
                    </div>
                    {selectedQuestion && (
                      <div className="flex-shrink-0 mt-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                        <p className="text-[10px] text-amber-500 font-semibold mb-1">선택한 질문</p>
                        <p className="text-sm" style={{ color: 'var(--text-main)' }}>{selectedQuestion}</p>
                      </div>
                    )}
                  </>
                )}

                {/* 3. LLM 어시스턴트 탭 */}
                {activeTab === 'llm' && (
                  <>
                    <div ref={llmScrollRef} className="flex-1 min-h-0 overflow-y-auto pr-1 mb-2 flex flex-col gap-2 custom-scrollbar">
                      {llmMessages.map((m, i) => (
                        <div key={i} className={`p-2.5 rounded-xl text-xs max-w-[85%] flex-shrink-0 ${m.sender === 'me' ? 'bg-blue-500 text-white self-end rounded-tr-sm' : 'bg-black/10 self-start rounded-tl-sm'}`} style={m.sender !== 'me' ? { color: 'var(--text-main)' } : {}}>
                          {m.text}
                        </div>
                      ))}
                      {llmStreaming && llmBuffer && (
                        <div className="p-2.5 rounded-xl text-xs max-w-[85%] bg-black/10 self-start rounded-tl-sm flex-shrink-0" style={{ color: 'var(--text-main)' }}>
                          {llmBuffer}<span className="inline-block w-1 h-3 bg-blue-400 ml-1 animate-pulse" />
                        </div>
                      )}
                    </div>
                    <form onSubmit={handleLlmSubmit} className="flex-shrink-0 flex items-center gap-2 relative">
                      <input type="text" value={llmInput} onChange={e => setLlmInput(e.target.value)} placeholder={llmStreaming ? 'AI가 답변을 작성 중입니다...' : 'AI에게 질문하기...'} disabled={llmStreaming} className="w-full bg-black/10 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50" style={{ color: 'var(--text-main)' }} />
                      <button type="submit" disabled={llmStreaming || !llmInput.trim()} className="absolute right-1 w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:bg-gray-500 transition-colors">
                        <Send className="w-3 h-3" />
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>

            {/* 텍스트 채팅창 오버레이 */}
            <div className="absolute inset-0 rounded-2xl flex flex-col transition-all duration-300 ease-in-out"
              style={{
                background: 'var(--chat-overlay)', border: '1px solid var(--panel-border)', backdropFilter: 'blur(20px)',
                transform: showChat ? 'translateY(0)' : 'translateY(100%)', opacity: showChat ? 1 : 0, pointerEvents: showChat ? 'auto' : 'none', zIndex: 20,
              }}>
              <div className="flex-shrink-0 flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--panel-border)' }}>
                <h3 className="font-semibold text-sm text-indigo-400 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> 채팅방</h3>
                <button onClick={() => setShowChat(false)}><X className="w-4 h-4 text-gray-400 hover:text-gray-200 transition-colors" /></button>
              </div>
              <div ref={chatScrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 flex flex-col gap-2 custom-scrollbar">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex flex-col max-w-[85%] flex-shrink-0 ${m.sender === 'me' ? 'self-end items-end' : m.sender === 'system' ? 'self-center' : 'self-start items-start'}`}>
                    {m.sender === 'other' && m.name && <span className="text-[10px] mb-0.5 ml-1" style={{ color: 'var(--text-muted)' }}>{m.name}</span>}
                    <div className={`p-2.5 rounded-xl text-xs ${m.sender === 'me' ? 'bg-indigo-500 text-white rounded-tr-sm' : m.sender === 'system' ? 'bg-transparent text-gray-400 text-[10px]' : 'bg-black/10 rounded-tl-sm'}`} style={m.sender === 'other' ? { color: 'var(--text-main)' } : {}}>
                      {m.text}
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSendMessage} className="flex-shrink-0 flex items-center gap-2 relative px-4 pb-4 pt-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="메시지 입력..." className="w-full bg-black/10 rounded-full px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500" style={{ color: 'var(--text-main)' }} />
                <button type="submit" className="absolute right-5 top-1/2 -translate-y-1/2 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* 하단 외부 컨트롤 바 컴포넌트 래퍼 (튜토리얼 지정) */}
        <div data-tutorial="controls" className="flex justify-center flex-shrink-0">
          <ControlBar
            isMuted={isMuted} handleToggleMute={handleToggleMute}
            isVideoOff={isVideoOff} handleToggleVideo={handleToggleVideo}
            handleEndCall={handleEndCall}
            showChat={showChat} setShowChat={setShowChat}
            setShowSettings={setShowSettings}
          />
        </div>
      </div>

      {/* 모달 및 오버레이 */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
    </div>
  );
}