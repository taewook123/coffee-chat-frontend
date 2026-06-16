import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar, Clock, CheckCircle, XCircle, MessageSquare, ChevronRight,
  ChevronDown, ArrowLeft, Download, Filter, Search, TrendingUp, CreditCard,
  AlertCircle
} from 'lucide-react';

/* ─── 상태별 메타데이터 ─── */
const STATUS_META = {
  CONFIRMED: { label: "예약확정", color: "#059669", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", icon: <CheckCircle className="w-3.5 h-3.5" /> },
  PAID:      { label: "수락대기", color: "#ea580c", bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: <Clock className="w-3.5 h-3.5" /> },
  REJECTED:  { label: "취소/거절", color: "#dc2626", bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: <XCircle className="w-3.5 h-3.5" /> },
};

const FILTERS = ["전체", "CONFIRMED", "PAID", "REJECTED"];
const FILTER_LABEL = {
  전체: "전체",
  CONFIRMED: "예약확정",
  PAID: "수락대기",
  REJECTED: "취소/거절",
};

/* ─── 티타임 아이콘 (lucide에 없어서 SVG로 대체) ─── */
function TeacupIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  );
}

export default function BookingHistory() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('requested');
  const [filter, setFilter] = useState("전체");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(null);
  
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  let currentUserId = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('user_id');
  if (!currentUserId) {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        currentUserId = payload.user_id || payload.id;
        if (currentUserId) localStorage.setItem('userId', currentUserId);
      } catch (e) {}
    }
  }

  useEffect(() => {
    if (!currentUserId) { setIsLoading(false); return; }

    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const endpoint = activeTab === 'received'
          ? `${BACKEND_URL}/api/booking/mentor/${currentUserId}`
          : `${BACKEND_URL}/api/booking/mentee/${currentUserId}`;
        
        const res = await axios.get(endpoint);
        setBookings(res.data || []);
      } catch (e) {
        console.error("예약 내역 로드 실패:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
    setExpanded(null);
  }, [currentUserId, activeTab, BACKEND_URL]);

  const handleConfirm = async (bookingId) => {
    try {
      await axios.post(`${BACKEND_URL}/api/booking/confirm/${bookingId}`);
      alert('🎉 티타임 예약이 최종 확정되었습니다!');
      setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, status: 'CONFIRMED' } : b));
    } catch {
      alert('확정 처리에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleReject = async (bookingId) => {
    if (!window.confirm('정말 이 티타임 신청을 거절하시겠습니까?')) return;
    try {
      await axios.post(`${BACKEND_URL}/api/booking/reject/${bookingId}`);
      alert('티타임 예약이 거절되었습니다.');
      setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, status: 'REJECTED' } : b));
    } catch {
      alert('거절 처리에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleCancelRequest = async (bookingId) => {
    if (!window.confirm('정말 이 티타임 신청을 취소하시겠습니까?')) return;
    try {
      await axios.post(`${BACKEND_URL}/api/booking/reject/${bookingId}`);
      alert('티타임 신청이 취소되었습니다.');
      setBookings(prev => prev.map(b => b.booking_id === bookingId ? { ...b, status: 'REJECTED' } : b));
    } catch {
      alert('취소 처리에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const processedBookings = Array.isArray(bookings) ? bookings.filter((b) => {
    if (activeTab === 'received' && b.status === 'PENDING') return false;
    const matchF = filter === "전체" || b.status === filter;
    const targetName = b.partner_name || b.mentee_name || "";
    const matchQ = query.trim() === "" || 
                   targetName.toLowerCase().includes(query.toLowerCase()) || 
                   (b.questions || "").toLowerCase().includes(query.toLowerCase());
    return matchF && matchQ;
  }) : [];

  const formatDate = (date, time) => {
    if (!date) return '시간 미정';
    const d = new Date(`${date}T${time || '00:00'}`);
    const ampm = d.getHours() >= 12 ? '오후' : '오전';
    const h12 = d.getHours() % 12 || 12;
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${d.getMonth() + 1}월 ${d.getDate()}일 ${ampm} ${h12}:${min}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-700 font-sans">
      
      <div className="flex-1 px-6 md:px-7 py-2 max-w-5xl mx-auto w-full">
        
        {/* ── 타이틀 ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <TeacupIcon className="w-5 h-5 text-blue-600" />
            <span className="text-xs font-bold tracking-widest text-blue-600 uppercase">Booking History</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">예약 내역</h1>
          <p className="text-sm text-gray-500">지금까지 진행된 모든 티타임 요청과 예약 상태를 확인하세요.</p>
        </div>

        {/* ── 탭 메뉴 ── */}
        <div className="flex gap-2 bg-gray-200/50 p-1.5 rounded-xl mb-8 max-w-sm">
          <button
            onClick={() => { setActiveTab('requested'); setFilter('전체'); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
              activeTab === 'requested' ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-700 shadow-none'
            }`}
          >
            내가 신청한 티타임
          </button>
          <button
            onClick={() => { setActiveTab('received'); setFilter('전체'); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm ${
              activeTab === 'received' ? 'bg-white text-gray-900' : 'text-gray-500 hover:text-gray-700 shadow-none'
            }`}
          >
            신청받은 티타임
          </button>
        </div>

        {/* ── 검색 및 필터 ── */}
        <div className="flex flex-col md:flex-row items-center gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1 bg-gray-50 border border-gray-200 w-full">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="이름 또는 사전 질문 내용으로 검색..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <Filter className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
            <div className="flex gap-1.5">
              {FILTERS.map((f) => {
                const active = filter === f;
                const meta = f !== "전체" ? STATUS_META[f] : null;
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border ${
                      active 
                        ? meta ? `${meta.bg} ${meta.text} ${meta.border}` : 'bg-gray-800 text-white border-gray-800'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {FILTER_LABEL[f]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 리스트 ── */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : processedBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-28 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                <MessageSquare className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-base font-bold text-gray-500">예약 내역이 없습니다.</p>
              <p className="text-sm text-gray-400 mt-1">
                {activeTab === 'received' ? '아직 도착한 신청이 없습니다.' : '새로운 멘토에게 티타임을 신청해보세요!'}
              </p>
            </div>
          ) : (
            processedBookings.map((b) => {
              const meta = STATUS_META[b.status] || STATUS_META.PAID;
              const isExpanded = expanded === b.booking_id;
              const name = b.partner_name || b.mentee_name || "알 수 없음";
              const isCancelled = b.status === 'REJECTED';

              return (
                <div
                  key={b.booking_id}
                  className={`bg-white rounded-2xl overflow-hidden transition-all duration-200 border ${
                    isExpanded ? 'border-blue-300 shadow-md ring-2 ring-blue-50' : 'border-gray-200 hover:border-gray-300 shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => setExpanded(isExpanded ? null : b.booking_id)}
                    className="w-full flex flex-col md:flex-row md:items-center gap-4 px-6 py-5 text-left relative"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: meta.color }} />

                    <div className="flex items-center gap-4 w-full md:w-1/3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-lg shrink-0">
                        {name.slice(0, 1)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-extrabold text-gray-900 text-lg truncate">{name}</span>
                          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                            {activeTab === 'requested' ? '호스트' : '게스트'}
                          </span>
                        </div>
                        <p className="text-xs font-medium text-gray-500 truncate">
                          {b.topic || "자유 주제 티타임"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 md:w-1/3">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-bold">{formatDate(b.booking_date, b.booking_time)}</span>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-1/3 mt-2 md:mt-0">
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border ${meta.bg} ${meta.text} ${meta.border}`}>
                        {meta.icon}
                        {meta.label}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? "rotate-180 text-blue-500" : ""}`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 bg-gray-50/50 border-t border-gray-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                        
                        <div className="space-y-4">
                          <p className="text-xs font-extrabold text-gray-400 tracking-wider">세부 정보</p>
                          
                          <div className="flex items-center gap-3">
                            <TrendingUp className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-500 w-16">예약번호</span>
                            <span className="text-sm font-bold text-gray-900">{b.booking_id}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-4 h-4 text-gray-400 shrink-0" />
                            <span className="text-sm text-gray-500 w-16">결제금액</span>
                            <span className="text-sm font-bold text-gray-900">
                              {b.price ? `₩${b.price.toLocaleString()}` : "15000원"}
                            </span>
                          </div>

                          {b.questions && (
                            <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                              <p className="text-xs font-extrabold text-blue-600 mb-2">사전 질문 및 요청사항</p>
                              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{b.questions}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col justify-end gap-3">
                          
                          {activeTab === 'received' && b.status === 'PAID' && (
                            <div className="flex items-center gap-2 w-full mt-4">
                              <button
                                onClick={() => handleReject(b.booking_id)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                              >
                                거절하기
                              </button>
                              <button
                                onClick={() => handleConfirm(b.booking_id)}
                                className="flex-[2] flex justify-center items-center gap-1 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-colors"
                              >
                                티타임 수락하기 <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {activeTab === 'requested' && (b.status === 'PAID' || b.status === 'CONFIRMED') && (
                            <div className="flex items-center gap-2 w-full mt-4">
                              <button
                                onClick={() => handleCancelRequest(b.booking_id)}
                                className="w-full py-2.5 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors flex items-center justify-center gap-1.5"
                              >
                                <XCircle className="w-4 h-4" /> 신청 취소하기
                              </button>
                            </div>
                          )}

                          {activeTab === 'requested' && b.status === 'CONFIRMED' && (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 mt-1">
                              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                              <div>
                                <p className="text-sm font-bold text-emerald-800">티타임이 확정되었습니다!</p>
                                <p className="text-xs text-emerald-600 mt-1">예정된 시간에 맞춰 화상 채팅방 링크가 활성화됩니다.</p>
                              </div>
                            </div>
                          )}

                          {isCancelled && (
                            <div className="flex items-start gap-2 mt-2 p-3 bg-red-50 rounded-xl border border-red-100 text-red-600">
                              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              <span className="text-xs font-bold leading-relaxed">
                                이 예약은 취소되거나 거절되었습니다. 결제된 금액이 있다면 전액 환불 처리됩니다.
                              </span>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
