import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { ChevronLeft, Calendar, Clock, CreditCard, Coffee } from 'lucide-react';

export default function BookingPage() {
  const { mentorId } = useParams();
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState('2026-05-16');
  const [selectedTime, setSelectedTime] = useState('오전 10:00');
  const [questions, setQuestions] = useState('');

  const mentor = {
    name: 'Sarah Chen',
    company: 'Google',
    role: 'Senior Product Manager',
    // 💡 아줌마 사진 퇴출 -> 기본 실루엣으로 변경!
    avatar: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png',
    price: 89
  };

  const availableDates = [
    '2026-05-16',
    '2026-05-17',
    '2026-05-18',
    '2026-05-20',
    '2026-05-21',
    '2026-05-23'
  ];

  // 시간을 한국어 표기법으로 변경했습니다.
  const availableTimes = [
    '오전 9:00',
    '오전 10:00',
    '오전 11:00',
    '오후 2:00',
    '오후 3:00',
    '오후 4:00'
  ];

  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      {/* 네비게이션 */}
      <nav className="bg-[#1a2332] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Coffee className="w-8 h-8" />
            <span className="text-xl font-semibold">티타임</span>
          </Link>
          <Link to="/mentors" className="flex items-center gap-2 hover:text-blue-300 transition">
            <ChevronLeft className="w-5 h-5" />
            호스트 프로필로 돌아가기
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* 진행 단계 표시 */}
        <div className="mb-12">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 1 ? 'bg-[#4a90e2] text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <span className={step >= 1 ? 'font-semibold' : 'text-gray-600'}>
                시간 선택
              </span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 2 ? 'bg-[#4a90e2] text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className={step >= 2 ? 'font-semibold' : 'text-gray-600'}>
                결제
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* 메인 콘텐츠 */}
          <div className="md:col-span-2">
            {step === 1 ? (
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-semibold text-[#1a2332] mb-6">
                  날짜 및 시간 선택
                </h2>

                {/* 날짜 선택 */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    날짜 선택
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {availableDates.map((date) => (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`p-3 rounded-lg border-2 transition ${
                          selectedDate === date
                            ? 'border-[#4a90e2] bg-blue-50 text-[#4a90e2] font-semibold'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* 한국어 날짜 포맷으로 변경 */}
                        {new Date(date).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 시간 선택 */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Clock className="w-4 h-4 inline mr-2" />
                    시간 선택
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {availableTimes.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-3 rounded-lg border-2 transition ${
                          selectedTime === time
                            ? 'border-[#4a90e2] bg-blue-50 text-[#4a90e2] font-semibold'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 사전 질문 입력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    호스트에게 물어보고 싶은 질문 (선택 사항)
                  </label>
                  <textarea
                    value={questions}
                    onChange={(e) => setQuestions(e.target.value)}
                    placeholder="티타임에서 나누고 싶은 주제나 질문을 적어주세요..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-[#4a90e2] resize-none"
                  />
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full mt-6 py-4 bg-[#4a90e2] hover:bg-[#3a7bc8] text-white rounded-full font-semibold transition"
                >
                  결제 단계로 이동
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-8">
                <h2 className="text-2xl font-semibold text-[#1a2332] mb-6">
                  결제 정보
                </h2>

                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      카드 번호
                    </label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-[#4a90e2]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        유효기간
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-[#4a90e2]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CVC
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-[#4a90e2]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      카드 소유자 이름
                    </label>
                    <input
                      type="text"
                      placeholder="홍길동"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-[#4a90e2]"
                    />
                  </div>

                  <div className="flex items-start gap-3 pt-4">
                    <input
                      type="checkbox"
                      id="terms"
                      className="mt-1 w-4 h-4 text-[#4a90e2] border-gray-300 rounded focus:ring-[#4a90e2]"
                    />
                    <label htmlFor="terms" className="text-sm text-gray-600">
                      이용약관에 동의하며, 이 예약은 환불이 불가능함을 이해합니다.
                    </label>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition"
                    >
                      이전
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-4 bg-[#4a90e2] hover:bg-[#3a7bc8] text-white rounded-full font-semibold transition"
                    >
                      결제 및 예약 확정
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* 예약 요약 (사이드바) */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-6">
              <h3 className="font-semibold text-lg text-[#1a2332] mb-4">
                예약 요약
              </h3>

              <div className="flex items-start gap-3 mb-6 pb-6 border-b border-gray-200">
                <img
                  src={mentor.avatar}
                  onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'; }}
                  alt={mentor.name}
                  className="w-14 h-14 rounded-full object-cover bg-gray-100" // 배경색 살짝 추가
                />
                <div>
                  <h4 className="font-semibold text-[#1a2332]">{mentor.name}</h4>
                  <p className="text-sm text-gray-600">{mentor.role}</p>
                  <p className="text-sm font-medium text-[#4a90e2]">{mentor.company}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">
                    {/* 한국어 요일 및 날짜 포맷 적용 */}
                    {new Date(selectedDate).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'short'
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{selectedTime} (60분)</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">티타임 비용</span>
                  <span className="font-semibold">${mentor.price}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">$5</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <span className="font-semibold text-lg">총 결제 금액</span>
                  <span className="font-bold text-xl text-[#4a90e2]">
                    ${mentor.price + 5}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
