import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const WriteAnnouncement = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.strip() || !content.strip()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      // 💡 관리자 인증을 위해 토큰을 헤더에 실어서 보냅니다.
      const token = localStorage.getItem('token');
      
      // 백엔드의 POST /api/announcements API 호출
      await axios.post(
        `${BACKEND_URL}/api/announcements`, 
        { title, content },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('공지사항이 성공적으로 등록되었습니다.');
      navigate('/announcements'); // 작성 후 목록으로 이동
    } catch (err) {
      console.error(err);
      alert('공지사항 등록에 실패했습니다. 관리자 권한을 확인하세요.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-6">공지사항 작성 (관리자 전용)</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
          <input 
            type="text"
            className="w-full border p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="공지사항 제목을 입력하세요" 
            value={title}
            onChange={(e) => setTitle(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
          <textarea 
            className="w-full border p-2 h-60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
            placeholder="공지사항 내용을 입력하세요" 
            value={content}
            onChange={(e) => setContent(e.target.value)} 
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button 
            type="button" 
            onClick={() => navigate('/announcements')} 
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
          >
            취소
          </button>
          <button 
            type="submit" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-bold"
          >
            작성 완료
          </button>
        </div>
      </form>
    </div>
  );
};

export default WriteAnnouncement;