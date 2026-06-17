import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Star, Briefcase, ChevronLeft, MessageSquare, Heart, Code, Rocket } from 'lucide-react';

export default function MentorDetails() {
  const { id } = useParams(); 
  const [mentorData, setMentorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  useEffect(() => {
    const fetchMentorDetails = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/mentors/${id}`);
        if (!response.ok) throw new Error("로드 실패");
        
        const data = await response.json();

        const safeParse = (val) => {
          let arr = [];
          if (Array.isArray(val)) arr = val;
          else if (typeof val === 'string') {
            try { arr = JSON.parse(val); } catch { return []; }
          }
          
          return arr.map(item => {
            if (typeof item === 'object' && item !== null) {
              return item.text || item.title || item.value || JSON.stringify(item);
            }
            return item;
          });
        };

        setMentorData({
          ...data,
          career_history: safeParse(data.career_history),
          mentoring_topics: safeParse(data.mentoring_topics),
          detailed_experience: safeParse(data.detailed_experience)
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchMentorDetails();
  }, [id]);
  
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/booking/reviews/${id}`)
      .then(res => res.json())
      .then(data => setReviews(data))
      .catch(err => console.error(err));
  }, [id]);

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!mentorData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-gray-500 font-semibold">존재하지 않거나 등록되지 않은 호스트 프로필입니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/mentors" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition no-underline">
            <ChevronLeft className="w-5 h-5" />
            다른 호스트들 만나러 가기
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-3">
        <h1 className="!text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          호스트와 대화하기
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 sticky top-8">
              <div className="mb-6">
                <img
                  src={
                    mentorData.profile_image && 
                    mentorData.profile_image !== 'null' && 
                    mentorData.profile_image !== 'undefined' &&
                    !mentorData.profile_image.includes('photo-1573497019940') 
                      ? (mentorData.profile_image.startsWith('http') || mentorData.profile_image.startsWith('data:')
                        ? mentorData.profile_image
                        : `data:image/jpeg;base64,${mentorData.profile_image}`)
                      : 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'
                  }
                  onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'; }}
                  alt={mentorData.name}
                  className="w-60 h-60 rounded-2xl object-cover mx-auto mb-4 ring-4 ring-slate-100 shadow-sm transition duration-300 bg-gray-100"
                />
              </div>

              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{mentorData.name}</h2>
                <p className="text-gray-600 font-medium text-sm m-0">{mentorData.job_title}</p>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  지나온 발자취
                </h3>
                <div className="space-y-3">
                  {mentorData.career_history.map((history, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-gray-700 bg-slate-50 p-2.5 rounded-lg border border-gray-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></span>
                      <p className="m-0 font-medium leading-relaxed">{history}</p>
                    </div>
                  ))}
                  {mentorData.career_history.length === 0 && (
                    <p className="text-xs text-gray-400 text-center m-0 py-2">등록된 발자취가 없습니다.</p>
                  )}
                </div>
              </div>

              <Link
                to={`/booking/${mentorData.id}`}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-center block transition shadow-lg hover:shadow-xl border-0 cursor-pointer no-underline"
              >
                티타임 신청하기 ☕
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg">
                  <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">호스트 소개</h2>
              </div>

              <div 
                className="prose max-w-none text-gray-600 text-sm leading-relaxed ql-editor !p-0"
                dangerouslySetInnerHTML={{ __html: mentorData.mentor_intro || '<p class="text-gray-400">등록된 소개글이 없습니다.</p>' }}
              />

              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                  💡 이런 주제로 티타임을 나누고 싶어요!
                </h4>
                <div className="flex flex-wrap gap-2">
                  {mentorData.mentoring_topics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-lg border border-gray-200/60"
                    >
                      {topic}
                    </span>
                  ))}
                  {mentorData.mentoring_topics.length === 0 && (
                    <p className="text-xs text-gray-400 m-0">설정된 주제 키워드가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                  <Code className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">티타임에서 이런 경험을 나눠요</h2>
              </div>

              <div className="grid gap-4">
                {Array.isArray(mentorData.detailed_experience) && mentorData.detailed_experience.map((exp, idx) => (
                  <div key={idx} className="bg-gray-50/50 rounded-xl p-6 border border-gray-100 flex items-start gap-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm border border-gray-100 flex-shrink-0">
                      <Rocket className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 leading-relaxed m-0 font-medium whitespace-pre-wrap">{exp}</p>
                    </div>
                  </div>
                ))}
                
                {(!Array.isArray(mentorData.detailed_experience) || mentorData.detailed_experience.length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-4 m-0">등록된 공유 내용이 없습니다.</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">먼저 다녀간 크루들의 이야기</h2>
              </div>

              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-gray-50/30 rounded-xl p-5 border border-gray-100">
                    <div className="flex items-start gap-4">
                      <img src={review.author_image || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'} 
                      alt={review.author}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => { 
                      e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'; 
                      }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <div>
                            <h4 className="font-bold text-xs text-gray-900 m-0">{review.author}</h4>
                            <p className="text-[11px] text-gray-400 m-0 mt-0.5">{review.role}</p>
                          </div>
                          {renderStars(review.rating)}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed m-0 mt-1">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}