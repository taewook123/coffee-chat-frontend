import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import CoffeeChatReview from './CoffeeChatReview';
import HostChatReport from './HostChatReport';

export default function ChatEndPage() {
  const { chatId } = useParams(); // 여기서 chatId는 사실 booking_id 입니다.
  const [viewType, setViewType] = useState('loading');

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

    // 1. chatId를 booking_id로 사용하여 상세 정보를 바로 가져옵니다.
    // ChatSession 테이블을 id로 찾지 말고 booking_id로 찾으세요.
    axios.get(`${BACKEND_URL}/api/booking/detail/${chatId}`)
      .then(res => {
        const booking = res.data; // 여기엔 이미 mentor_user_id가 있습니다.
        const myId = localStorage.getItem('userId');
        
        console.log("나의 ID:", myId, "호스트 ID:", booking.mentor_user_id);

        if (String(booking.mentor_user_id) === String(myId)) {
          setViewType('host');
        } else {
          setViewType('mentee');
        }
      })
      .catch(err => {
        console.error("데이터 로드 오류:", err);
        setViewType('mentee');
      });
  }, [chatId]);

  if (viewType === 'loading') return <div>로딩 중...</div>;
  
  return viewType === 'host' ? <HostChatReport /> : <CoffeeChatReview />;
}