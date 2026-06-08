import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Send, Loader2 } from 'lucide-react'; // 💡 로딩 아이콘(Loader2) 추가
import axios from 'axios';

export default function CoffeeChatReview() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  
  // 💡 1. 텍스트 박스마다 상태(State)를 분리했습니다.
  const [userReview, setUserReview] = useState(''); // 유저가 직접 쓰는 리뷰
  const [summary, setSummary] = useState('');       // AI 대화 요약본
  const [aiAdvice, setAiAdvice] = useState('');     // AI 어드바이스
  
  const [isGenerating, setIsGenerating] = useState(true); // AI 로딩 상태

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  // 💡 2. 컴포넌트가 켜질 때 백엔드(파이썬 파이프라인)에서 요약본을 가져옵니다.
  useEffect(() => {
    const fetchAIData = async () => {
      try {
        setIsGenerating(true);
        const token = localStorage.getItem('token');
        
        // 백엔드 API 주소에 맞게 수정하세요 (예: /api/chat/{chatId}/summary)
        const response = await axios.get(`${BACKEND_URL}/api/chat/${chatId}/summary`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        // 백엔드에서 주는 JSON 키 이름에 맞게 수정하세요
        setSummary(response.data.summary_text || response.data.session_consensus || '');
        setAiAdvice(response.data.ai_advice || '');
        
      } catch (error) {
        console.error("AI 데이터를 불러오는 중 에러 발생:", error);
        setSummary("요약본을 불러오지 못했습니다.");
        setAiAdvice("어드바이스를 불러오지 못했습니다.");
      } finally {
        setIsGenerating(false);
      }
    };

    if (chatId) {
      fetchAIData();
    }
  }, [chatId, BACKEND_URL]);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('별점을 선택해주세요!');
      return;
    }
    
    // 💡 3. 서버로 리뷰 제출 로직 (예시)
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${BACKEND_URL}/api/reviews`, {
        chatId: chatId,
        rating: rating,
        review: userReview,
        // 필요하다면 요약본 데이터도 같이 넘길 수 있습니다.
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      alert('리뷰가 성공적으로 제출되었습니다!');
      navigate('/dashboard');
    } catch (error) {
      console.error("리뷰 제출 실패:", error);
      alert('제출에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          
          {/* 헤더 */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6">
              JS
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">티타임이 종료되었습니다</h1>
            <p className="text-gray-600">'상대방-수정필요' 님과의 세션이 완료되었습니다</p>
          </div>

          {/* 별점 평가 */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-4 text-center">티타임은 어떠셨나요?</h3>
            <div className="flex items-center justify-center gap-3 mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-12 h-12 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="text-center mb-2">
              <span className="text-2xl font-bold text-gray-900">
                {rating === 0 ? '별점을 선택해주세요' : `${rating}.0`}
              </span>
            </div>
          </div>

          {/* 💡 사용자가 직접 쓰는 리뷰 영역 */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">리뷰 남기기</h3>
            </div>
            <div className="bg-white rounded-lg p-4">
              <textarea
                value={userReview}
                onChange={(e) => setUserReview(e.target.value)}
                placeholder="상대방과의 티타임이 어땠는지 솔직한 후기를 남겨주세요."
                className="w-full h-32 p-3 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
              />
            </div>
          </div>

          {/* 💡 AI 요약 및 어드바이스 영역 */}
          <div className="mb-8 space-y-6">
            <div>
              <label className="flex items-center gap-2 font-bold text-gray-900 mb-3">
                대화내용 요약본 
                {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
              </label>
              <textarea
                value={isGenerating ? "AI가 대화 내용을 안전하게 마스킹하고 요약 중입니다..." : summary}
                readOnly // 💡 AI가 써준 글이므로 수정 불가 처리 (필요시 삭제 가능)
                rows={6}
                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none resize-none ${isGenerating ? 'text-gray-400 bg-gray-50' : 'text-gray-700 bg-white'}`}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 font-bold text-gray-900 mb-3">
                AI 어드바이스
                {isGenerating && <Loader2 className="w-4 h-4 animate-spin text-purple-500" />}
              </label>
              <textarea
                value={isGenerating ? "AI 페이스메이커가 맞춤형 조언을 생성하고 있습니다..." : aiAdvice}
                readOnly // 💡 수정 불가 처리
                rows={6}
                className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none resize-none ${isGenerating ? 'text-gray-400 bg-gray-50' : 'text-gray-700 bg-white'}`}
              />
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition shadow-lg flex items-center justify-center gap-3"
          >
            <Send className="w-5 h-5" />
            리뷰 제출하기
          </button>
          
        </div>
      </div>
    </div>
  );
}