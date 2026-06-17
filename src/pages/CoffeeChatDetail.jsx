import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Clock, Video,
  MessageSquare, CheckCircle, Sparkles, XCircle, MapPin,
  CreditCard, BookOpen, Star
} from 'lucide-react';
import axios from 'axios';

/* ─── 티타임 아이콘 ─── */
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

export default function CoffeeChatDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canEnter, setCanEnter] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';
  const currentUserId = localStorage.getItem('userId');

  useEffect(() => {
    if (!currentUserId) return;

    axios.get(`${BACKEND_URL}/api/booking/${currentUserId}`)
      .then(res => {
        const found = res.data.find(b => String(b.id) === String(id) || String(b.booking_id) === String(id));
        setBooking(found);

        if (found) {
          setCanEnter(true);
          
          axios.get(`${BACKEND_URL}/api/chat-session/${found.id || found.booking_id}`)
            .then(sessionRes => setSession(sessionRes.data))
            .catch(err => console.error(err));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id, currentUserId, BACKEND_URL]);

  const handleEnter = async () => {
    try {
      await axios.post(`${BACKEND_URL}/api/chat-session/start`, null, {
        params: { booking_id: id }
      });
    } catch (err) {
      console.error('세션 시작 실패:', err);
    }
    navigate(`/coffee-chat/${id}`);
  };

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await axios.post(`${BACKEND_URL}/api/booking/reject/${id || booking?.booking_id}`);
      alert("티타임 예약이 성공적으로 취소되었습니다.");
      navigate("/coffee-chats");
    } catch (error) {
      console.error("예약 취소 실패:", error);
      alert("예약 취소에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-500 font-bold tracking-widest text-sm">데이터를 불러오는 중입니다...</p>
      </div>
    </div>
  );

  if (!booking) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <XCircle className="w-12 h-12 text-red-500" />
      <p className="text-gray-900 font-bold text-lg">예약 정보를 찾을 수 없어요</p>
      <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-700 font-medium underline">이전 페이지로 돌아가기</button>
    </div>
  );

  const partnerName = booking.partner_name || booking.mentor_name || booking.mentee_name || "크루";
  const isMentor = currentUserId === String(booking.mentor_id);
  const myRole = isMentor ? "게스트" : "호스트";
  const partnerRole = isMentor ? "게스트" : "호스트";
  const isCancelled = booking.status === 'REJECTED' || booking.status === 'DENY';

  const today = new Date();
  today.setHours(0,0,0,0);
  const sessionDate = new Date(booking.booking_date);
  sessionDate.setHours(0,0,0,0);
  const diffDays = Math.ceil((sessionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const dLabel = diffDays === 0 ? "D-Day" : diffDays > 0 ? `D-${diffDays}` : "종료됨";
  const dColor = diffDays <= 1 ? "text-orange-500" : "text-blue-600";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-6 md:px-10 py-5 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <button
          onClick={() => navigate('/coffee-chats')}
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> 목록으로
        </button>
      </header>

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 md:px-10 py-8 flex flex-col gap-6">

        {/* ── Hero ── */}
        <div className="relative bg-white rounded-3xl p-8 overflow-hidden shadow-sm border border-gray-200">
          <div className="relative flex items-start gap-6 flex-wrap">
            
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-blue-700 flex-shrink-0 bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 shadow-sm">
              {partnerName.slice(0, 1)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h2 className="text-2xl font-extrabold text-gray-900">{partnerName}</h2>
                <span className="text-xs px-2.5 py-1 rounded-md font-bold tracking-widest bg-gray-100 text-gray-500">
                  {partnerRole}
                </span>
              </div>
              <p className="text-sm mb-3 text-gray-500 font-medium">
                나({myRole})와의 1:1 티타임
              </p>
              <p className="font-bold text-gray-800 text-lg md:text-xl truncate">{booking.topic || "자유 주제 티타임"}</p>
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0 mt-2 md:mt-0">
              <span className={`text-2xl font-black tracking-tight ${dColor}`}>{dLabel}</span>
              {isCancelled ? (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                  <XCircle className="w-3.5 h-3.5" /> 취소/거절됨
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <CheckCircle className="w-3.5 h-3.5" /> 예약확정
                </span>
              )}
            </div>
          </div>

          <div className="my-6 h-px w-full bg-gray-100" />

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-50 text-gray-700 border border-gray-200">
              <Calendar className="w-4 h-4 text-blue-500" /> {booking.booking_date}
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-50 text-gray-700 border border-gray-200">
              <Clock className="w-4 h-4 text-orange-500" /> {booking.booking_time}
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-50 text-gray-700 border border-gray-200">
              <MapPin className="w-4 h-4 text-emerald-500" /> 온라인 화상 티타임
            </div>
          </div>
        </div>

        {/* 세션 완료 알림 */}
        {session && session.status === 'COMPLETED' && (
          <div className="rounded-2xl p-5 bg-emerald-50 border border-emerald-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="text-emerald-800 font-bold text-sm">이미 성공적으로 종료된 티타임입니다.</p>
                {session.duration_sec && <p className="text-emerald-600 text-xs mt-1 font-medium">총 진행 시간: {Math.floor(session.duration_sec / 60)}분</p>}
              </div>
            </div>
          </div>
        )}

        {/* ── 2단 레이아웃 ── */}
        <div className="grid gap-6 md:grid-cols-[1fr_300px]">

          {/* 왼쪽: 질문 및 팁 */}
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <span className="font-extrabold text-gray-900 text-lg">사전 질문 및 요청사항</span>
              </div>
              <div className="p-5 rounded-xl text-sm leading-relaxed bg-gray-50 border border-gray-100 text-gray-700 font-medium">
                {booking.questions ? (
                  <p className="whitespace-pre-wrap">{booking.questions}</p>
                ) : (
                  <p className="text-gray-400 italic">작성된 사전 질문이 없습니다.</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="font-extrabold text-gray-900 text-lg">성공적인 티타임 팁</span>
              </div>
              <ul className="text-sm space-y-3 text-gray-600 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold mt-0.5">•</span> 조용한 환경에서 마이크가 있는 이어폰을 사용해주세요.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 font-bold mt-0.5">•</span> 사전 질문을 미리 읽어보고 오시면 더욱 깊은 대화가 가능합니다.
                </li>
              </ul>
            </div>
          </div>

          {/* 오른쪽: 정보 및 액션 */}
          <div className="flex flex-col gap-4">
            
            {/* 결제 정보 */}
            <div className="rounded-2xl p-5 bg-white border border-gray-200 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-[0.1em] mb-4 text-gray-400">결제 정보</p>
              <div className="flex flex-col gap-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">세션 시간</span>
                  <span className="text-sm font-bold text-gray-900">{booking.duration || 30}분</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">결제 금액</span>
                  <span className="text-sm font-bold text-gray-900">{booking.price ? `₩${booking.price.toLocaleString()}` : "무료"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">결제 수단</span>
                  <span className="text-sm font-bold text-gray-900">{booking.payMethod || "결제 수단"}</span>
                </div>
              </div>
            </div>

            {/* 진행 방식 */}
            <div className="rounded-2xl p-5 bg-white border border-gray-200 shadow-sm">
              <p className="text-xs font-extrabold uppercase tracking-[0.1em] mb-4 text-gray-400">진행 방식</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <Video className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-gray-600">화상 카메라 + 마이크</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-gray-600">실시간 채팅 지원</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-gray-600">AI 실시간 세션 요약</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-gray-600">세션 후 상호 평가</span>
                </div>
              </div>
            </div>

            {/* 입장 버튼 */}
            <div className="rounded-2xl p-6 flex flex-col gap-4 bg-white border border-gray-200 shadow-sm mt-2">
              {canEnter && !isCancelled ? (
                <button
                  onClick={handleEnter}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold text-white transition-all transform hover:scale-[1.02] bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"
                >
                  <Video className="w-5 h-5" /> 라이브 티타임 입장
                </button>
              ) : (
                <button
                  disabled
                  className="w-full flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl text-sm font-bold transition cursor-not-allowed bg-gray-100 text-gray-400 border border-gray-200"
                >
                  <TeacupIcon className="w-5 h-5 mb-1 opacity-50" />
                  {isCancelled ? '취소된 세션입니다' : booking.tab_status === 'completed' ? '종료된 세션입니다' : '시작 5분 전 입장 가능'}
                </button>
              )}
            </div>

            {/* 취소 버튼 */}
            {!isCancelled && (
              !cancelConfirm ? (
                <button
                  onClick={() => setCancelConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold transition bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-sm"
                >
                  <XCircle className="w-4 h-4" /> 예약 취소하기
                </button>
              ) : (
                <div className="rounded-2xl p-5 flex flex-col gap-3 bg-red-50 border border-red-200 shadow-sm">
                  <p className="text-xs text-center font-bold text-red-600">정말 티타임 예약을 취소하시겠습니까?</p>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => setCancelConfirm(false)}
                      disabled={isCancelling}
                      className="flex-1 py-2.5 rounded-lg text-xs font-bold bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      아니요
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className="flex-1 py-2.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isCancelling ? '취소 중...' : '취소 확정'}
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
