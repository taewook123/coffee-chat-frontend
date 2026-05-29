import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MessageSquare } from 'lucide-react';

const BookingHistory = () => {
  // 💡 탭 상태 관리: 'requested' (내가 신청한 내역) / 'received' (신청받은 내역)
  const [activeTab, setActiveTab] = useState('requested');
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // ID 가져오기 로직
  let currentUserId = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('user_id');

  if (!currentUserId) {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        currentUserId = payload.user_id || payload.id;
        if (currentUserId) localStorage.setItem('userId', currentUserId);
      } catch (e) {
        console.error("토큰 해독 실패:", e);
      }
    }
  }

  // 💡 탭(activeTab)이 바뀔 때마다 데이터를 새로 불러옵니다.
  // 💡 탭(activeTab)이 바뀔 때마다 데이터를 새로 불러옵니다.
  useEffect(() => {
    if (!currentUserId) {
      setIsLoading(false); 
      return;
    }
    
    const fetchBookings = async () => {
      setIsLoading(true);
      setBookings([]); 
      
      // 💡 주소를 아예 통째로 하드코딩해서 테스트해보세요 (가장 확실함)
      // 만약 이것도 404가 난다면 서버에 API가 정말 없는 것입니다.
      const baseUrl = 'http://48.211.169.52:8003/api/booking';
      
      try {
        const endpoint = activeTab === 'received' 
          ? `${baseUrl}/mentor/${currentUserId}` 
          : `${baseUrl}/mentee/${currentUserId}`;

        console.log("요청 보내는 주소:", endpoint); // 💡 콘솔에서 이 주소를 꼭 확인하세요!


        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          setBookings(data);
        } else {
          // 💡 [수정 2] 서버에서 404 에러를 보내면 빈 배열 상태를 유지합니다.
          console.log(`서버 응답 에러 (${response.status}): 백엔드에 API가 있는지 확인하세요.`);
        }
      } catch (error) {
        // 💡 [수정 3] 통신 자체가 끊겨도 이전 탭의 잔상이 남지 않도록 막아줍니다.
        console.error("예약 내역 로드 중 에러 발생:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookings();
  }, [currentUserId, activeTab]);
  // 확정하기 버튼 로직
  const handleConfirm = async (bookingId) => {
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';
      const response = await fetch(`${BACKEND_URL}/api/bookings/confirm/${bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        alert("🎉 커피챗 예약이 최종 확정되었습니다!");
        setBookings(bookings.filter(b => b.booking_id !== bookingId));
      } else {
        alert("확정 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("통신 에러:", error);
      alert("서버와 통신이 원활하지 않습니다.");
    }
  };

  // 시간 텍스트 정제
  const getDisplayDateTime = (dateData, timeData, candidateTimes) => {
    let cleanTime = timeData || candidateTimes || '';
    if (typeof cleanTime === 'string') {
      cleanTime = cleanTime.replace(/[\[\]'"]/g, '').trim();
    }
    let cleanDate = dateData || '';
    if (cleanDate && cleanTime) return `${cleanDate} ${cleanTime}`;
    return cleanDate || cleanTime || '시간 미정';
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-transparent">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="font-sans">
      <div className="w-full">
        
        {/* 💡 상단 탭 버튼 (보여주신 이미지 스타일 적용) */}
        <div className="flex bg-gray-100 p-1.5 rounded-xl w-fit mb-6">
          <button
            onClick={() => setActiveTab('requested')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTab === 'requested' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            내가 신청한 내역
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
              activeTab === 'received' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            신청받은 내역
          </button>
        </div>

        {/* 상단 타이틀 (탭에 따라 문구 동적 변경) */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 m-0">
              {activeTab === 'received' ? '신청받은 커피챗 내역' : '내가 신청한 커피챗 내역'}
            </h1>
            <p className="text-gray-500 text-xs mt-0.5">
              {activeTab === 'received' 
                ? '멘티들이 보낸 제안을 확인하고 확정해 주세요.' 
                : '호스트(멘토)에게 보낸 내 예약 현황입니다.'}
            </p>
          </div>
        </div>

        {/* 예약 카드 리스트 */}
        <div className="space-y-3">
          {bookings.map((booking) => {
            // 백엔드 API 종류에 따라 이름/이미지 키 값이 다름을 대응
            const displayName = booking.partner_name || booking.mentee_name || "알 수 없음";
            const displayImage = booking.partner_image || booking.mentee_image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100";

            return (
              <div
                key={booking.booking_id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-all"
              >
                {/* 프로필 사진 */}
                <img
                  src={displayImage}
                  alt={displayName}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-50 flex-shrink-0"
                />

                {/* 중앙 텍스트 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h4 className="font-bold text-gray-900 text-sm m-0 truncate">{displayName}</h4>
                    <div className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      <span className="text-[11px] font-bold">
                        {getDisplayDateTime(booking.booking_date, booking.booking_time, booking.candidate_times)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-1.5 text-gray-600 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="m-0 text-slate-600 whitespace-pre-wrap line-clamp-2">Q. {booking.questions}</p>
                  </div>
                </div>

                {/* 우측 패널: 탭 상태에 따라 액션 버튼 or 상태 배지 노출 */}
                <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0 pl-4 border-l border-gray-100">
                  {activeTab === 'received' ? (
                    <>
                      <button className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border-0 bg-transparent cursor-pointer whitespace-nowrap">
                        거절
                      </button>
                      <button
                        onClick={() => handleConfirm(booking.booking_id)}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-all border-0 cursor-pointer whitespace-nowrap"
                      >
                        확정하기
                      </button>
                    </>
                  ) : (
                    <div className="px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap flex flex-col items-center gap-1">
                      {booking.status === "CONFIRMED" ? (
                         <span className="text-green-600 bg-green-50 px-3 py-1.5 rounded-md">예약 확정됨</span>
                      ) : (
                         <span className="text-gray-500 bg-gray-100 px-3 py-1.5 rounded-md">멘토 수락 대기중</span>
                      )}
                    </div>
                  )}
                </div>

              </div>
            );
          })}

          {/* 데이터가 없을 때의 공백 뷰 */}
          {bookings.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200/60">
              <p className="text-slate-400 text-sm font-medium m-0">
                {activeTab === 'received' 
                  ? '현재 새로 들어온 커피챗 예약 신청이 없습니다.' 
                  : '아직 신청한 커피챗 예약이 없습니다.'}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BookingHistory;