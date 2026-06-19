import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * 멘토의 패널티 내역을 가져와서 캘린더에서 쓰기 쉽게 가공해주는 커스텀 훅
 */
export default function usePenaltyData(mentorId, backendUrl) {
  const [penaltyMap, setPenaltyMap] = useState({});

  useEffect(() => {
    // 멘토 ID가 아직 없으면 실행하지 않음
    if (!mentorId) return;

    const fetchPenalties = async () => {
      try {
        // 💡 백엔드의 패널티 조회 API 주소를 상황에 맞게 수정해주세요!
        const response = await axios.get(`${backendUrl}/api/mentor/penalties/${mentorId}`);
        
        // 받아온 패널티 배열을 날짜(YYYY-MM-DD)를 키값으로 하는 객체로 변환합니다.
        // 예: { "2026-06-20": [{ type: "no_show", time: "14:00" }] }
        const mappedData = {};
        
        response.data.forEach((penalty) => {
          const date = penalty.date; // 패널티가 발생한 날짜
          if (!mappedData[date]) {
            mappedData[date] = [];
          }
          mappedData[date].push(penalty);
        });

        setPenaltyMap(mappedData);
      } catch (error) {
        console.error('❌ 패널티 내역을 불러오는데 실패했습니다:', error);
      }
    };

    fetchPenalties();
  }, [mentorId, backendUrl]);

  return penaltyMap; // 가공된 패널티 객체 반환
}