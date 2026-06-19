import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import usePenaltyData from './usePenaltyData';
const SLOT_STATUS = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
};

// ─────────────────────────────────────────────────────────────────────────────
// 튜토리얼 스텝 정의
// ─────────────────────────────────────────────────────────────────────────────
const TUTORIAL_KEY = 'schedule_tutorial_done';

const STEPS = [
  {
    id: 'intro',
    title: '📅 일정 관리 페이지예요',
    description: '호스트로서 게스트가 예약할 수 있는 시간을 직접 설정하는 곳이에요.\n각 기능을 하나씩 살펴볼게요!',
    target: null,
  },
  {
    id: 'legend',
    title: '🎨 색상 범례',
    description: '시간 슬롯은 3가지 색으로 구분돼요.\n\n• 🔵 파란색 — 내가 설정한 가능 시간\n• 🔴 빨간색 — 이미 예약이 확정된 시간 (취소 시 패널티)\n• ⬜ 회색 — 이미 지난 시간 (설정 불가)',
    target: '[data-tour="legend"]',
    position: 'bottom',
    preview: 'legend',
  },
  {
    id: 'calendar',
    title: '🗓️ 날짜 선택 캘린더',
    description: '원하는 날짜를 클릭해서 선택하세요.\n\n• 🔵 파란 점 — 가능 시간이 설정된 날\n• 🔴 빨간 점 — 이미 예약된 날\n\n지난 날짜는 회색으로 비활성화돼요.',
    target: '[data-tour="calendar"]',
    position: 'right',
    preview: 'calendar',
  },
  {
    id: 'timeslots',
    title: '⏰ 시간 슬롯 선택',
    description: '클릭 한 번으로 30분 단위 시간대를 켜고 끌 수 있어요.\n\n• 빈 슬롯 클릭 → 🔵 가능 시간으로 등록\n• 파란 슬롯 다시 클릭 → 취소\n• 빨간 슬롯(예약된 시간) 클릭 → 패널티 경고 후 취소 가능',
    target: '[data-tour="timeslots"]',
    position: 'left',
    preview: 'timeslots',
  },
  {
    id: 'save',
    title: '💾 저장 버튼',
    description: '시간 슬롯을 모두 설정했다면 이 버튼을 눌러 저장하세요.\n\n설정한 모든 날짜의 가능 시간이 한 번에 저장되고, 게스트가 예약할 수 있게 됩니다.',
    target: '[data-tour="save"]',
    position: 'top',
    preview: 'save',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 스텝별 미니 프리뷰
// ─────────────────────────────────────────────────────────────────────────────
function StepPreview({ type }) {
  if (!type) return null;
  const base = 'mt-3 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs';

  if (type === 'legend') return (
    <div className={base}>
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">색상 예시</p>
      <div className="flex gap-2">
        <div className="flex-1 py-2 text-center rounded-lg bg-[#4a90e2] text-white font-bold text-[11px]">09:00<br /><span className="text-[9px] font-normal">가능</span></div>
        <div className="flex-1 py-2 text-center rounded-lg bg-red-100 text-red-700 border border-red-300 font-bold text-[11px]">10:00<br /><span className="text-[9px]">예약됨</span></div>
        <div className="flex-1 py-2 text-center rounded-lg bg-gray-100 text-gray-300 border border-gray-200 line-through text-[11px]">08:00<br /><span className="text-[9px] no-underline" style={{textDecoration:'none'}}>지남</span></div>
      </div>
    </div>
  );

  if (type === 'calendar') return (
    <div className={base}>
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">캘린더 점 예시</p>
      <div className="flex gap-4 items-center justify-center py-1">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] font-bold text-gray-700 w-7 h-7 flex items-center justify-center rounded-full bg-blue-500 text-white">14</span>
          <div className="flex gap-0.5">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
          </div>
        </div>
        <div className="text-[10px] text-gray-500 leading-relaxed">
          🔵 파란 점 = 가능 시간<br />🔴 빨간 점 = 예약된 시간
        </div>
      </div>
    </div>
  );

  if (type === 'timeslots') return (
    <div className={base}>
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">슬롯 클릭 예시</p>
      <div className="grid grid-cols-4 gap-1.5">
        {['09:00','09:30','10:00','10:30'].map((t, i) => (
          <div key={t} className={`py-1.5 text-center rounded text-[10px] font-bold border ${
            i === 1 ? 'bg-[#4a90e2] text-white border-[#4a90e2]' :
            i === 2 ? 'bg-red-100 text-red-700 border-red-300' :
            'bg-white text-gray-600 border-gray-300'
          }`}>{t}</div>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-2">빈 슬롯 클릭 → 파란색으로 등록</p>
    </div>
  );

  if (type === 'save') return (
    <div className={base}>
      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-2">저장 버튼</p>
      <div className="w-full py-2.5 rounded-lg bg-[#1a2332] text-white text-center text-[11px] font-bold">
        모든 일정 한 번에 저장하기
      </div>
      <p className="text-[10px] text-gray-400 mt-2">저장 전까지 변경사항은 반영되지 않아요!</p>
    </div>
  );

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 튜토리얼 오버레이
// ─────────────────────────────────────────────────────────────────────────────
function TutorialOverlay({ onClose }) {
  const [step, setStep] = useState(0);
  const [neverShow, setNeverShow] = useState(false);
  const [spotlightStyle, setSpotlightStyle] = useState(null);
  const [tooltipStyle, setTooltipStyle] = useState({});

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast  = step === STEPS.length - 1;

  // 스크롤 잠금
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // spotlight + 툴팁 위치 계산
  useEffect(() => {
    if (!current.target) {
      setSpotlightStyle(null);
      setTooltipStyle({});
      return;
    }
    const calc = () => {
      const el = document.querySelector(current.target);
      if (!el) { setTimeout(calc, 80); return; }

      const rect = el.getBoundingClientRect();
      const pad  = 10;
      setSpotlightStyle({
        top: rect.top - pad, left: rect.left - pad,
        width: rect.width + pad * 2, height: rect.height + pad * 2,
      });

      const tipW = 300;
      const tipH = current.preview ? 320 : 200;
      const gap  = 16;
      let s = {};
      if (current.position === 'right')  s = { top: Math.max(8, rect.top + rect.height / 2 - tipH / 2), left: rect.right + gap };
      if (current.position === 'left')   s = { top: Math.max(8, rect.top + rect.height / 2 - tipH / 2), left: rect.left - tipW - gap };
      if (current.position === 'bottom') s = { top: rect.bottom + gap, left: rect.left + rect.width / 2 - tipW / 2 };
      if (current.position === 'top')    s = { top: rect.top - tipH - gap, left: rect.left + rect.width / 2 - tipW / 2 };
      s.left = Math.max(8, Math.min(s.left, window.innerWidth  - tipW - 8));
      s.top  = Math.max(8, Math.min(s.top,  window.innerHeight - tipH - 8));
      setTooltipStyle(s);
    };
    calc();
  }, [step, current]);

  const handleClose = (markDone = false) => {
    if (markDone || neverShow) localStorage.setItem(TUTORIAL_KEY, '1');
    onClose();
  };

  const isCenterModal = !current.target;

  const StepDots = ({ small }) => (
    <div className="flex items-center gap-1.5">
      {STEPS.map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${small ? 'h-1' : 'h-1.5'}`}
          style={{ width: i === step ? (small ? '14px' : '20px') : (small ? '4px' : '6px'), background: i === step ? '#2f6bfb' : '#e2e8f0' }} />
      ))}
    </div>
  );

  const NavRow = ({ small }) => (
    <div className="flex gap-2 mt-3">
      {!isFirst && (
        <button onClick={() => setStep(s => s - 1)}
          className={`flex items-center gap-1 rounded-xl font-medium border border-gray-200 text-gray-500 hover:bg-gray-100 transition ${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'}`}>
          <ChevronLeft className={small ? 'w-3.5 h-3.5' : 'w-4 h-4'} /> 이전
        </button>
      )}
      <button onClick={() => isLast ? handleClose(true) : setStep(s => s + 1)}
        className={`flex-1 flex items-center justify-center gap-1 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:opacity-90 transition shadow ${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'}`}>
        {isLast ? '시작하기 🚀' : <><span>다음</span><ChevronRight className={small ? 'w-3.5 h-3.5' : 'w-4 h-4'} /></>}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100]">
      {/* 어두운 배경 + spotlight 구멍 */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="sch-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotlightStyle && (
              <rect x={spotlightStyle.left} y={spotlightStyle.top}
                width={spotlightStyle.width} height={spotlightStyle.height} rx="14" fill="black" />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#sch-mask)" />
      </svg>

      {/* 파란 spotlight 테두리 */}
      {spotlightStyle && (
        <div className="absolute rounded-2xl pointer-events-none transition-all duration-300"
          style={{
            top: spotlightStyle.top, left: spotlightStyle.left,
            width: spotlightStyle.width, height: spotlightStyle.height,
            boxShadow: '0 0 0 3px rgba(47,107,251,0.9), 0 0 32px rgba(47,107,251,0.35)',
          }} />
      )}

      {/* 중앙 모달 */}
      {isCenterModal && (
        <div className="absolute inset-0 flex items-center justify-center" onClick={e => e.stopPropagation()}>
          <div className="w-[400px] bg-white rounded-3xl p-8 shadow-2xl border border-blue-100 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <button onClick={() => handleClose(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h2 className="text-xl font-black text-[#1a2332] mb-2">{current.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{current.description}</p>
            </div>
            <StepDots />
            {isLast && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={neverShow} onChange={e => setNeverShow(e.target.checked)} className="w-4 h-4 accent-blue-500" />
                <span className="text-xs text-gray-400">다음에 접속할 때 이 가이드를 보지 않기</span>
              </label>
            )}
            <NavRow />
            {!isLast && (
              <button onClick={() => handleClose(false)} className="text-xs text-center text-gray-400 hover:text-gray-500 transition">
                건너뛰기
              </button>
            )}
          </div>
        </div>
      )}

      {/* 툴팁 말풍선 */}
      {!isCenterModal && (
        <div className="absolute rounded-2xl shadow-2xl bg-white flex flex-col overflow-hidden transition-all duration-300"
          style={{ ...tooltipStyle, width: '300px', border: '1px solid rgba(47,107,251,0.12)' }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-1">
            <h3 className="font-black text-sm text-[#1a2332] leading-snug">{current.title}</h3>
            <button onClick={() => handleClose(false)} className="p-1 rounded-full hover:bg-gray-100 text-gray-400 flex-shrink-0 transition">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-line px-4">{current.description}</p>
          <div className="px-4">
            <StepPreview type={current.preview} />
          </div>
          <div className="px-4 pt-2 pb-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <StepDots small />
              <span className="text-[10px] text-gray-400">{step + 1} / {STEPS.length}</span>
            </div>
            <NavRow small />
            <button onClick={() => handleClose(false)} className="text-[10px] text-center text-gray-400 hover:text-gray-500 transition">
              건너뛰기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScheduleManager 본체
// ─────────────────────────────────────────────────────────────────────────────
export default function ScheduleManager() {
  const [date, setDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [realMentorId, setRealMentorId] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);

  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';
  const penaltyData = usePenaltyData(realMentorId, BACKEND_URL) || {};
  const formatDate = (d) => {
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMyId = () => {
    let savedId = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('user_id');
    if (!savedId || savedId === 'null' || savedId === 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          savedId = payload.user_id;
          if (savedId) localStorage.setItem('userId', savedId);
        } catch (e) {}
      }
    }
    return savedId ? parseInt(savedId.toString().replace(/[^0-9]/g, ''), 10) : null;
  };

  useEffect(() => {
    const fetchSchedule = async () => {
      const uid = getMyId();
      if (!uid) { alert('로그인 세션이 만료되었습니다.'); navigate('/login'); return; }
      try {
        setInitialLoading(true);
        const mentorsRes = await axios.get(`${BACKEND_URL}/api/mentors`);
        const myMentor   = mentorsRes.data.find(m => parseInt(m.user_id, 10) === uid);
        if (!myMentor) { alert('호스트로 등록된 정보가 없습니다.'); navigate('/'); return; }
        const mid = myMentor.id;
        setRealMentorId(mid);
        const res = await axios.get(`${BACKEND_URL}/api/mentor/availability/${mid}`);
        setScheduleData(res.data);
      } catch (e) {
        console.error('일정 불러오기 실패:', e);
      } finally {
        setInitialLoading(false);
        // 최초 방문 시 튜토리얼 자동 실행
        if (!localStorage.getItem(TUTORIAL_KEY)) {
          setTimeout(() => setShowTutorial(true), 300);
        }
      }
    };
    fetchSchedule();
  }, [navigate, BACKEND_URL]);

  const [penaltyModal, setPenaltyModal] = useState({ open: false, time: null, penaltyLoading: false });

  const currentDateKey = formatDate(date);
  const now            = new Date();
  const todayKey       = formatDate(now);
  const nowMinutes     = now.getHours() * 60 + now.getMinutes();
  const isSelectedDatePast = currentDateKey < todayKey;

  const isSlotDisabled = (time) => {
    if (currentDateKey < todayKey) return true;
    if (currentDateKey === todayKey) {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m <= nowMinutes;
    }
    return false;
  };

  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour   = Math.floor(i / 2).toString().padStart(2, '0');
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour}:${minute}`;
  });

  const currentDaySlots = scheduleData[currentDateKey] || {};

  const toggleSlot = (time) => {
    if (isSlotDisabled(time)) return;
    const rawStatus = currentDaySlots[time];
    const status    = rawStatus ? rawStatus.toString().toLowerCase().trim() : null;
    if (status === 'booked' || status === SLOT_STATUS.BOOKED) {
      setPenaltyModal({ open: true, time, penaltyLoading: false });
      return;
    }
    setScheduleData(prev => {
      const day = { ...(prev[currentDateKey] || {}) };
      if (day[time]) { delete day[time]; } else { day[time] = SLOT_STATUS.AVAILABLE; }
      return { ...prev, [currentDateKey]: day };
    });
  };

  const confirmPenaltyCancel = async () => {
    const { time } = penaltyModal;
    if (!realMentorId) return;
    setPenaltyModal(prev => ({ ...prev, penaltyLoading: true }));
    try {
      await axios.post(`${BACKEND_URL}/api/mentor/penalty`, {
        mentor_id: realMentorId, date: currentDateKey, time, reason: 'mentor_cancelled_booked_slot',
      });
      setScheduleData(prev => {
        const day = { ...(prev[currentDateKey] || {}) };
        delete day[time];
        return { ...prev, [currentDateKey]: day };
      });
      alert(`⚠️ ${currentDateKey} ${time} 슬롯이 취소되었습니다. 패널티가 부여되었습니다.`);
    } catch (e) {
      alert('처리에 실패했습니다.');
    } finally {
      setPenaltyModal({ open: false, time: null, penaltyLoading: false });
    }
  };

  const handleSaveAll = async () => {
    if (!realMentorId) { alert('호스트 정보를 확인할 수 없습니다.'); return; }
    setLoading(true);
    const availableOnly = {};
    for (const [dateKey, slots] of Object.entries(scheduleData)) {
      const times = Object.entries(slots)
        .filter(([, s]) => s && s.toString().toLowerCase().trim() === 'available')
        .map(([t]) => t).sort();
      if (times.length > 0) availableOnly[dateKey] = times;
    }
    try {
      await axios.post(`${BACKEND_URL}/api/mentor/availability/bulk`, {
        mentor_id: realMentorId, schedules: availableOnly,
      });
      alert('🎉 모든 일정이 성공적으로 DB에 저장되었습니다!');
    } catch (e) {
      const msg = e.response?.data?.detail || '저장에 실패했습니다.';
      alert(`❌ 저장 실패: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const getSlotStyle = (time) => {
    if (isSlotDisabled(time)) return 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed line-through';
    const rawStatus = currentDaySlots[time];
    const status    = rawStatus ? rawStatus.toString().toLowerCase().trim() : null;
    if (status === 'booked')     return 'bg-red-100 text-red-700 border-red-300 font-bold cursor-pointer hover:bg-red-200';
    if (status === 'available')  return 'bg-[#4a90e2] text-white border-[#4a90e2] font-bold hover:bg-[#357abd]';
    return 'bg-white text-gray-700 border-gray-300 hover:border-[#4a90e2] hover:bg-blue-50';
  };

  const tileContent = ({ date: tileDate }) => {
    const dateKey = formatDate(tileDate);
    if (dateKey < todayKey) return null;
    
    const slots   = scheduleData[dateKey] || {};
    const entries = Object.entries(slots);
    const hasAvailable = entries.some(([t, s]) => {
      if (dateKey === todayKey && isSlotDisabled(t)) return false;
      return s && s.toString().toLowerCase().trim() === 'available';
    });
    
    const hasBooked = entries.some(([t, s]) => {
      if (dateKey === todayKey && isSlotDisabled(t)) return false;
      return s && s.toString().toLowerCase().trim() === 'booked';
    });

    // 🌟 [추가됨] 해당 날짜에 패널티 내역이 있는지 확인
    const hasPenalty = penaltyData[dateKey] && penaltyData[dateKey].length > 0;

    return (
      <div className="flex justify-center gap-0.5 mt-1">
        {hasAvailable && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
        {hasBooked    && <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
        {/* 🌟 [추가됨] 패널티가 있으면 노란색/주황색 점 표시 */}
        {hasPenalty   && <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" title="패널티 발생일" />}
      </div>
    );
  };

  const availableCount = Object.entries(currentDaySlots).filter(([t, s]) =>
    s && s.toString().toLowerCase().trim() === 'available' && !isSlotDisabled(t)).length;
  const bookedCount = Object.entries(currentDaySlots).filter(([t, s]) =>
    s && s.toString().toLowerCase().trim() === 'booked' && !isSlotDisabled(t)).length;

  if (initialLoading) {
    return (
      <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">스케줄 정보를 안전하게 동기화하는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-gray-200">

        {/* ── 헤더 ── */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-[#1a2332]">티타임 일정 관리</h2>
          {/* 가이드 보기 버튼 */}
          <button
            onClick={() => setShowTutorial(true)}
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition shadow-sm"
          >
            <HelpCircle className="w-4 h-4" /> 가이드 보기
          </button>
        </div>

        {/* ── 범례 — data-tour ── */}
        {/* ── 범례 — data-tour ── */}
        <div data-tour="legend" className="flex flex-wrap gap-4 mb-6 text-sm p-3 rounded-xl bg-gray-50 border border-gray-100 w-fit">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-[#4a90e2]" />
            가능 시간
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-red-300" />
            예약 확정
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded border border-gray-200 bg-gray-100" />
            지난 시간
          </span>
          {/* 🌟 [추가됨] 패널티 범례 */}
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-amber-500" />
            패널티 발생일
          </span>
        </div>
        <div className="flex flex-col md:flex-row gap-8">

          {/* ── 캘린더 — data-tour ── */}
          <div className="w-full md:w-1/3">
            <h3 className="font-semibold mb-3">날짜 선택</h3>
            <div data-tour="calendar">
              <Calendar
                onChange={setDate}
                value={date}
                locale="en-US"
                calendarType="gregory"
                className="w-full rounded-lg border-gray-200"
                tileContent={tileContent}
                tileDisabled={({ date: tileDate }) => formatDate(tileDate) < todayKey}
              />
            </div>
          </div>

          {/* ── 슬롯 + 저장 ── */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">{currentDateKey} 가능한 시간</h3>
              <div className="flex gap-3 text-sm text-gray-500">
                {isSelectedDatePast ? (
                  <span className="text-gray-400 italic">지난 날짜 — 수정 불가</span>
                ) : (
                  <>
                    <span>가능: <strong className="text-blue-600">{availableCount}</strong>개</span>
                    <span>예약: <strong className="text-red-500">{bookedCount}</strong>개</span>
                  </>
                )}
              </div>
            </div>

            {/* 시간 슬롯 — data-tour */}
            <div data-tour="timeslots" className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-6">
              {timeSlots.map((time) => {
                const disabled  = isSlotDisabled(time);
                const rawStatus = currentDaySlots[time];
                const isBooked  = rawStatus && rawStatus.toString().toLowerCase().trim() === 'booked';
                return (
                  <button
                    key={time}
                    onClick={() => toggleSlot(time)}
                    disabled={disabled}
                    className={`py-2 px-1 text-xs sm:text-sm rounded border transition-colors ${getSlotStyle(time)}`}
                  >
                    {time}
                    {isBooked && !disabled && <span className="block text-[9px] leading-tight">예약됨</span>}
                  </button>
                );
              })}
            </div>

            {/* 저장 버튼 — data-tour */}
            <div data-tour="save">
              <button
                onClick={handleSaveAll}
                disabled={loading}
                className={`w-full py-4 rounded-lg font-bold transition ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1a2332] text-white hover:bg-black'
                }`}
              >
                {loading ? '모든 일정 한 번에 저장하는 중...' : '모든 일정 한 번에 저장하기'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 패널티 모달 ── */}
      {penaltyModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl">
            <h3 className="text-base font-bold text-[#1a2332] mb-2">⚠️ 예약된 슬롯 취소</h3>
            <p className="text-sm text-gray-500 mb-4">
              <strong className="text-red-500">{penaltyModal.time}</strong> 슬롯은 이미 예약이 확정된 시간이에요.<br />
              취소 시 <strong>패널티</strong>가 부여됩니다. 계속하시겠어요?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setPenaltyModal({ open: false, time: null, penaltyLoading: false })}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition">
                아니오
              </button>
              <button onClick={confirmPenaltyCancel} disabled={penaltyModal.penaltyLoading}
                className="flex-1 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50">
                {penaltyModal.penaltyLoading ? '처리 중...' : '패널티 감수 후 취소'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 튜토리얼 오버레이 ── */}
      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
    </>
  );
}