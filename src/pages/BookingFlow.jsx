import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Clock,
  Coffee,
  Check,
  ChevronRight,
  HelpCircle,
  X
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import axios from 'axios';
import 'react-day-picker/dist/style.css';

import PaymentSection from '../components/PaymentSection';

// ── 튜토리얼 설정 ────────────────────────────────────
const TUTORIAL_KEY = 'booking_flow_ai_tutorial_done';

const STEPS = [
  {
    id: 'ai-helper-intro',
    title: 'AI 질문 도우미 활용하기',
    description: '어떤 질문을 해야 할지 막막하시다면 주목하세요!\nAI가 내 고민에 맞는 맞춤형 커피챗 질문 리스트를 생성해 드립니다.',
    target: '[data-tour="ai-helper"]',
  },
  {
    id: 'ai-memo',
    title: '간단한 메모 작성',
    description: '멘토링 받고 싶은 주제, 현재 직무 고민이나 궁금한 점들을 여기에 자유롭게 적어보세요.',
    target: 'textarea[placeholder*="메모하세요"]',
  },
  {
    id: 'ai-generate-btn',
    title: '질문 추천받기',
    description: '작성을 완료하고 이 버튼을 누르면, AI가 분석하여 정돈된 인터뷰 가이드라인 질문을 뽑아냅니다.',
    target: 'button[data-tour-btn="generate"]',
  },
  {
    id: 'final-questions',
    title: '확정 질문지 저장소',
    description: '추천받은 질문 중 마음에 드는 질문 옆의 [추가]를 누르면 여기에 등록됩니다.\n물론 직접 수정하거나 추가 내용을 타이핑하셔도 좋습니다!',
    target: '[data-tour="final-textarea"]',
  }
];

export default function BookingFlow() {
  const { mentorId } = useParams();
  const navigate = useNavigate();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  // ── 포커싱 스크롤을 위한 Ref 선언 ──────────────────────
  const stepTargetRef = useRef(null);

  // ── 상태 관리 ────────────────────────────────────
  const [mentor, setMentor] = useState(null);
  const [isLoadingMentor, setIsLoadingMentor] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [questions, setQuestions] = useState('');
  const [memo, setMemo] = useState('');
  const [availabilityData, setAvailabilityData] = useState({});
  const [availableTimes, setAvailableTimes] = useState([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedList, setRecommendedList] = useState([]);
  const [paymentOrderId, setPaymentOrderId] = useState('');

  // ── 튜토리얼 전용 상태 ─────────────────────────────
  const [showTutorial, setShowTutorial] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [maskRect, setMaskRect] = useState({ x: 0, y: 0, width: 0, height: 0, padding: 8 });
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0, placement: 'bottom' });

  // ── API 및 비즈니스 로직 ───────────────────────────
  const fetchMentorDetail = async (id) => {
    const { data } = await axios.get(`${BACKEND_URL}/api/mentors/${id}`);
    return data;
  };

  const fetchAvailability = async (id) => {
    const { data } = await axios.get(`${BACKEND_URL}/api/mentor/availability/${id}`);
    return data;
  };

  const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const getSelectedDateKey = () => {
    if (!selectedDate) return null;
    return [
      selectedDate.getFullYear(),
      String(selectedDate.getMonth() + 1).padStart(2, '0'),
      String(selectedDate.getDate()).padStart(2, '0')
    ].join('-');
  };

  const getCleanUserId = () => {
    let finalUserId =
      localStorage.getItem('userId') ||
      localStorage.getItem('id') ||
      localStorage.getItem('user_id');

    if (!finalUserId || finalUserId === 'null' || finalUserId === 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          finalUserId = payload.user_id || payload.id;
          if (finalUserId) {
            localStorage.setItem('userId', finalUserId);
          }
        } catch (e) {
          console.error('토큰 디코딩 실패:', e);
        }
      }
    }
    return parseInt(String(finalUserId).replace(/[^0-9]/g, ''), 10);
  };

  const getMentorPrice = () => {
    const rawPrice = mentor?.price || mentor?.coffeechat_price || 15000;
    return Number(String(rawPrice).replace(/[^0-9]/g, '')) || 15000;
  };

  const handlePaymentFinalize = async () => {
    const cleanUserId = getCleanUserId();
    const dateKey = getSelectedDateKey();

    if (!cleanUserId || isNaN(cleanUserId)) {
      alert('로그인 정보가 없습니다. 다시 로그인해주세요.');
      navigate('/login');
      return;
    }

    if (!dateKey || !selectedTime) {
      alert('예약 날짜와 시간을 다시 선택해주세요.');
      return;
    }

    try {
      await axios.post(`${BACKEND_URL}/api/booking/create`, {
        mentorId: parseInt(mentorId, 10),
        userId: cleanUserId,
        date: dateKey,
        time: selectedTime,
        questions
      });

      alert('예약 신청 및 결제가 완료되었습니다! 호스트가 수락하면 최종 확정됩니다.');
      navigate('/dashboard'); 
    } catch (err) {
      console.error('최종 예약 생성 실패:', err);
      alert('결제는 완료됐으나 예약 생성에 실패했습니다. 관리자에게 문의해주세요.');
    }
  };

  // ── 데이터 로드 Effects ─────────────────────────────
  useEffect(() => {
    if (!mentorId) return;

    const loadMentorData = async () => {
      setIsLoadingMentor(true);
      try {
        const data = await fetchMentorDetail(mentorId);
        setMentor(data);
      } catch (err) {
        console.error('호스트 정보 로드 실패:', err);
      } finally {
        setIsLoadingMentor(false);
      }
    };

    loadMentorData();
  }, [mentorId]);

  useEffect(() => {
    if (!mentorId) return;

    const loadAvailability = async () => {
      setIsLoadingCalendar(true);
      try {
        const data = await fetchAvailability(mentorId);
        setAvailabilityData(data);
      } catch (err) {
        console.error('가능 시간 로드 실패:', err);
      } finally {
        setIsLoadingCalendar(false);
      }
    };

    loadAvailability();
  }, [mentorId]);

  useEffect(() => {
    setAvailableTimes([]);
    setSelectedTime('');

    if (!selectedDate) return;

    const dateKey = getSelectedDateKey();
    const slotsForDate = availabilityData[dateKey] || {};
    const today = new Date();

    const isToday =
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate();

    const nowMinutes = today.getHours() * 60 + today.getMinutes();

    const times = Object.entries(slotsForDate)
      .filter(([, rawStatus]) => {
        const status = rawStatus ? rawStatus.toString().toLowerCase().trim() : '';
        return status === 'available';
      })
      .map(([time]) => time.trim())
      .filter((time) => {
        if (isToday && timeToMinutes(time) <= nowMinutes) return false;
        return true;
      })
      .sort();

    setAvailableTimes(times);
  }, [selectedDate, availabilityData]);

  useEffect(() => {
    if (currentStep === 3 && !paymentOrderId) {
      setPaymentOrderId(`order_${Date.now()}`);
    }
  }, [currentStep, paymentOrderId]);

// ── ⭐ 핵심 기능: 스텝이 변경되면 무조건 브라우저 최상단으로 강제 스크롤 ──
useEffect(() => {
  // 즉시 스크롤 위치를 0,0으로 강제 고정합니다. (즉각 반응)
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'auto' // 'smooth' 대신 'auto'를 쓰면 충돌 없이 즉시 위로 올라갑니다.
  });

  // DOM 렌더링 지연에 대응하기 위해 이중 안전장치로 한 번 더 실행합니다.
  const timer = setTimeout(() => {
    window.scrollTo(0, 0);
  }, 10);

  return () => clearTimeout(timer);
}, [currentStep]);

  const disabledDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [
      { before: today },
      (date) => {
        const dateKey = [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, '0'),
          String(date.getDate()).padStart(2, '0')
        ].join('-');

        const slotsForDate = availabilityData[dateKey] || {};
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        const isToday =
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() &&
          date.getDate() === now.getDate();

        const hasAvailable = Object.entries(slotsForDate).some(([time, rawStatus]) => {
          const status = rawStatus ? rawStatus.toString().toLowerCase().trim() : '';
          if (status !== 'available') return false;
          if (isToday && timeToMinutes(time.trim()) <= nowMinutes) return false;
          return true;
        });

        return !hasAvailable;
      }
    ];
  }, [availabilityData]);

  // ── 핸들러 함수 ────────────────────────────────────
  const generateAIQuestions = async () => {
    if (!memo.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/ai/generate-questions`, {
        memo
      });

      const questionsArray = response.data.aiQuestions
        .split('\n')
        .filter((q) => q.trim() !== '');

      setRecommendedList(questionsArray);
    } catch (err) {
      console.error('AI 질문 생성 실패:', err);
      alert('AI 질문 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestionToFinal = (q) => {
    const cleanedQuestion = q.replace(/^[0-9.]+\s*/, '');
    setQuestions((prev) =>
      prev ? `${prev}\n- ${cleanedQuestion}` : `- ${cleanedQuestion}`
    );
  };

  const handleNext = () => {
    if (currentStep === 1 && selectedDate && selectedTime) {
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2 && questions.trim()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // ── 튜토리얼 위치 제어 로직 ───────────────────────────
  const updateMaskAndTooltip = useCallback(() => {
    if (!showTutorial) return;
    const currentStepData = STEPS[stepIndex];
    if (!currentStepData || !currentStepData.target) {
      setMaskRect({ x: 0, y: 0, width: 0, height: 0, padding: 0 });
      setTooltipPos({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 160, placement: 'center' });
      return;
    }

    const el = document.querySelector(currentStepData.target);
    if (!el) {
      setTimeout(updateMaskAndTooltip, 100);
      return;
    }

    const rect = el.getBoundingClientRect();
    const pad = currentStepData.id === 'ai-helper-intro' ? 12 : 6;

    const newMask = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
      padding: pad,
    };
    setMaskRect(newMask);

    let tTop = newMask.y + newMask.height + newMask.padding + 12;
    let tLeft = newMask.x + (newMask.width / 2) - 160; 
    let placement = 'bottom';

    if (tTop + 200 > window.innerHeight) {
      tTop = newMask.y - newMask.padding - 180;
      placement = 'top';
    }
    if (tLeft < 16) tLeft = 16;
    if (tLeft + 320 > window.innerWidth) tLeft = window.innerWidth - 336;

    setTooltipPos({ top: tTop, left: tLeft, placement });
  }, [showTutorial, stepIndex]);

  useEffect(() => {
    if (currentStep === 2) {
      const done = localStorage.getItem(TUTORIAL_KEY);
      if (!done) {
        setShowTutorial(true);
        setStepIndex(0);
      }
    } else {
      setShowTutorial(false);
    }
  }, [currentStep]);

  useEffect(() => {
    if (showTutorial) {
      updateMaskAndTooltip();
      window.addEventListener('resize', updateMaskAndTooltip);
      window.addEventListener('scroll', updateMaskAndTooltip, true);
    }
    return () => {
      window.removeEventListener('resize', updateMaskAndTooltip);
      window.removeEventListener('scroll', updateMaskAndTooltip, true);
    };
  }, [showTutorial, updateMaskAndTooltip]);

  const closeTutorial = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setShowTutorial(false);
  };

  // ── 렌더링 ────────────────────────────────────
  if (isLoadingMentor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-semibold">
        호스트 정보를 불러오는 중입니다...
      </div>
    );
  }

  return (
    /* 전체 브라우저단 레이아웃 스크롤 전면 허용 */
    <div className="min-h-screen w-screen bg-gradient-to-br from-gray-50 to-blue-50 relative select-none flex flex-col">
      
      {/* 🧭 상단 네비 바 */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            to={`/mentors/apply/${mentorId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            호스트 프로필로 돌아가기
          </Link>

          {currentStep === 2 && (
            <button 
              onClick={() => { setShowTutorial(true); setStepIndex(0); }}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition shadow-sm"
            >
              <HelpCircle className="w-4 h-4" /> 가이드 다시 보기
            </button>
          )}
        </div>
      </div>

      {/* 📦 메인 콘텐츠 바디 스크롤 타겟 컨테이너 */}
      <div ref={stepTargetRef} className="max-w-7xl w-full mx-auto px-6 py-8 flex-1 flex flex-col gap-6">
        
        {/* 📊 스텝 바 인디케이터 */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`flex items-center gap-3 ${currentStep >= step ? 'opacity-100' : 'opacity-40'}`}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      currentStep > step
                        ? 'bg-green-500 text-white'
                        : currentStep === step
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-110'
                          : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {currentStep > step ? <Check className="w-5 h-5" /> : step}
                  </div>
                  <span className={`text-sm font-semibold ${currentStep >= step ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step === 1 ? '날짜/시간' : step === 2 ? '질문지' : '결제'}
                  </span>
                </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 rounded-full ${currentStep > step ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 🔲 메인 2분할 레이아웃 그리드 (높이 락 해제, 가변 크기 모드) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* 좌측 메인 작업 영역 */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* ── STEP 1: 날짜/시간 선택 ── */}
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-900">날짜 및 시간 선택</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 달력 */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">날짜 선택</h3>
                    <div className="flex justify-center bg-gray-50 rounded-xl p-2 border border-gray-100">
                      {isLoadingCalendar ? (
                        <div className="flex flex-col items-center py-12 gap-3">
                          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <p className="text-sm text-gray-500">가능 시간을 조회하는 중...</p>
                        </div>
                      ) : (
                        <DayPicker
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={disabledDays}
                          defaultMonth={new Date()}
                          className="border-0 m-0"
                        />
                      )}
                    </div>
                  </div>

                  {/* 시간 선택 */}
                  <div className="flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      {selectedDate ? (
                        `${selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 가능 시간`
                      ) : (
                        "날짜를 선택해 주세요"
                      )}
                    </h3>

                    {selectedDate ? (
                      availableTimes.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-[340px] overflow-y-auto">
                          {availableTimes.map((time) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              className={`p-3 rounded-xl border-2 transition text-sm font-semibold shadow-sm ${
                                selectedTime === time
                                  ? 'border-blue-600 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 font-bold'
                                  : 'border-gray-200 bg-white hover:border-blue-300 text-gray-700'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                          선택한 날짜에 가능한 시간이 없습니다.
                        </p>
                      )
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        왼쪽 달력에서 원하시는 멘토링 일정을 지정해 주시면 가용 시간이 나타납니다.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 2: 질문지 및 AI 도우미 섹션 ── */}
              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch"> {/* items-start에서 items-stretch로 변경하여 양쪽 높이를 동기화 */}
                  
                  {/* 왼쪽: AI 패널 묶음 */}
                  <div className="flex flex-col gap-6">
                    <div data-tour="ai-helper" className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xl">
                      <h3 className="font-bold text-gray-900 text-sm mb-3">AI 질문 도우미</h3>
                      <textarea
                        className="w-full h-32 p-3 text-xs border border-gray-200 rounded-xl mb-3 resize-none focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                        placeholder="멘토링 받고 싶은 내용을 자유롭게 메모하세요. (예: 주니어 개발자의 이직 포트폴리오 피드백)"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                      />
                      <button
                        type="button"
                        data-tour-btn="generate"
                        onClick={generateAIQuestions}
                        disabled={isLoading || !memo.trim()}
                        className={`w-full py-3 rounded-xl text-xs font-bold transition shadow-sm ${
                          isLoading || !memo.trim()
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700 text-white font-extrabold'
                        }`}
                      >
                        {isLoading ? 'AI 추천 질문 생성 중입니다.' : 'AI 추천 질문 생성하기'}
                      </button>
                    </div>

                    {recommendedList.length > 0 && (
                      <div className="bg-gradient-to-b from-blue-50 to-white p-5 rounded-2xl border border-blue-100 shadow-sm animate-fadeIn">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-blue-900 text-xs flex items-center gap-1.5">AI 추천 질문 리스트</h3>
                          <button
                            type="button"
                            onClick={() => setRecommendedList([])}
                            className="text-[11px] text-blue-500 hover:text-blue-700 underline font-medium"
                          >
                            초기화
                          </button>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                          {recommendedList.map((q, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-start p-3 bg-white rounded-xl border border-blue-100 gap-3 shadow-2sm"
                            >
                              <span className="text-xs text-gray-700 whitespace-normal break-words flex-1 leading-relaxed">
                                {q}
                              </span>
                              <button
                                type="button"
                                onClick={() => addQuestionToFinal(q)}
                                className="flex-shrink-0 px-2.5 py-1 bg-blue-600 text-white rounded-md text-[11px] font-bold hover:bg-blue-700 transition shadow-sm"
                              >
                                추가
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 오른쪽: 확정 질문지 명시적 규격 할당 */}
                  {/* flex flex-col h-full을 적용하여 내부 요소들이 높이를 계산할 수 있도록 함 */}
                  <div data-tour="final-textarea" className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xl flex flex-col h-full min-h-[340px]">
                    <div className="flex items-center justify-between mb-3 flex-shrink-0">
                      <h3 className="font-bold text-gray-900 text-sm">최종 확정 질문지</h3>
                      <span className="text-[11px] font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">직접 자유 편집 가능</span>
                    </div>
                    
                    {/* 💡 핵심 변경 항목: h-64 대신 flex-1을 주어 남은 박스 높이를 가득 채우고, 최솟값(min-h-[220px])을 보장합니다. */}
                    <textarea
                      value={questions}
                      onChange={(e) => setQuestions(e.target.value)}
                      className="w-full flex-1 min-h-[220px] p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none text-xs leading-relaxed"
                      placeholder="여기에 질문을 직접 타이핑하시거나 왼쪽의 AI 추천 질문 보드에서 [추가] 단추를 클릭해 채워보세요."
                    />
                    
                    <div className="flex justify-end items-center mt-3 flex-shrink-0">
                      <p className="text-[11px] font-medium text-gray-400">{questions.length} / 1000 자</p>
                    </div>
                  </div>
                </div>
              )}

            {/* ── STEP 3: 최종 결제 ── */}
            {currentStep === 3 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h2 className="text-xl font-bold mb-4">안전한 결제 진행하기</h2>
                <PaymentSection
                  amount={getMentorPrice()}
                  mentorName={mentor?.name || '호스트'}
                  orderInfo={{ orderId: paymentOrderId || `order_${Date.now()}` }}
                  onPaymentSuccess={handlePaymentFinalize}
                />
              </div>
            )}

            {/* ── 하단 제어 버튼 바 (자연스러운 배치 구조) ── */}
            <div className="flex gap-4 pt-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3.5 border-2 border-gray-300 bg-white text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50 transition shadow-sm"
                >
                  이전 단계
                </button>
              )}

              {currentStep < 3 && (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && (!selectedDate || !selectedTime)) ||
                    (currentStep === 2 && !questions.trim())
                  }
                  className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-extrabold text-sm transition shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  다음 단계 단계로 이동하기
                </button>
              )}
            </div>
          </div>

          {/* 우측 사이드바: 요약본 (중간 이탈 차단 우측 스티커 고정형 처리 가능) */}
          <div className="lg:col-span-1 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl shadow-xl p-5 border border-gray-100 flex flex-col justify-between min-h-[400px]">
              <div>
                <h3 className="font-bold text-base text-gray-900 mb-4">예약 정보 요약</h3>

                <div className="flex items-center gap-3.5 mb-5 pb-5 border-b border-gray-150">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 ring-2 ring-blue-100 flex-shrink-0">
                    <img
                      src={
                        mentor?.profile_image
                          ? `data:image/jpeg;base64,${mentor.profile_image}`
                          : 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'
                      }
                      onError={(e) => {
                        e.target.src =
                          'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';
                      }}
                      alt={mentor?.name || '호스트'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="overflow-hidden">
                    <h4 className="font-bold text-gray-900 text-sm truncate">
                      {mentor?.name || '호스트 명칭 조회 중'}
                    </h4>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {mentor?.job_title || '등록된 파트 정보 없음'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center gap-2.5 text-xs text-gray-700 font-semibold bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <CalendarIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>
                      {selectedDate
                        ? selectedDate.toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long'
                          })
                        : '예약 일정을 선택해 주세요'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-gray-700 font-semibold bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <Clock className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <span>
                      {selectedTime ? `${selectedTime} (총 30분 미팅)` : '시간대를 설정해 주세요'}
                    </span>
                  </div>
                </div>

                {currentStep >= 2 && questions && questions.trim().length > 0 && (
                  <div className="pt-4 border-t border-gray-150">
                    <h4 className="font-bold text-gray-900 text-xs mb-2">수집된 질문지 미니뷰</h4>
                    <p className="text-[11px] text-gray-600 line-clamp-5 bg-gray-50 p-3 rounded-xl leading-relaxed whitespace-pre-wrap border border-gray-100">
                      {questions}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-150">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-gray-700 text-xs">최종 제안 금액</span>
                  <span className="font-black text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {getMentorPrice().toLocaleString()}원
                  </span>
                </div>
                {currentStep === 3 && (
                  <div className="text-[10px] text-gray-400 flex items-center gap-1.5 justify-end">
                    <Coffee className="w-3 h-3 text-gray-300" />
                    매칭 확정 전까지 대금은 안전하게 보관됩니다.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 🤝 하단 독립 푸터 (이제 휠을 스크롤해서 내리면 자연스럽게 등장합니다) */}
      <footer className="bg-white border-t border-gray-200 py-8 text-center text-xs text-gray-500 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© 2026 AI CoffeeChat Incubator. All rights reserved.</p>
          <div className="flex gap-4 text-gray-400 font-medium">
            <a href="#rules" className="hover:text-gray-600 transition">서비스 이용약관</a>
            <a href="#privacy" className="hover:text-gray-600 transition">개인정보처리방침</a>
          </div>
        </div>
      </footer>

      {/* ── 🌟 튜토리얼 오버레이 포커싱 시스템 ── */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-auto">
          <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
            <defs>
              <mask id="tutorial-mask">
                <rect width="100%" height="100%" fill="white" />
                {maskRect.width > 0 && (
                  <rect
                    x={maskRect.x - maskRect.padding}
                    y={maskRect.y - maskRect.padding}
                    width={maskRect.width + maskRect.padding * 2}
                    height={maskRect.height + maskRect.padding * 2}
                    rx="16"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.55)" mask="url(#tutorial-mask)" />
          </svg>

          {maskRect.width > 0 && (
            <div
              className="absolute rounded-2xl pointer-events-none transition-all duration-300"
              style={{
                top: maskRect.y - maskRect.padding,
                left: maskRect.x - maskRect.padding,
                width: maskRect.width + maskRect.padding * 2,
                height: maskRect.height + maskRect.padding * 2,
                boxShadow: '0 0 0 3px rgba(47,107,251,0.9), 0 0 24px rgba(47,107,251,0.45)',
              }}
            />
          )}

          <div
            className="absolute w-80 bg-white rounded-2xl shadow-2xl p-5 border border-blue-100 transition-all duration-300"
            style={{ top: tooltipPos.top, left: tooltipPos.left }}
          >
            <button onClick={closeTutorial} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition">
              <X className="w-4 h-4" />
            </button>
            
            <h4 className="font-black text-sm text-gray-900 mb-2">
              {STEPS[stepIndex].title}
            </h4>
            <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-line mb-5">
              {STEPS[stepIndex].description}
            </p>

            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                {stepIndex + 1} / {STEPS.length}
              </span>
              
              <div className="flex gap-1.5">
                {stepIndex > 0 && (
                  <button
                    onClick={() => setStepIndex(prev => prev - 1)}
                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs transition"
                  >
                    이전
                  </button>
                )}
                <button
                  onClick={() => {
                    if (stepIndex < STEPS.length - 1) {
                      setStepIndex(prev => prev + 1);
                    } else {
                      closeTutorial();
                    }
                  }}
                  className="px-2.5 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg text-xs flex items-center gap-0.5 shadow-sm hover:opacity-90 transition"
                >
                  {stepIndex === STEPS.length - 1 ? '시작하기' : '다음'} <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}