import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. useNavigate 추가
import axios from 'axios';

const Announcements = () => {
  const [notices, setNotices] = useState([]);
  const [page, setPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false); // 2. 관리자 권한 상태 추가
  const navigate = useNavigate(); // 3. 네비게이션 훅 사용
  
  const limit = 10;
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  // 4. 권한 체크 로직
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      axios.get(`${BACKEND_URL}/api/user/${userId}`)
        .then(res => {
          // 서버에서 받아온 데이터의 role이 'admin'인지 확인
          setIsAdmin(res.data.role === 'ADMIN' || res.data.role === 'admin');
        })
        .catch(err => console.error("권한 체크 실패:", err));
    }
  }, []);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/announcements?skip=${(page - 1) * limit}&limit=${limit}`)
      .then(res => setNotices(res.data))
      .catch(err => console.error("공지사항 로드 실패", err));
  }, [page]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 5. 헤더 부분: 글쓰기 버튼 추가 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">공지사항</h1>
        {isAdmin && (
          <button 
            onClick={() => navigate('/announcement/write')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition"
          >
            공지사항 작성
          </button>
        )}
      </div>

      <div className="space-y-4">
        {notices.map(notice => (
          <div key={notice.id} className="p-4 border rounded-lg hover:shadow-md transition">
            <h2 className="font-bold text-lg">{notice.title}</h2>
            <p className="text-gray-600 mt-2 whitespace-pre-line">{notice.content}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-8 flex justify-center gap-4">
        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50">이전</button>
        <span className="py-2">{page} 페이지</span>
        <button onClick={() => setPage(page + 1)} className="px-4 py-2 bg-gray-200 rounded">다음</button>
      </div>
    </div>
  );
};

export default Announcements;