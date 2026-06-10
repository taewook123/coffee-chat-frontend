import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MessageSquare, CheckCircle, XCircle } from 'lucide-react';

const BookingHistory = () => {
  const [activeTab, setActiveTab] = useState('requested');
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

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

  useEffect(() => {
    if (!currentUserId) {
      alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
      setIsLoading(false);
      return;
    }
    
    const fetchBookings = async () => {
      setIsLoading(true);
      setBookings([]); 
      
      const baseUrl = `${BACKEND_URL}/api/booking`;
      
      try {
        const endpoint = activeTab === 'received' 
          ? `${baseUrl}/mentor/${currentUserId}` 
          : `${baseUrl}/mentee/${currentUserId}`;

        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          setBookings(data);
        } else {
          console.log(`서버 응답 에러 (${response.status}): 백엔드에 API가 있는지 확인하세요.`);
        }
      } catch (error) {
        console.error("예약 내역 로드 중 에러 발생:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookings();
  }, [currentUserId, activeTab, BACKEND_URL]);

  const handleConfirm = async (bookingId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/booking/confirm/${bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        alert("🎉 커피챗 예약이 최종 확정되었습니다!");
        // 💡 [수정] 확정하는 즉시 화면(배열)에서 완전히 치워버립니다.
        setBookings(prev => prev.filter(b => b.booking_id !== bookingId));
      } else {
        alert("확정 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("통신 에러:", error);
      alert("서버와 통신이 원활하지 않습니다.");
    }
  };

  const handleReject = async (bookingId) => {
    const isConfirmed = window.confirm("정말 이 커피챗 신청을 거절하시겠습니까?");
    if (!isConfirmed) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/booking/reject/${bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        alert("커피챗 예약이 거절되었습니다.");
        // 💡 [수정] 거절하는 즉시 화면(배열)에서 완전히 치워버립니다.
        setBookings(prev => prev.filter(b => b.booking_id !== bookingId));
      } else {
        alert("거절 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("통신 에러:", error);
      alert("서버와 통신이 원활하지 않습니다.");
    }
  };

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
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // 💡 [핵심 추가] '신청받은 내역' 탭일 때는 오직 PAID(수락 대기중)인 항목만 보여줍니다.
  const displayedBookings = Array.isArray(bookings) 
    ? bookings.filter(b => {
        if (activeTab === 'received') return b.status === 'PAID';
        return true; // 내가 신청한 내역(requested)은 모든 상태를 보여줍니다.
      })
    : [];

  return (
    <div className="font-sans w-full max-w-5xl">
      
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mb-8 shadow-inner">
        <button
          onClick={() => setActiveTab('requested')}
          className={`px-7 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            activeTab === 'requested' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          내가 신청한 내역
        </button>
        <button
          onClick={() => setActiveTab('received')}
          className={`px-7 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
            activeTab === 'received' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          신청받은 내역
        </button>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-md">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 m-0">
            {activeTab === 'received' ? '신청받은 커피챗 내역' : '내가 신청한 커피챗 내역'}
          </h1>
          <p className="text-gray-500 text-sm mt-1 mb-0">
            {activeTab === 'received' 
              ? '새롭게 들어온 커피챗 제안을 확인하고 수락/거절해 주세요.' 
              : '호스트(멘토)에게 보낸 내 예약 현황입니다.'}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {displayedBookings.map((booking) => {
          const displayName = booking.partner_name || booking.mentee_name || "알 수 없음";
          const displayImage = booking.partner_image || booking.mentee_image || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

          return (
            <div
              key={booking.booking_id}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 hover:shadow-lg hover:border-blue-200 transition-all duration-300 flex flex-col lg:flex-row lg:items-center gap-6 group"
            >
              
              <div className="flex items-center gap-4 lg:w-[220px] flex-shrink-0">
                <div className="relative">
                  <img
                    src={displayImage}
                    onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'; }}
                    alt={displayName}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-slate-50 group-hover:ring-blue-50 transition-colors bg-gray-100"
                  />
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-lg m-0">{displayName}</h4>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md mt-1 inline-block">
                    커피챗 크루
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-3 min-w-0">
                <div className="flex items-center">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100/50">
                    <Clock className="w-3.5 h-3.5" />
                    {getDisplayDateTime(booking.booking_date, booking.booking_time, booking.candidate_times)}
                  </span>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group-hover:bg-slate-100/70 transition-colors">
                  <MessageSquare className="w-4 h-4 text-slate-300 absolute top-4 right-4" />
                  <p className="m-0 text-sm text-slate-700 leading-relaxed pr-8 line-clamp-2">
                    <span className="font-black text-blue-500 mr-2">Q.</span>
                    {booking.questions || "작성된 사전 질문이 없습니다."}
                  </p>
                </div>
              </div>

              <div className="flex flex-row lg:flex-col items-center lg:items-end justify-end gap-3 flex-shrink-0 lg:w-[140px] pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 mt-2 lg:mt-0">
                {activeTab === 'received' ? (
                  // 💡 '신청받은 내역' 탭은 displayedBookings 덕분에 무조건 PAID 상태만 오므로, 뱃지를 그릴 필요 없이 버튼만 깔끔하게 노출합니다.
                  <div className="flex w-full lg:flex-col gap-2">
                    <button 
                      onClick={() => handleReject(booking.booking_id)} 
                      className="flex-1 lg:w-full px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-white hover:bg-red-500 transition-all border border-slate-200 hover:border-red-500"
                    >
                      거절하기
                    </button>
                    <button
                      onClick={() => handleConfirm(booking.booking_id)}
                      className="flex-1 lg:w-full bg-slate-900 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all border-0"
                    >
                      확정하기
                    </button>
                  </div>
                ) : (
                  // 💡 '내가 신청한 내역'은 기존처럼 모든 상태를 배지로 예쁘게 보여줍니다.
                  <div className="w-full text-right flex justify-end">
                    {booking.status === "CONFIRMED" ? (
                       <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-4 py-2.5 rounded-xl border border-green-100">
                          <CheckCircle className="w-4 h-4" /> 예약 확정됨
                       </span>
                    ) : booking.status === "REJECTED" ? (
                       <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100">
                          <XCircle className="w-4 h-4" /> 거절됨
                       </span>
                    ) : (
                       <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-4 py-2.5 rounded-xl">
                          <Clock className="w-4 h-4" /> 수락 대기중
                       </span>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}

        {displayedBookings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 text-base font-semibold m-0">
              {activeTab === 'received' 
                ? '현재 처리해야 할 커피챗 제안이 없습니다.' 
                : '아직 신청한 커피챗 예약 내역이 없습니다.'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default BookingHistory;