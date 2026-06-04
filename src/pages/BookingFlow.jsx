;
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar as CalendarIcon, Clock, CreditCard, Coffee, Check } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import axios from 'axios';
import 'react-day-picker/dist/style.css';

export default function BookingFlow() {
  const { mentorId } = useParams();
  const navigate = useNavigate();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  // 상태 선언
  const [mentor, setMentor] = useState(null);
  const [isLoadingMentor, setIsLoadingMentor] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(undefined);
  const [selectedTime, setSelectedTime] = useState('');
  const [questions, setQuestions] = useState('');
  const [aiGenerated, setAiGenerated] = useState(false);
  const [memo, setMemo] = useState('');
  const [availabilityData, setAvailabilityData] = useState({});
  const [availableTimes, setAvailableTimes] = useState([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedList, setRecommendedList] = useState([]);

  // API 호출 함수
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

  // 1. 멘토 정보 로드
  useEffect(() => {
    if (!mentorId) return;
    const loadMentorData = async () => {
      setIsLoadingMentor(true);
      try {
        const data = await fetchMentorDetail(mentorId);
        setMentor(data);
      } catch (err) {
        console.error("멘토 정보 로드 실패:", err);
      } finally {
        setIsLoadingMentor(false);
      }
    };
    loadMentorData();
  }, [mentorId]);

  // 2. 가용 시간 로드 구역 (교차 검증 데이터 유연화 가드 탑재)
  useEffect(() => {
    if (!mentorId) return;
    const loadAvailability = async () => {
      setIsLoadingCalendar(true);
      try {
        // 💡 주소창의 멘토 PK로 먼저 가용 시간을 요청합니다.
        const data = await fetchAvailability(mentorId);
        setAvailabilityData(data);
      } catch (err) {
        console.error('[가용 시간 로드 실패]', err);
      } finally {
        setIsLoadingCalendar(false);
      }
    };
    loadAvailability();
  }, [mentorId]);

  // 3. 날짜 선택에 따른 시간 필터링 구역 (대소문자 및 공백 완전 방어 버전)
  useEffect(() => {
    setAvailableTimes([]);
    setSelectedTime('');
    if (!selectedDate) return;

    const dateKey = [
      selectedDate.getFullYear(),
      String(selectedDate.getMonth() + 1).padStart(2, '0'),
      String(selectedDate.getDate()).padStart(2, '0'),
    ].join('-');

    const slotsForDate = availabilityData[dateKey] || {};
    const today = new Date();
    const isToday =
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate();
    const nowMinutes = today.getHours() * 60 + today.getMinutes();

    const times = Object.entries(slotsForDate)
      .filter(([, rawStatus]) => {
        // 💡 백엔드가 대문자로 주든 공백이 섞여있든 소문자로 청소해서 'available' 매핑 검사
        const status = rawStatus ? rawStatus.toString().toLowerCase().trim() : '';
        return status === 'available';
      })
      .map(([time]) => time.trim()) // 시간 데이터 공백 청소
      .filter((time) => {
        if (isToday && timeToMinutes(time) <= nowMinutes) return false;
        return true;
      })
      .sort();

    setAvailableTimes(times);
  }, [selectedDate, availabilityData]);

  // 4. 달력 날짜 비활성화 계산기 가드
  const disabledDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [
      { before: today },
      (date) => {
        const dateKey = [
          date.getFullYear(),
          String(date.getMonth() + 1).padStart(2, '0'),
          String(date.getDate()).padStart(2, '0'),
        ].join('-');
        const slotsForDate = availabilityData[dateKey] || {};
        const isToday =
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate();
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        
        const hasAvailable = Object.entries(slotsForDate).some(([time, rawStatus]) => {
          const status = rawStatus ? rawStatus.toString().toLowerCase().trim() : '';
          if (status !== 'available') return false;
          if (isToday && timeToMinutes(time.trim()) <= nowMinutes) return false;
          return true;
        });
        return !hasAvailable;
      },
    ];
  }, [availabilityData]);

  const handleMemoChange = (e) => setMemo(e.target.value);
  const generateAIQuestions = async () => {
    if (!memo.trim()) return;
    setAiGenerated(true);
    setIsLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/ai/generate-questions`, { memo });
      const questionsArray = response.data.aiQuestions.split('\n').filter(q => q.trim() !== '');
      setRecommendedList(questionsArray);
    } catch (err) {
      console.error("AI 생성 실패:", err);
      alert("AI 질문 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestionToFinal = (q) => {
    setQuestions(prev => prev ? `${prev}\n- ${q.replace(/^[0-9.]+\s*/, '')}` : `- ${q.replace(/^[0-9.]+\s*/, '')}`);
  };

  const handleNext = () => {
    if (currentStep === 1 && selectedDate && selectedTime) setCurrentStep(2);
    else if (currentStep === 2 && questions) setCurrentStep(3);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handlePayment = async () => {
    if (isSubmitting) return;

    // 💡 [핵심 교정 1] 아이디 복구 및 쓰레기값 완벽 차단
    let finalUserId = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('user_id');

    if (!finalUserId || finalUserId === 'null' || finalUserId === 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                finalUserId = payload.user_id;
                if (finalUserId) localStorage.setItem('userId', finalUserId);
            } catch (e) { console.error(e); }
        }
    }

    // 숫자가 아닌 문자열("undefined" 등)을 완벽하게 걸러내어 순수 숫자만 추출합니다.
    const cleanUserId = parseInt(String(finalUserId).replace(/[^0-9]/g, ''), 10);

    if (!cleanUserId || isNaN(cleanUserId)) {
        alert("유효한 로그인 정보가 없습니다. 다시 로그인해주세요.");
        navigate('/login');
        return;
    }

    setIsSubmitting(true);
    try {
        const dateKey = [
            selectedDate.getFullYear(),
            String(selectedDate.getMonth() + 1).padStart(2, '0'),
            String(selectedDate.getDate()).padStart(2, '0'),
        ].join('-');

        await axios.post(`${BACKEND_URL}/api/booking/create`, {
            mentorId: parseInt(mentorId, 10),
            userId: cleanUserId, // 완벽하게 세척된 숫자형 ID 전송
            date: dateKey,
            time: selectedTime,
            questions: questions,
        });
        
        alert('🎉 예약이 완료되었습니다! 호스트에게 요청 알림이 발송되었습니다.');
        navigate('/dashboard');
    } catch (err) {
        console.error('[예약 생성 실패]', err);
        
        // 💡 [핵심 교정 2] 422 에러의 상세 원인을 [object Object]가 아니라 텍스트로 풀어줍니다.
        const detail = err.response?.data?.detail;
        let errorMsg = '예약 중 서버 오류가 발생했습니다.';
        
        if (Array.isArray(detail)) {
            // FastAPI가 알려주는 422 유효성 검사 에러 배열을 보기 좋게 문자열로 변환
            errorMsg = detail.map(d => `${d.loc.join(' -> ')}: ${d.msg}`).join('\n');
        } else if (typeof detail === 'string') {
            errorMsg = detail;
        }

        alert(`❌ 예약 실패 상세 원인:\n${errorMsg}`);
    } finally {
        setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to={`/mentors/apply/${mentorId}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
            <ChevronLeft className="w-5 h-5" />
            Back to Mentor Profile
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`flex items-center gap-3 ${currentStep >= step ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                    currentStep > step ? 'bg-green-500 text-white'
                    : currentStep === step ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-110'
                    : 'bg-gray-300 text-gray-600'
                  }`}>
                    {currentStep > step ? <Check className="w-6 h-6" /> : step}
                  </div>
                  <span className={`font-semibold ${currentStep >= step ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step === 1 ? '날짜/시간' : step === 2 ? '질문지' : '결제'}
                  </span>
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 rounded-full ${currentStep > step ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">

            {/* Step 1 */}
            {currentStep === 1 && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">날짜 및 시간 선택</h2>
                </div>
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">날짜 선택</h3>
                  <div className="flex justify-center bg-gray-50 rounded-xl p-4">
                    {isLoadingCalendar ? (
                      <div className="flex flex-col items-center py-8 gap-3">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-gray-500">가용 시간을 불러오는 중...</p>
                      </div>
                    ) : (
                      <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={disabledDays}
                        defaultMonth={new Date()}
                        className="border-0"
                      />
                    )}
                  </div>
                </div>
                {selectedDate && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 가능한 시간
                    </h3>
                    {availableTimes.length > 0 ? (
                      <div className="grid grid-cols-3 gap-3">
                        {availableTimes.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`p-4 rounded-lg border-2 transition font-medium ${
                              selectedTime === time
                                ? 'border-blue-600 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-md'
                                : 'border-gray-200 hover:border-blue-300 text-gray-700'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-xl">
                        선택한 날짜에 예약 가능한 시간이 없습니다. 다른 날짜를 선택해주세요.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 2 */}
            {currentStep === 2 && (
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">AI 질문 도우미</h3>
                    <textarea
                      className="w-full h-32 p-3 text-sm border border-gray-200 rounded-lg mb-4 resize-none"
                      placeholder="멘토링 받고 싶은 내용을 메모하세요. (예: 공급망 관리 전략, 커리어 고민 등)"
                      value={memo} 
                      onChange={handleMemoChange} 
                    />
                    <button 
                      onClick={generateAIQuestions}
                      disabled={isLoading || !memo.trim()}
                      className={`w-full py-3 rounded-lg font-semibold transition ${
                        isLoading || !memo.trim() ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isLoading ? "AI가 질문을 만드는 중..." : "AI 추천 질문 생성하기"}
                    </button>
                  </div>

                  {recommendedList.length > 0 && (
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-blue-900">추천된 질문들</h3>
                        <button onClick={() => setRecommendedList([])} className="text-xs text-blue-500 hover:text-blue-700 underline">초기화</button>
                      </div>
                      <div className="space-y-3">
                        {recommendedList.map((q, i) => (
                          <div key={i} className="flex justify-between items-start p-3 bg-white rounded-lg border border-blue-200 gap-3">
                            <span className="text-sm text-gray-700 whitespace-normal break-words flex-1">{q}</span>
                            <button 
                              onClick={() => addQuestionToFinal(q)} 
                              className="flex-shrink-0 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              추천 추가
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">확정 질문지</h3>
                    <span className="text-xs text-gray-400">직접 수정 가능</span>
                  </div>
                  <textarea
                    value={questions}
                    onChange={(e) => setQuestions(e.target.value)}
                    rows={20}
                    className="w-full p-4 border border-gray-200 rounded-lg outline-none focus:border-blue-500 resize-none"
                    placeholder="여기에 질문을 직접 입력하거나, AI 추천 질문을 추가하세요."
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-400">{questions.length} / 1000 자</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {currentStep === 3 && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-900">결제 정보</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">카드 번호</label>
                    <input type="text" placeholder="1234 5678 9012 3456" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">유효기간</label>
                      <input type="text" placeholder="MM/YY" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-2">CVC</label>
                      <input type="text" placeholder="123" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-2">카드 소유자명</label>
                    <input type="text" placeholder="홍길동" className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500" />
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" className="mt-1 w-5 h-5 text-blue-600 rounded" />
                      <span className="text-sm text-gray-600">이용약관 및 개인정보 처리방침에 동의합니다. 예약 취소는 24시간 전까지 가능합니다.</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-4 mt-6">
              {currentStep > 1 && (
                <button type="button" onClick={handleBack}
                  className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition">
                  이전
                </button>
              )}
              {currentStep < 3 ? (
                <button type="button" onClick={handleNext}
                  disabled={(currentStep === 1 && (!selectedDate || !selectedTime)) || (currentStep === 2 && !questions)}
                  className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                  다음
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={isSubmitting}
                  className={`flex-1 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold transition shadow-lg flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      결제 처리 중...
                    </>
                  ) : (
                    <>
                      <Coffee className="w-5 h-5" />
                      결제 완료
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 sticky top-8">
              <h3 className="font-bold text-lg text-gray-900 mb-4">예약 요약</h3>
              
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 ring-2 ring-blue-100">
                  <img 
                    src={mentor?.profile_image ? `data:image/jpeg;base64,${mentor.profile_image}` : "/default-profile.png"} 
                    alt={mentor?.name || "호스트"} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{mentor?.name || '호스트를 선택해주세요'}</h4>
                  <p className="text-sm text-gray-600">{mentor?.job_title || '직함 없음'}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {selectedDate ? selectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) : '날짜를 선택해주세요'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {selectedTime ? `${selectedTime} (30분)` : '시간을 선택해주세요'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">금액</span>
                  <span className="font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {mentor?.price || '0원'}
                  </span>
                </div>
              </div>

              {currentStep === 2 && questions && questions.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">작성된 질문</h4>
                  <p className="text-xs text-gray-600 line-clamp-3 bg-gray-50 p-3 rounded-lg leading-relaxed">
                    {questions}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}