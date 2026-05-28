import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MessageSquare } from 'lucide-react';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 💡 여러 스토리지 이름 중 존재하는 ID를 안전하게 가져옵니다.
  let mentorId = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('user_id');

  if (!mentorId) {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        mentorId = payload.user_id || payload.id;
        if (mentorId) localStorage.setItem('userId', mentorId);
      } catch (e) {
        console.error("토큰 해독 실패:", e);
      }
    }
  }

  // 💡 컴포넌트 마운트 시 대기 중인 예약 신청 내역 로드 (중복 제거 및 통합 완료)
  useEffect(() => {
    console.log("현재 불러온 멘토 ID:", mentorId); 
    
    if (!mentorId) {
      alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
      setIsLoading(false); // 무한 로딩 방지
      return;
    }
    
    const fetchBookings = async () => {
      try {
        const response = await fetch(`http://48.211.169.52:8000/api/booking/mentor/${mentorId}`);
        if (response.ok) {
          const data = await response.json();
          setBookings(data);
        }
      } catch (error) {
        console.error("예약 내역 로드 중 에러 발생:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookings();
  }, [mentorId]);

  // 💡 [확정하기] 버튼 클릭 시 동작하는 함수
  const handleConfirm = async (bookingId) => {
    try {
      const response = await fetch(`http://48.211.169.52:8000/api/bookings/confirm/${bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        alert("🎉 커피챗 예약이 최종 확정되었습니다!");
        // 수락 완료된 내역은 상태 배열에서 제외하여 화면에서 즉시 사라지게 처리
        setBookings(bookings.filter(b => b.booking_id !== bookingId));
      } else {
        alert("확정 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("통신 에러:", error);
      alert("서버와 통신이 원활하지 않습니다.");
    }
  };

  // 💡 [안전 가드] 기존 DB 구조를 유지했으므로, candidate_times 내부 데이터를 안전하게 추출하는 함수
  const getDisplayTime = (timeData) => {
    try {
      const parsed = JSON.parse(timeData);
      // 만약 배열 형태(["09:00 AM"])로 파싱되면 첫 번째 원소만 꺼내고, 아니면 그대로 반환
      return Array.isArray(parsed) ? parsed[0] : timeData;
    } catch {
      // JSON 형식이 아닌 일반 텍스트 문자열인 경우 예외처리하여 그대로 출력
      return timeData;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* 상단 타이틀 */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-md shadow-blue-100">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 m-0">신청받은 커피챗 내역</h1>
            <p className="text-gray-500 text-xs mt-1">멘티들이 보낸 커피챗 제안을 확인하고 확정해 주세요.</p>
          </div>
        </div>

        {/* 예약 카드 리스트 */}
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.booking_id}
              className="bg-white rounded-2xl p-6 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all"
            >
              
              {/* 1. 멘티 프로필 정보 */}
              <div className="flex items-center gap-4 min-w-[180px]">
                <img
                  src={booking.mentee_image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                  alt={booking.mentee_name}
                  className="w-14 h-14 rounded-full object-cover ring-4 ring-slate-50"
                />
                <div>
                  <h4 className="font-bold text-gray-900 m-0 text-base">{booking.mentee_name} 크루</h4>
                  <p className="text-xs text-slate-400 m-0 mt-1">커피챗 신청 유저</p>
                </div>
              </div>

              {/* 2. 신청 시간(가공 처리됨) 및 사전 질문 내용 */}
              <div className="flex-1 space-y-2.5 border-0 md:border-l md:border-r border-gray-100 md:px-6">
                <div className="flex items-center gap-2 text-blue-600 bg-blue-50/60 px-3 py-2 rounded-xl border border-blue-100/30 w-fit">
                  <Clock className="w-4 h-4" />
                  {/* 💡 헬퍼 함수를 가치있게 통과시켜 포장을 벗겨낸 단일 시간만 바인딩 */}
                  <span className="text-xs font-bold">{getDisplayTime(booking.candidate_times)}</span>
                </div>
                
                <div className="flex items-start gap-1.5 text-gray-600 text-xs leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100/80">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <p className="m-0 text-slate-600 whitespace-pre-wrap">Q. {booking.questions}</p>
                </div>
              </div>

              {/* 3. 오른쪽 거절 / 확정 액션 버튼 패널 */}
              <div className="flex items-center gap-3 justify-end pl-2">
                <button className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border-0 bg-transparent cursor-pointer">
                  거절
                </button>
                <button
                  onClick={() => handleConfirm(booking.booking_id)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-slate-200 transition-all border-0 cursor-pointer"
                >
                  확정하기
                </button>
              </div>

            </div>
          ))}

          {/* 대기 중인 신청 내역이 없을 때 띄워줄 공백 뷰 */}
          {bookings.length === 0 && (
            <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-slate-200/60">
              <p className="text-slate-400 text-sm font-medium m-0">현재 새로 들어온 커피챗 예약 신청이 없습니다.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BookingHistory;