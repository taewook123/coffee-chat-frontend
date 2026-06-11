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

  const displayedBookings = Array.isArray(bookings) 
    ? bookings.filter(b => {
        if (activeTab === 'received') return b.status === 'PAID';
        return true; 
      })
    : [];

  return (
    <div className="font-sans w-full max-w-5xl mx-auto">
      
      {/* 탭 헤더: 중앙 정렬하여 시각적 안정감 부여 */}
      <div className="flex justify-center mb-10">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-md shadow-inner">
          <button
            onClick={() => setActiveTab('requested')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === 'requested' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            내가 신청한 내역
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
              activeTab === 'received' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            신청받은 내역
          </button>
        </div>
      </div>

      {/* 타이틀 영역 */}
      <div className="flex items-center gap-4 mb-8 px-2">
        <div className="p-3.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-md">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 m-0 tracking-tight">
            {activeTab === 'received' ? '신청받은 커피챗 내역' : '내가 신청한 커피챗 내역'}
          </h1>
          <p className="text-gray-500 text-sm mt-1 mb-0 font-medium">
            {activeTab === 'received' 
              ? '새롭게 들어온 커피챗 제안을 확인하고 수락/거절해 주세요.' 
              : '호스트(멘토)에게 보낸 내 예약 현황입니다.'}
          </p>
        </div>
      </div>

      {/* 리스트 영역 */}
      <div className="space-y-6">
        {displayedBookings.map((booking) => {
          const displayName = booking.partner_name || booking.mentee_name || "알 수 없음";
          const displayImage = booking.partner_image || booking.mentee_image || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";

          return (
            <div
              key={booking.booking_id}
              className="bg-white rounded-3xl shadow-sm border border-slate-200/70 hover:shadow-lg hover:border-blue-300 transition-all duration-300 flex flex-col md:flex-row group overflow-hidden"
            >
              
              {/* 1. 프로필 구역 (좌측 고정 비율) */}
              <div className="md:w-1/4 min-w-[200px] p-6 bg-slate-50/50 flex flex-row md:flex-col items-center md:items-start gap-4 border-b md:border-b-0 md:border-r border-slate-100">
                <div className="relative shrink-0">
                  <img
                    src={displayImage}
                    onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'; }}
                    alt={displayName}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover ring-4 ring-white shadow-sm"
                  />
                  <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></span>
                </div>
                <div>
                  <h4 className="font-extrabold text-gray-900 text-lg m-0">{displayName}</h4>
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-white border border-slate-200 text-slate-500 rounded-lg mt-2 inline-block shadow-sm">
                    커피챗 크루
                  </span>
                </div>
              </div>

              {/* 2. 콘텐츠 구역 (중앙 유동 비율) */}
              <div className="flex-1 p-6 flex flex-col justify-center gap-4">
                <div className="flex items-center">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-100">
                    <Clock className="w-4 h-4" />
                    {getDisplayDateTime(booking.booking_date, booking.booking_time, booking.candidate_times)}
                  </span>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group-hover:bg-blue-50/30 transition-colors">
                  <MessageSquare className="w-4 h-4 text-slate-300 absolute top-4 right-4" />
                  <p className="m-0 text-sm text-slate-700 leading-relaxed pr-8 line-clamp-2">
                    <span className="font-black text-blue-500 mr-2">Q.</span>
                    {booking.questions || "작성된 사전 질문이 없습니다."}
                  </p>
                </div>
              </div>

              {/* 3. 액션 구역 (우측 고정 비율) */}
              <div className="md:w-[180px] p-6 bg-white flex flex-row md:flex-col items-center justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-100">
                {activeTab === 'received' ? (
                  <div className="flex w-full flex-row md:flex-col gap-2">
                    <button
                      onClick={() => handleConfirm(booking.booking_id)}
                      className="flex-1 w-full bg-[#1a2332] hover:bg-blue-600 text-white px-4 py-3 rounded-xl font-bold text-sm shadow-md transition-all border-0"
                    >
                      확정하기
                    </button>
                    <button 
                      onClick={() => handleReject(booking.booking_id)} 
                      className="flex-1 w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-white hover:bg-red-500 transition-all border border-slate-200 hover:border-red-500"
                    >
                      거절하기
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex justify-center md:justify-end">
                    {booking.status === "CONFIRMED" ? (
                       <span className="flex items-center gap-1.5 text-sm font-bold text-green-600 bg-green-50 px-4 py-2.5 rounded-xl border border-green-100 w-full justify-center">
                          <CheckCircle className="w-4 h-4" /> 예약 확정
                       </span>
                    ) : booking.status === "REJECTED" ? (
                       <span className="flex items-center gap-1.5 text-sm font-bold text-red-500 bg-red-50 px-4 py-2.5 rounded-xl border border-red-100 w-full justify-center">
                          <XCircle className="w-4 h-4" /> 거절됨
                       </span>
                    ) : (
                       <span className="flex items-center gap-1.5 text-sm font-bold text-slate-500 bg-slate-100 px-4 py-2.5 rounded-xl w-full justify-center">
                          <Clock className="w-4 h-4" /> 수락 대기중
                       </span>
                    )}
                  </div>
                )}
              </div>

            </div>
          );
        })}

        {/* 내역이 없을 때 빈 화면 처리 */}
        {displayedBookings.length === 0 && (
          <div className="text-center py-28 bg-white rounded-3xl border-2 border-dashed border-slate-200/80">
            <p className="text-slate-400 text-base font-medium m-0">현재 해당하는 커피챗 예약 신청이 없습니다.</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default BookingHistory;