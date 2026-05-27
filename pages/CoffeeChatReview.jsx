import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Star, Send } from 'lucide-react';

export default function CoffeeChatReview() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');

  const handleSubmit = () => {
    if (rating === 0) {
      alert('별점을 선택해주세요!');
      return;
    }
    // 여기에 리뷰 제출 로직이 들어갑니다.
    alert('리뷰가 성공적으로 제출되었습니다!');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          {/* 헤더 (Header) */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6">
              JS
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">커피챗이 종료되었습니다</h1>
            <p className="text-gray-600">'상대방-수정필요' 님과의 세션이 완료되었습니다</p>
          </div>

          {/* 별점 평가 영역 (Rating Section) */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-4 text-center">커피챗은 어떠셨나요?</h3>

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

          {/* 확정 질문지 영역 (Confirmed Questions Section) */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">리뷰</h3>
            </div>

            <div className="bg-white rounded-lg p-4">
              <textarea
                            className="w-full h-32 p-3 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
                          />
            </div>
          </div>

          {/* 리뷰 작성 영역 (Review Text Area) */}
          <div className="mb-8">
            <label className="block font-bold text-gray-900 mb-3">
              대화내용 요약본
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 resize-none"
            />
            <label className="block font-bold text-gray-900 mb-3">
              AI 어드바이스
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              {review.length} / 500 자
            </p>
          </div>

          {/* 제출 버튼 (Submit Button) */}
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