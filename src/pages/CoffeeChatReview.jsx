import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Send } from 'lucide-react';
import axios from 'axios';

export default function CoffeeChatReview() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [review, setReview] = useState('');
  const [booking, setBooking] = useState(null);
  const [session, setSession] = useState(null);
  const BACKEND_URL = 'http://localhost:8000';

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    // 예약 정보 가져오기
    axios.get(`${BACKEND_URL}/api/bookings/${userId}`)
      .then(res => {
        const found = res.data.find(b => String(b.id) === String(chatId));
        if (found) setBooking(found);
      })
      .catch(err => console.error(err));

    // 세션 정보 가져오기
    axios.get(`${BACKEND_URL}/api/chat-session/${chatId}`)
      .then(res => {
        setSession(res.data);
        // AI 요약본 있으면 자동으로 채우기
        if (res.data.ai_summary) {
          setReview(res.data.ai_summary);
        }
      })
      .catch(err => console.error(err));
  }, [chatId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('별점을 선택해주세요!');
      return;
    }

    try {
      const userId = localStorage.getItem('userId');
      await axios.post(`${BACKEND_URL}/api/review/create`, {
        booking_id: Number(chatId),
        user_id: Number(userId),
        mentor_id: booking?.mentor_id || 0,
        rating: rating,
        review: review
      });
      alert('리뷰가 성공적으로 제출되었습니다!');
      navigate('/coffee-chats');
    } catch (err) {
      console.error('리뷰 제출 실패:', err);
      alert('리뷰 제출에 실패했어요');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          {/* 헤더 */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6">
              {booking?.mentor_name?.slice(0, 1) || '멘'}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              커피챗이 종료되었습니다
            </h1>
            <p className="text-gray-600">
              {booking?.mentor_name || '멘토'} 님과의 세션이 완료되었습니다
            </p>
            {/* 진행 시간 표시 */}
            {session?.duration_sec && (
              <p className="text-sm text-gray-400 mt-1">
                진행 시간: {Math.floor(session.duration_sec / 60)}분 {session.duration_sec % 60}초
              </p>
            )}
          </div>

          {/* 별점 */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-4 text-center">
              커피챗은 어떠셨나요?
            </h3>
            <div className="flex items-center justify-center gap-3 mb-4">
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
            <div className="text-center">
              <span className="text-2xl font-bold text-gray-900">
                {rating === 0 ? '별점을 선택해주세요' : `${rating}.0`}
              </span>
            </div>
          </div>

          {/* 리뷰 작성 */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-3">리뷰</h3>
            <textarea
              className="w-full h-32 p-3 text-sm text-gray-700 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="멘토와의 대화는 어떠셨나요?"
            />
          </div>

          {/* 대화내용 요약본 */}
          <div className="mb-6">
            <label className="block font-bold text-gray-900 mb-3">
              대화내용 요약본
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={6}
              placeholder="대화 내용을 요약해주세요"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* AI 어드바이스 */}
          <div className="mb-8">
            <label className="block font-bold text-gray-900 mb-3">
              AI 어드바이스
            </label>
            <textarea
              rows={6}
              placeholder="AI 어드바이스가 여기에 표시돼요"
              readOnly
              className="w-full px-4 py-3 border-2 border-gray-100 bg-gray-50 rounded-xl outline-none resize-none text-gray-500"
            />
            <p className="text-sm text-gray-500 mt-2">
              {review.length} / 500 자
            </p>
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