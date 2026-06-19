import { useState, useEffect } from 'react';
import axios from 'axios';

export default function usePenaltyData(mentorId, backendUrl) {
  const [penaltyMap, setPenaltyMap] = useState({});

  useEffect(() => {
    if (!mentorId) return;

    const fetchPenalties = async () => {
      try {
        // 💡 백엔드 API 주소 (필요 시 실제 주소에 맞게 변경)
        const response = await axios.get(`${backendUrl}/api/mentor/penalties/${mentorId}`);
        
        const mappedData = {};
        response.data.forEach((penalty) => {
          const date = penalty.date;
          if (!mappedData[date]) mappedData[date] = [];
          mappedData[date].push(penalty);
        });

        setPenaltyMap(mappedData);
      } catch (error) {
        console.error('❌ 패널티 내역을 불러오는데 실패했습니다:', error);
      }
    };

    fetchPenalties();
  }, [mentorId, backendUrl]);

  return penaltyMap;
}