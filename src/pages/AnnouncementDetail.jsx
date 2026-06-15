import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

export default function AnnouncementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notice, setNotice] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  useEffect(() => {
    // 1. 공지사항 데이터 불러오기
    axios.get(`${BACKEND_URL}/api/announcements/${id}`)
      .then(res => setNotice(res.data))
      .catch(err => {
        alert('공지사항을 불러올 수 없습니다.');
        navigate('/announcements');
      });

    // 2. 관리자 권한 체크 (수정/삭제 버튼 노출용)
    const userId = localStorage.getItem('userId');
    if (userId) {
      axios.get(`${BACKEND_URL}/api/user/${userId}`)
        .then(res => {
          if (res.data.role === 'ADMIN' || res.data.role === 'admin') {
            setIsAdmin(true);
          }
        }).catch(err => console.error(err));
    }
  }, [id, BACKEND_URL, navigate]);

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('access_token');
      await axios.delete(`${BACKEND_URL}/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('삭제되었습니다.');
      navigate('/announcements');
    } catch (error) {
      alert('삭제 권한이 없거나 오류가 발생했습니다.');
    }
  };

  if (!notice) return <div className="min-h-screen bg-gray-50 flex justify-center items-center">로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 font-sans text-gray-900">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* 상단 헤더 */}
        <header className="flex justify-between items-center px-8 py-6 border-b border-gray-100">
          <button onClick={() => navigate('/announcements')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-bold transition">
            <ArrowLeft className="w-5 h-5" /> 목록으로
          </button>
          
          {/* 관리자 전용 수정/삭제 버튼 */}
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={() => navigate(`/announcement/edit/${id}`)} className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 font-bold transition">
                <Edit className="w-4 h-4" /> 수정
              </button>
              <button onClick={handleDelete} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-bold transition">
                <Trash2 className="w-4 h-4" /> 삭제
              </button>
            </div>
          )}
        </header>

        {/* 본문 내용 */}
        <div className="p-8 md:p-12">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{notice.title}</h1>
          <p className="text-sm text-gray-400 mb-8 pb-8 border-b border-gray-100">
            {new Date(notice.created_at).toLocaleDateString()} 작성
          </p>
          <div className="text-gray-700 leading-loose whitespace-pre-wrap text-lg">
            {notice.content}
          </div>
        </div>

      </div>
    </div>
  );
}