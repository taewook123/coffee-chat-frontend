import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

export default function InquiryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);  // ✅ user_id 상태

  const [formData, setFormData] = useState({
    category: '일반 문의',
    title: '',
    email: '',
    body: '',   // ✅ 백엔드 필드명 body
  });

  const categories = ['일반 문의', '호스트 지원 문의', '결제/환불', '시스템 오류 제보', '기타'];

  // ✅ 로그인 체크 + user_id + email 자동완성
  useEffect(() => {
    const token = localStorage.getItem('token');
    const rawId = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('user_id');
    const cleanId = rawId ? parseInt(rawId.toString().replace(/[^0-9]/g, ''), 10) : null;

    if (!token) {
      alert('1:1 문의는 로그인 후 이용 가능합니다. 로그인 페이지로 이동합니다.');
      navigate('/login', { replace: true });
      return;
    }

    if (cleanId && !isNaN(cleanId)) {
      setUserId(cleanId);  // ✅ user_id 저장
      axios.get(`${BACKEND_URL}/api/user/${cleanId}`)
        .then(res => {
          if (res.data?.email) {
            setFormData(prev => ({ ...prev, email: res.data.email }));
          }
        })
        .catch(err => console.error("유저 정보 로드 실패:", err));
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ FastAPI 422 에러 파싱
  function parseAxiosError(error) {
    const data = error?.response?.data;
    if (!data) return '문의 제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    if (Array.isArray(data.detail)) return data.detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
    if (typeof data.detail === 'string') return data.detail;
    if (typeof data === 'string') return data;
    return '문의 제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  }

  // ✅ 이메일 검증 완화 — @만 있으면 허용 (123456@kakao.com 같은 형태 포함)
  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+$/.test(val.trim());
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.body.trim() || !formData.email.trim()) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    if (!isValidEmail(formData.email)) {
      alert('이메일 형식이 올바르지 않습니다. (예: example@email.com)');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        category: formData.category,
        title: formData.title,
        body: formData.body,
        email: formData.email.trim(),
        user_id: userId,  // ✅ localStorage에서 가져온 user_id 전송
      };

      const response = await axios.post(`${BACKEND_URL}/api/support/inquiries`, payload);

      if (response.status === 200 || response.status === 201) {
        alert('🚀 문의가 성공적으로 접수되었습니다. 빠른 시일 내에 답변드리겠습니다!');
        navigate('/');
      }
    } catch (error) {
      console.error('1:1 문의 제출 실패:', error);
      alert(parseAxiosError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#f8f9fa] min-h-screen py-16 px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-solid border-gray-100 p-8 md:p-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-[#1a2332] mb-3 m-0">1:1 문의하기</h2>
          <p className="text-gray-500 text-sm m-0 font-medium">서비스 이용 중 궁금한 점이나 불편한 사항을 남겨주시면 친절히 답변드리겠습니다.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 문의 유형 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">문의 유형 <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button key={cat} type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                  className={`py-2.5 px-3 text-xs font-bold rounded-lg border border-solid transition-all duration-200 cursor-pointer ${
                    formData.category === cat
                      ? 'bg-blue-50 border-[#4a90e2] text-[#4a90e2]'
                      : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 이메일 — type="text"로 변경해서 브라우저 자체 이메일 검증 우회 */}
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
              답변받을 이메일 <span className="text-red-500">*</span>
            </label>
            <input type="text" id="email" name="email"
              value={formData.email} onChange={handleChange}
              placeholder="example@coffeechat.com"
              className="w-full px-4 py-3 border border-solid border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4a90e2] transition-colors"
              required />
          </div>

          {/* 제목 */}
          <div>
            <label htmlFor="title" className="block text-sm font-bold text-gray-700 mb-2">
              문의 제목 <span className="text-red-500">*</span>
            </label>
            <input type="text" id="title" name="title"
              value={formData.title} onChange={handleChange}
              placeholder="제목을 입력해주세요."
              className="w-full px-4 py-3 border border-solid border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4a90e2] transition-colors"
              required />
          </div>

          {/* 문의 내용 — name="body" */}
          <div>
            <label htmlFor="body" className="block text-sm font-bold text-gray-700 mb-2">
              문의 내용 <span className="text-red-500">*</span>
            </label>
            <textarea id="body" name="body"
              value={formData.body} onChange={handleChange}
              rows="6" maxLength={1000}
              placeholder="문의하실 내용을 구체적으로 적어주시면 더 정확한 답변이 가능합니다. (최대 1000자)"
              className="w-full px-4 py-3 border border-solid border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#4a90e2] transition-colors resize-none leading-relaxed"
              required />
          </div>

          {/* 안내 */}
          <div className="bg-gray-50 p-4 rounded-xl border border-solid border-gray-100">
            <p className="text-[11px] text-gray-500 m-0 leading-relaxed font-medium">
              • 접수된 문의는 순차적으로 답변드리며, 주말 및 공휴일에는 답변이 지연될 수 있습니다.<br />
              • 개인정보가 포함된 문의의 경우 본인 확인을 위한 추가 절차가 진행될 수 있습니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-4 pt-2">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 py-3.5 bg-gray-100 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-200 transition duration-200 border-0 cursor-pointer">
              취소
            </button>
            <button type="submit" disabled={loading}
              className={`flex-1 py-3.5 text-white font-bold text-sm rounded-xl shadow-md transition duration-200 border-0 cursor-pointer ${
                loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-[#4a90e2]'
              }`}>
              {loading ? '제출 중...' : '문의하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}