import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, MessageSquare, ChevronRight, User, Coffee } from 'lucide-react';

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
        const payload = JSON.parse(atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')));
        currentUserId = payload.user_id || payload.id;
        if (currentUserId) localStorage.setItem('userId', currentUserId);
      } catch (e) {}
    }
  }

  useEffect(() => {
    if (!currentUserId) { setIsLoading(false); return; }

    const fetchBookings = async () => {
      setIsLoading(true);
      setBookings([]);
      try {
        const endpoint = activeTab === 'received'
          ? `${BACKEND_URL}/api/booking/mentor/${currentUserId}`
          : `${BACKEND_URL}/api/booking/mentee/${currentUserId}`;
        const res = await fetch(endpoint);
        if (res.ok) setBookings(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, [currentUserId, activeTab]);

  const handleConfirm = async (bookingId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/booking/confirm/${bookingId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        alert('🎉 커피챗 예약이 최종 확정되었습니다!');
        setBookings(prev => prev.filter(b => b.booking_id !== bookingId));
      } else { alert('확정 처리에 실패했습니다.'); }
    } catch { alert('서버와 통신이 원활하지 않습니다.'); }
  };

  const handleReject = async (bookingId) => {
    if (!window.confirm('정말 이 커피챗 신청을 거절하시겠습니까?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/booking/reject/${bookingId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        alert('커피챗 예약이 거절되었습니다.');
        setBookings(prev => prev.filter(b => b.booking_id !== bookingId));
      } else { alert('거절 처리에 실패했습니다.'); }
    } catch { alert('서버와 통신이 원활하지 않습니다.'); }
  };

  const formatDate = (date, time) => {
    if (!date) return '시간 미정';
    const d = new Date(`${date}T${time || '00:00'}`);
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const hour = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    const ampm = hour >= 12 ? '오후' : '오전';
    const h12 = hour % 12 || 12;
    return `${month}월 ${day}일 ${ampm} ${h12}:${min}`;
  };

  const getDDay = (dateStr) => {
    if (!dateStr) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const target = new Date(dateStr); target.setHours(0,0,0,0);
    const diff = Math.ceil((target - today) / 86400000);
    if (diff === 0) return { label: 'D-Day', color: 'text-red-500' };
    if (diff > 0) return { label: `D-${diff}`, color: 'text-blue-500' };
    return { label: `${Math.abs(diff)}일 전`, color: 'text-gray-400' };
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'CONFIRMED': return { label: '확정됨', icon: <CheckCircle className="w-3.5 h-3.5" />, className: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'REJECTED':  return { label: '거절됨',  icon: <XCircle className="w-3.5 h-3.5" />,   className: 'text-red-600 bg-red-50 border-red-200' };
      default:          return { label: '수락 대기중', icon: <Clock className="w-3.5 h-3.5" />,  className: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
  };

  const displayedBookings = Array.isArray(bookings)
    ? bookings.filter(b => activeTab === 'received' ? b.status === 'PAID' : true)
    : [];

  const tabs = [
    { id: 'requested', label: '내가 신청한', count: activeTab === 'requested' ? displayedBookings.length : null },
    { id: 'received',  label: '신청받은',    count: activeTab === 'received'  ? displayedBookings.length : null },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto pb-16" style={{ fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif" }}>

      {/* ── 헤더 ── */}
      <div className="mb-8 pt-2">
        <div className="flex items-center gap-2 mb-1">
          <Coffee className="w-5 h-5 text-amber-500" />
          <span className="text-xs font-semibold text-amber-500 tracking-widest uppercase">Bookings</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">예약 내역</h1>
        <p className="text-sm text-gray-400 mt-1">커피챗 요청과 수락 현황을 확인하세요.</p>
      </div>

      {/* ── 탭 ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── 로딩 ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
        </div>
      )}

      {/* ── 리스트 ── */}
      {!isLoading && (
        <div className="space-y-3">
          {displayedBookings.map((booking) => {
            const name    = booking.partner_name || booking.mentee_name || '알 수 없음';
            const image   = booking.partner_image || booking.mentee_image;
            const dday    = getDDay(booking.booking_date);
            const status  = getStatusConfig(booking.status);
            const dateStr = formatDate(booking.booking_date, booking.booking_time);

            return (
              <div
                key={booking.booking_id}
                className="group bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                {/* 상단 색상 바 — 상태별 */}
                <div className={`h-0.5 w-full ${
                  booking.status === 'CONFIRMED' ? 'bg-emerald-400' :
                  booking.status === 'REJECTED'  ? 'bg-red-400' :
                  'bg-amber-400'
                }`} />

                <div className="p-5">
                  <div className="flex items-start gap-4">

                    {/* 아바타 */}
                    <div className="shrink-0 relative">
                      {image ? (
                        <img
                          src={image}
                          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                          alt={name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                        />
                      ) : null}
                      <div
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-lg border-2 border-gray-100"
                        style={{ display: image ? 'none' : 'flex' }}
                      >
                        {name.slice(0, 1)}
                      </div>
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-sm">{name}</span>
                          {/* 역할 구분 */}
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                            activeTab === 'requested'
                              ? 'text-blue-600 bg-blue-50 border-blue-100'
                              : 'text-violet-600 bg-violet-50 border-violet-100'
                          }`}>
                            {activeTab === 'requested' ? '내가 신청' : '신청받음'}
                          </span>
                        </div>
                        {/* D-Day */}
                        {dday && (
                          <span className={`text-xs font-bold shrink-0 ${dday.color}`}>{dday.label}</span>
                        )}
                      </div>

                      {/* 날짜 */}
                      <div className="flex items-center gap-1.5 mb-3">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-500 font-medium">{dateStr}</span>
                      </div>

                      {/* 질문 */}
                      {booking.questions && (
                        <div className="bg-gray-50 rounded-xl px-3.5 py-2.5 border border-gray-100 mb-3">
                          <p className="text-xs text-gray-600 leading-relaxed line-clamp-2 m-0">
                            <span className="font-bold text-blue-500 mr-1">Q.</span>
                            {booking.questions}
                          </p>
                        </div>
                      )}

                      {/* 하단: 상태 + 버튼 */}
                      <div className="flex items-center justify-between">
                        {/* 상태 뱃지 */}
                        <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${status.className}`}>
                          {status.icon}
                          {status.label}
                        </span>

                        {/* 액션 버튼 */}
                        {activeTab === 'received' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleReject(booking.booking_id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                            >
                              거절
                            </button>
                            <button
                              onClick={() => handleConfirm(booking.booking_id)}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gray-900 hover:bg-gray-700 transition-colors shadow-sm"
                            >
                              수락하기 <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {activeTab === 'requested' && booking.status === 'CONFIRMED' && (
                          <span className="text-[11px] text-gray-400 font-medium">일정을 확인하세요 →</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* 빈 상태 */}
          {displayedBookings.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                <MessageSquare className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm font-semibold text-gray-400">
                {activeTab === 'received' ? '아직 받은 신청이 없어요.' : '신청한 커피챗이 없어요.'}
              </p>
              <p className="text-xs text-gray-300 mt-1">
                {activeTab === 'received' ? '멘티가 신청하면 여기에 표시됩니다.' : '호스트를 찾아 커피챗을 신청해보세요.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingHistory;
