import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Send, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function CoffeeChatReview() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [booking, setBooking] = useState(null);
  const [session, setSession] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    axios.get(`${BACKEND_URL}/api/booking/mentee/${userId}`)
      .then(res => {
        const found = res.data.find(b => String(b.booking_id) === String(chatId));
        if (found) setBooking(found);
      })
      .catch(err => console.error(err));

    axios.get(`${BACKEND_URL}/api/chat-session/${chatId}`)
      .then(res => setSession(res.data))
      .catch(err => console.error(err));
  }, [chatId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('별점을 선택해주세요!');
      return;
    }
    if (!reviewText.trim()) {
      alert('리뷰를 작성해주세요!');
      return;
    }

    setSubmitting(true);
    try {
      const userId = localStorage.getItem('userId');
      await axios.post(`${BACKEND_URL}/api/booking/review/create`, {
        booking_id: Number(chatId),
        user_id: Number(userId),
        mentor_id: booking?.mentor_id || 0,
        rating: rating,
        review: reviewText
      });
      setSubmitted(true); 
    } catch (err) {
      console.error('리뷰 제출 실패:', err);
      alert('리뷰 제출에 실패했어요');
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels = ['', '별로예요', '그저 그래요', '괜찮아요', '좋아요', '최고예요!'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-2xl p-10">

          {/* 헤더 */}
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 overflow-hidden">
              {booking?.partner_image
                ? <img src={booking.partner_image} alt="" className="w-full h-full object-cover" />
                : booking?.partner_name?.slice(0, 1) || '멘'}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              티타임이 종료됐어요!
            </h1>
            <p className="text-gray-500">
              {booking?.partner_name || '멘토'} 님과의 대화 어떠셨나요?
            </p>
            {session?.duration_sec && (
              <p className="text-sm text-gray-400 mt-1">
                진행 시간: {Math.floor(session.duration_sec / 60)}분 {session.duration_sec % 60}초
              </p>
            )}
          </div>

          {/* 별점 */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-4 text-center text-lg">
              별점을 남겨주세요
            </h3>
            <div className="flex items-center justify-center gap-2 mb-3">
              {/* 👇 변수명 에러를 방지하기 위해 (별) -> (star)로 통일했습니다 */}
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => !submitted && setRating(star)}
                  onMouseEnter={() => !submitted && setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                  disabled={submitted}
                >
                  <Star
                    className={`w-12 h-12 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-gray-500 text-sm h-5">
              {ratingLabels[hoveredRating || rating]}
            </p>
          </div>

          {/* 리뷰 작성 */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-3">리뷰 작성</h3>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={5}
              maxLength={500}
              disabled={submitted}
              placeholder="멘토와의 대화는 어떠셨나요? 솔직한 후기를 남겨주세요 😊"
              className={`w-full px-4 py-3 border-2 rounded-xl outline-none resize-none text-gray-700 text-sm ${
                submitted 
                  ? 'border-gray-100 bg-gray-50 text-gray-400' 
                  : 'border-gray-200 focus:border-blue-400'
              }`}
            />
            <p className="text-right text-xs text-gray-400 mt-1">
              {reviewText.length} / 500
            </p>
          </div>

          {/* 제출 완료 메시지 */}
          {submitted && (
            <div className="flex items-center justify-center gap-2 mb-6 py-3 bg-green-50 rounded-xl border border-green-100">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <p className="text-green-600 font-semibold text-sm">리뷰가 완료되었습니다!</p>
            </div>
          )}

          {/* 버튼들 */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting || submitted}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition shadow-lg flex items-center justify-center gap-2 ${
                submitted
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white'
              }`}
            >
              <Send className="w-5 h-5" />
              {submitting ? '제출 중...' : submitted ? '리뷰 완료' : '리뷰 제출하기'}
            </button>

            {/* ✨ 여기가 수정된 AI 요약 버튼입니다! ✨ */}
            {/* 리뷰 제출 전: 경고 알림 / 리뷰 제출 후: 리포트 페이지로 이동 */}
            <button
              onClick={() => submitted ? navigate(`/coffee-chats/report/${chatId}`) : alert('리뷰를 먼저 제출해주세요!')}
              className={`w-full py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                submitted
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              📋 AI 요약 확인하기
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
