import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Calendar as CalendarIcon,
  Clock,
  Coffee,
  Check
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import axios from 'axios';
import 'react-day-picker/dist/style.css';

import PaymentSection from '../components/PaymentSection';

export default function BookingFlow() {
  const { mentorId } = useParams();
  const navigate = useNavigate();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

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

      alert('예약이 확정되었습니다.');
      navigate('/dashboard');
    } catch (err) {
      console.error('최종 예약 생성 실패:', err);
      alert('결제는 완료됐으나 예약 생성에 실패했습니다. 관리자에게 문의해주세요.');
    }
  };

  useEffect(() => {
    if (!mentorId) return;

    const loadMentorData = async () => {
      setIsLoadingMentor(true);

      try {
        const data = await fetchMentorDetail(mentorId);
        setMentor(data);
      } catch (err) {
        console.error('멘토 정보 로드 실패:', err);
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

  if (isLoadingMentor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 font-semibold">
        멘토 정보를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link
            to={`/mentors/apply/${mentorId}`}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ChevronLeft className="w-5 h-5" />
            멘토 프로필로 돌아가기
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`flex items-center gap-3 ${currentStep >= step ? 'opacity-100' : 'opacity-40'}`}>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                      currentStep > step
                        ? 'bg-green-500 text-white'
                        : currentStep === step
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-110'
                          : 'bg-gray-300 text-gray-600'
                    }`}
                  >
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
                        <p className="text-sm text-gray-500">가능 시간을 불러오는 중...</p>
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
                      {selectedDate.toLocaleDateString('ko-KR', {
                        month: 'long',
                        day: 'numeric'
                      })} 가능 시간
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
                        선택한 날짜에 예약 가능한 시간이 없습니다.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4">AI 질문 도우미</h3>
                    <textarea
                      className="w-full h-32 p-3 text-sm border border-gray-200 rounded-lg mb-4 resize-none"
                      placeholder="멘토링 받고 싶은 내용을 메모하세요."
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={generateAIQuestions}
                      disabled={isLoading || !memo.trim()}
                      className={`w-full py-3 rounded-lg font-semibold transition ${
                        isLoading || !memo.trim()
                          ? 'bg-gray-300'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {isLoading ? 'AI가 질문을 만드는 중...' : 'AI 추천 질문 생성하기'}
                    </button>
                  </div>

                  {recommendedList.length > 0 && (
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-blue-900">추천 질문</h3>
                        <button
                          type="button"
                          onClick={() => setRecommendedList([])}
                          className="text-xs text-blue-500 hover:text-blue-700 underline"
                        >
                          초기화
                        </button>
                      </div>

                      <div className="space-y-3">
                        {recommendedList.map((q, i) => (
                          <div
                            key={i}
                            className="flex justify-between items-start p-3 bg-white rounded-lg border border-blue-200 gap-3"
                          >
                            <span className="text-sm text-gray-700 whitespace-normal break-words flex-1">
                              {q}
                            </span>
                            <button
                              type="button"
                              onClick={() => addQuestionToFinal(q)}
                              className="flex-shrink-0 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              추가
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
                    placeholder="여기에 질문을 직접 입력하거나 AI 추천 질문을 추가하세요."
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-gray-400">{questions.length} / 1000 자</p>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h2 className="text-2xl font-bold mb-6">최종 결제</h2>
                <PaymentSection
                  amount={getMentorPrice()}
                  mentorName={mentor?.name || '멘토'}
                  orderInfo={{ orderId: paymentOrderId || `order_${Date.now()}` }}
                  onPaymentSuccess={handlePaymentFinalize}
                />
              </div>
            )}

            <div className="flex gap-4 mt-6">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  이전
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
                  className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 sticky top-8">
              <h3 className="font-bold text-lg text-gray-900 mb-4">예약 요약</h3>

              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200 ring-2 ring-blue-100">
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
                    alt={mentor?.name || '멘토'}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900">
                    {mentor?.name || '멘토를 선택해주세요'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {mentor?.job_title || '직함 없음'}
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {selectedDate
                      ? selectedDate.toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long'
                        })
                      : '날짜를 선택해주세요'}
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
                    {getMentorPrice().toLocaleString()}원
                  </span>
                </div>
              </div>

              {currentStep >= 2 && questions && questions.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">작성한 질문</h4>
                  <p className="text-xs text-gray-600 line-clamp-3 bg-gray-50 p-3 rounded-lg leading-relaxed">
                    {questions}
                  </p>
                </div>
              )}

              {currentStep === 3 && (
                <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500 flex items-center gap-2">
                  <Coffee className="w-4 h-4" />
                  결제 완료 후 예약이 생성됩니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}