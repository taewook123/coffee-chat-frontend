import React from 'react';
import { 
  Calendar, MessageSquare, Star, ArrowUpRight, 
  Sparkles, DollarSign, Clock, Repeat, Coffee, Hourglass, 
  ChevronRight, BookOpen 
} from 'lucide-react';

export function StatCard({ icon: Icon, label, value, accent, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${accent}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="text-2xl font-bold text-[#1a2332] mb-0.5">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
      {sub && <div className="text-xs text-emerald-500 mt-1 font-medium">{sub}</div>}
    </div>
  );
}

export function SectionHeader({ title, action, onAction }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-[#1a2332]">{title}</h2>
      {action && (
        <button onClick={onAction} className="text-xs font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1">
          {action} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, message, cta, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-sm text-gray-400 mb-3">{message}</p>
      {cta && (
        <button onClick={onCta} className="text-xs font-semibold text-blue-500 hover:text-blue-600 border border-blue-200 px-4 py-2 rounded-full hover:bg-blue-50 transition-colors">
          {cta}
        </button>
      )}
    </div>
  );
}

export function StarRating({ rating }) {
  const r = isNaN(Number(rating)) ? 0 : Number(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(r) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
      ))}
      <span className="text-xs text-gray-500 ml-1">{r.toFixed(1)}</span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 호스트 (멘토) 대시보드 섹션
// ────────────────────────────────────────────────────────────────────────────
export function MentorSection({ isMentor, mentorStats, upcomingChats, recentReviews, setActiveTab, navigate }) {
  if (!isMentor) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">호스트 활동</span>
          </div>
          <h3 className="text-lg font-bold text-[#1a2332] mb-1">호스트로 등록해보세요</h3>
          <p className="text-sm text-gray-500">경험을 나누고 수익을 얻을 수 있어요.</p>
        </div>
        <button onClick={() => setActiveTab('profile')}
          className="flex-shrink-0 ml-6 bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-600 transition flex items-center gap-2">
          시작하기 <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 🌟 [핵심 해결] 백엔드에서 올 수 있는 모든 변수명을 싹 다 검사해서 잡아냅니다.
  const revenue = mentorStats?.monthly_earnings || mentorStats?.monthly_revenue || mentorStats?.revenue || mentorStats?.total_earnings || 0;
  const hours = mentorStats?.mentoring_hours || mentorStats?.total_hours || mentorStats?.hours || 0;
  const rating = mentorStats?.average_rating || mentorStats?.rating || 0;
  const rebookRate = mentorStats?.rebooking_rate || mentorStats?.rebookRate || 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-5 bg-amber-400 rounded-full" />
        <h2 className="text-base font-bold text-[#1a2332]">호스트 활동</h2>
        <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-medium">활성</span>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard icon={DollarSign} label="이번 달 수익" value={`₩${Number(revenue).toLocaleString()}`} accent="bg-emerald-500" sub="↑ 꾸준히 상승중" />
        <StatCard icon={Star}       label="평균 평점"   value={`${Number(rating).toFixed(1)}`} accent="bg-amber-400" />
        <StatCard icon={Clock}      label="총 멘토링"   value={`${hours}시간`} accent="bg-orange-400" />
        <StatCard icon={Repeat}     label="재예약률"     value={`${rebookRate}%`} accent="bg-violet-500" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHeader title="예정된 티타임" action="일정 관리" onAction={() => setActiveTab('schedule')} />
          {upcomingChats?.length === 0
            ? <EmptyState icon={Calendar} message="예정된 티타임이 없습니다." />
            : <ul className="space-y-2">
                {upcomingChats?.slice(0, 4).map((c, i) => (
                  <li key={c.id || i} onClick={() => c.id && navigate(`/coffee-chat-detail/${c.id}`)}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-[#1a2332]">{c.mentee_name || c.partner_name || '티타임 참여자'}</p>
                      <p className="text-xs text-gray-400">{c.scheduled_time || c.booking_date || '일정 미정'}</p>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">{c.status === 'CONFIRMED' ? '확정됨' : '예정'}</span>
                  </li>
                ))}
              </ul>
          }
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHeader title="최근 리뷰" />
          {recentReviews?.length === 0
            ? <EmptyState icon={MessageSquare} message="아직 받은 리뷰가 없습니다." />
            : <ul className="space-y-3">
                {recentReviews?.slice(0, 3).map((r, i) => (
                  <li key={i} className="pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-[#1a2332]">{r.author_name || r.mentee_name || '익명'}</span>
                      <StarRating rating={r.rating || 5} />
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">{r.content || r.review || r.comment || '내용 없음'}</p>
                  </li>
                ))}
              </ul>
          }
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// 게스트 (멘티) 대시보드 섹션
// ────────────────────────────────────────────────────────────────────────────
export function MenteeSection({ menteeStats, upcomingBookings, mentorHistory, setActiveTab, navigate }) {
  
  // 🌟 [핵심 해결] 백엔드 변수명을 모두 캐치하고, '시간' 값이 없으면 '횟수 * 0.5'로 자동 계산!
  const chats = menteeStats?.total_chats || menteeStats?.completed_sessions || menteeStats?.chats || 0;
  const hours = menteeStats?.learning_hours || menteeStats?.total_hours || menteeStats?.hours || (chats * 0.5);
  const pending = menteeStats?.pending_requests || menteeStats?.pending_bookings || menteeStats?.pending || 0;
  const reviews = menteeStats?.written_reviews || menteeStats?.my_reviews || menteeStats?.reviews || 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1.5 h-5 bg-blue-500 rounded-full" />
        <h2 className="text-base font-bold text-[#1a2332]">게스트 활동</h2>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard icon={Coffee}        label="참여한 티타임" value={`${chats}회`} accent="bg-blue-500" />
        <StatCard icon={Clock}         label="총 학습 시간"  value={`${hours}시간`} accent="bg-cyan-500" />
        <StatCard icon={Hourglass}     label="수락 대기"     value={`${pending}건`} accent="bg-orange-400" />
        <StatCard icon={MessageSquare} label="작성한 후기"   value={`${reviews}개`} accent="bg-emerald-500" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHeader title="다가오는 예약" action="예약 내역" onAction={() => setActiveTab('history')} />
          {upcomingBookings?.length === 0
            ? <EmptyState icon={Calendar} message="예정된 티타임이 없어요." cta="호스트 찾기" onCta={() => navigate('/mentors')} />
            : <ul className="space-y-2">
                {upcomingBookings?.slice(0, 4).map((b, i) => (
                  <li key={b.id || i} onClick={() => b.id && navigate(`/coffee-chat-detail/${b.id}`)}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-[#1a2332]">{b.mentor_name || b.partner_name || '호스트'}</p>
                      <p className="text-xs text-gray-400">{b.scheduled_time || b.booking_date || '일정 미정'}</p>
                    </div>
                    <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-medium">{b.status === 'CONFIRMED' ? '확정됨' : '예정'}</span>
                  </li>
                ))}
              </ul>
          }
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <SectionHeader title="최근 만난 호스트" />
          {(!Array.isArray(mentorHistory) || mentorHistory.length === 0)
            ? <EmptyState icon={BookOpen} message="아직 티타임 기록이 없어요." cta="첫 티타임 예약하기" onCta={() => navigate('/host-list')} />
            : <ul className="space-y-3">
                {mentorHistory?.slice(0, 4).map((m, i) => (
                  <li key={i} className="flex items-center gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(m.name || m.mentor_name || 'M').slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1a2332] truncate">{m.name || m.mentor_name || '호스트'}</p>
                      <p className="text-xs text-gray-400 truncate">{m.topic || m.company || '—'}</p>
                    </div>
                    {m.my_rating && <StarRating rating={m.my_rating} />}
                  </li>
                ))}
              </ul>
          }
        </div>
      </div>
    </div>
  );
}