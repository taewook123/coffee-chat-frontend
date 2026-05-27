import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios';
 
// 슬롯 상태 상수
const SLOT_STATUS = {
  AVAILABLE: 'available', // 멘토가 설정한 가능 시간
  BOOKED: 'booked',       // 멘티가 예약 확정한 시간
};
 
export default function ScheduleManager() {
  const [date, setDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
 
  // ─── [정밀 리팩토링] 새로고침 시 대소문자 무관 완벽 데이터 동기화 및 복원 ───
  useEffect(() => {
    const fetchSchedule = async () => {
      let savedId = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('user_id') || "13";
      
      // 숫자 외 기생 문자열 청소 가위질
      const cleanId = parseInt(savedId.toString().replace(/[^0-9]/g, ''), 10);

      try {
        setInitialLoading(true);
        // 백엔드 교차 검증 엔드포인트로 유저 PK 전달하여 예약/가용 데이터 한번에 수신
        const res = await axios.get(`http://48.211.169.52:8000/api/mentor/availability/${cleanId}`);
        setScheduleData(res.data);
      } catch (error) {
        console.error('일정 불러오기 실패:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    fetchSchedule();
  }, []);
 
  // 패널티 취소 확인 모달 상태
  const [penaltyModal, setPenaltyModal] = useState({
    open: false,
    time: null,
    penaltyLoading: false,
  });
 
  const formatDate = (d) => d.toISOString().split('T')[0];
  const currentDateKey = formatDate(date);
 
  // 현재 시각 (렌더마다 최신 유지)
  const now = new Date();
  const todayKey = formatDate(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
 
  // 선택한 날짜가 과거 날짜인지 여부
  const isSelectedDatePast = currentDateKey < todayKey;
 
  // 특정 시간 슬롯이 비활성화되어야 하는지 판단
  const isSlotDisabled = (time) => {
    if (currentDateKey < todayKey) return true; // 과거 날짜 전체 비활성
    if (currentDateKey === todayKey) {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m <= nowMinutes; // 오늘 중 현재 시각 이전 슬롯 비활성
    }
    return false;
  };
 
  // 00:00 ~ 23:30 까지 30분 단위 슬롯 48개
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2).toString().padStart(2, '0');
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour}:${minute}`;
  });
 
  const currentDaySlots = scheduleData[currentDateKey] || {};
 
  // ─── 슬롯 토글 ───────────────────────────────────────────
  const toggleSlot = (time) => {
    if (isSlotDisabled(time)) return; // 과거 슬롯은 조작 불가
    const rawStatus = currentDaySlots[time];
    
    // 💡 백엔드 대소문자 혼용 유연 방어 가드 탑재
    const status = rawStatus ? rawStatus.toString().toLowerCase().trim() : null;
 
    // 1) 예약 확정 슬롯 → 취소 시 패널티 모달 가동
    if (status === 'booked' || status === SLOT_STATUS.BOOKED) {
      setPenaltyModal({ open: true, time, penaltyLoading: false });
      return;
    }
 
    // 2) available 토글 (추가/제거)
    setScheduleData((prev) => {
      const day = { ...(prev[currentDateKey] || {}) };
      if (day[time]) {
        delete day[time];
      } else {
        day[time] = SLOT_STATUS.AVAILABLE;
      }
      return { ...prev, [currentDateKey]: day };
    });
  };
 
  // ─── 패널티 확인 후 취소 ─────────────────────────────────
  const confirmPenaltyCancel = async () => {
    const { time } = penaltyModal;
    let savedId = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('user_id') || "13";
    const cleanId = parseInt(savedId.toString().replace(/[^0-9]/g, ''), 10);
 
    setPenaltyModal((prev) => ({ ...prev, penaltyLoading: true }));
 
    try {
      await axios.post(`http://48.211.169.52:8000/api/mentor/penalty`, {
        mentor_id: cleanId,
        date: currentDateKey,
        time,
        reason: 'mentor_cancelled_booked_slot',
      });
 
      setScheduleData((prev) => {
        const day = { ...(prev[currentDateKey] || {}) };
        delete day[time];
        return { ...prev, [currentDateKey]: day };
      });
 
      alert(`⚠️ ${currentDateKey} ${time} 슬롯이 취소되었습니다. 패널티가 부여되었습니다.`);
    } catch (error) {
      console.error('패널티 처리 실패:', error);
      alert('처리에 실패했습니다. 서버 상태를 확인해주세요.');
    } finally {
      setPenaltyModal({ open: false, time: null, penaltyLoading: false });
    }
  };
 
  // ─── 전체 저장 ───────────────────────────────────────────
  const handleSaveAll = async () => {
    setLoading(true);
    
    let savedId = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('user_id') || "13";
    const cleanId = parseInt(savedId.toString().replace(/[^0-9]/g, ''), 10);
  
    // 서버에는 오직 'available' 슬롯 목록만 골라서 전송
    const availableOnly = {};
    for (const [dateKey, slots] of Object.entries(scheduleData)) {
      const times = Object.entries(slots)
        .filter(([, rawStatus]) => {
          const status = rawStatus ? rawStatus.toString().toLowerCase().trim() : '';
          return status === 'available';
        })
        .map(([time]) => time)
        .sort();
      if (times.length > 0) availableOnly[dateKey] = times;
    }
  
    try {
      await axios.post(`http://48.211.169.52:8000/api/mentor/availability/bulk`, {
        mentor_id: cleanId, 
        schedules: availableOnly,
      });
      alert('🎉 모든 일정이 성공적으로 DB에 저장되었습니다!');
    } catch (error) {
      console.error('저장 실패:', error);
      const errorMsg = error.response?.data?.detail || '저장에 실패했습니다. 서버 상태를 확인해주세요.';
      alert(`❌ 저장 실패: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };
 
  // ─── [정밀 조율] 대소문자 혼용 통합 문자열 매핑 스타일러 분기 ───
  const getSlotStyle = (time) => {
    if (isSlotDisabled(time)) {
      return 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed line-through';
    }
    const rawStatus = currentDaySlots[time];
    const status = rawStatus ? rawStatus.toString().toLowerCase().trim() : null;

    if (status === 'booked') {
      return 'bg-red-100 text-red-700 border-red-300 font-bold cursor-pointer hover:bg-red-200';
    }
    if (status === 'available') {
      return 'bg-[#4a90e2] text-white border-[#4a90e2] font-bold hover:bg-[#357abd]';
    }
    return 'bg-white text-gray-700 border-gray-300 hover:border-[#4a90e2] hover:bg-blue-50';
  };
 
  // ─── 달력 작은 점 표시 가드 ───
  const tileContent = ({ date: tileDate }) => {
    const dateKey = formatDate(tileDate);
    const slots = scheduleData[dateKey] || {};
    const hasAvailable = Object.values(slots).some((s) => s && s.toString().toLowerCase().trim() === 'available');
    const hasBooked = Object.values(slots).some((s) => s && s.toString().toLowerCase().trim() === 'booked');
    return (
      <div className="flex justify-center gap-0.5 mt-1">
        {hasAvailable && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />}
        {hasBooked && <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
      </div>
    );
  };
 
  const availableCount = Object.values(currentDaySlots).filter((s) => s && s.toString().toLowerCase().trim() === 'available').length;
  const bookedCount = Object.values(currentDaySlots).filter((s) => s && s.toString().toLowerCase().trim() === 'booked').length;
 
  if (initialLoading) {
    return (
      <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">스케줄 정보를 안전하게 동기화하는 중...</p>
        </div>
      </div>
    );
  }
 
  return (
    <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-2xl font-bold text-[#1a2332] mb-2">멘토링 일정 관리</h2>
 
      <div className="flex gap-4 mb-6 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-[#4a90e2]" />
          가능 시간
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-red-300" />
          예약 확정 (취소 시 패널티)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded border border-gray-200 bg-gray-100" />
          지난 시간 (비활성)
        </span>
      </div>
 
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <h3 className="font-semibold mb-3">날짜 선택</h3>
          <Calendar
            onChange={setDate}
            value={date}
            locale="en-US"
            calendarType="gregory"
            className="w-full rounded-lg border-gray-200"
            tileContent={tileContent}
            tileDisabled={({ date: tileDate }) => formatDate(tileDate) < todayKey}
          />
        </div>
 
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-lg">{currentDateKey} 가능한 시간</h3>
            <div className="flex gap-3 text-sm text-gray-500">
              {isSelectedDatePast ? (
                <span className="text-gray-400 italic">지난 날짜 — 수정 불가</span>
              ) : (
                <>
                  <span>가능: <strong className="text-blue-600">{availableCount}</strong>개</span>
                  <span>예약: <strong className="text-red-500">{bookedCount}</strong>개</span>
                </>
              )}
            </div>
          </div>
 
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-6">
            {timeSlots.map((time) => {
              const disabled = isSlotDisabled(time);
              const rawStatus = currentDaySlots[time];
              const isBooked = rawStatus && rawStatus.toString().toLowerCase().trim() === 'booked';
              return (
              <button
                key={time}
                onClick={() => toggleSlot(time)}
                disabled={disabled}
                className={`py-2 px-1 text-xs sm:text-sm rounded border transition-colors ${getSlotStyle(time)}`}
              >
                {time}
                {isBooked && !disabled && (
                  <span className="block text-[9px] leading-tight">예약됨</span>
                )}
              </button>
              );
            })}
          </div>
 
          <button
            onClick={handleSaveAll}
            disabled={loading}
            className={`w-full py-4 rounded-lg font-bold transition ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1a2332] text-white hover:bg-black'
            }`}
          >
            {loading ? '모든 일정 한 번에 저장하는 중...' : '모든 일정 한 번에 저장하기'}
          </button>
        </div>
      </div>
    </div>
  );
}