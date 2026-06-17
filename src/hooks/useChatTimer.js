import { useState, useEffect } from 'react';

export function useChatTimer(booking, handleEndCall) {
  const [duration, setDuration] = useState(0);

  // 1. 1초마다 진행 시간 증가
  useEffect(() => {
    const timer = setInterval(() => setDuration(p => p + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. 예약 시간 기준 30분 후 강제 종료 로직
  useEffect(() => {
    const dateStr = booking?.booking_date || booking?.bookingDate;
    const timeStr = booking?.booking_time || booking?.bookingTime;

    if (!dateStr || !timeStr) return;

    const scheduledTime = new Date(`${dateStr}T${timeStr}:00`).getTime();
    const endTime = scheduledTime + (30 * 60 * 1000);

    const timer = setInterval(() => {
      if (Date.now() >= endTime) {
        clearInterval(timer);
        alert("⏰ 예정된 커피챗 시간(30분)이 모두 경과되어 세션이 자동 종료됩니다.");
        handleEndCall();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [booking, handleEndCall]);

  // 화면에 띄워줄 포맷 (예: 05:23)
  const formattedDuration = `${Math.floor(duration / 60).toString().padStart(2, '0')}:${(duration % 60).toString().padStart(2, '0')}`;

  return { duration, formattedDuration };
}