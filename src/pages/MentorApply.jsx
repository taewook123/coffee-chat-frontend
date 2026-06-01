import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Star, Briefcase, ChevronLeft, MessageSquare, Heart, Code, Rocket } from 'lucide-react';

export default function MentorDetails() {
  const { id } = useParams(); // 💡 URL 주소창에서 멘토 ID(또는 user_id)를 동적으로 추출합니다.
  const [mentorData, setMentorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 💡 [배포 고정] 모든 환경에서 클라우드 원격 서버 API를 바라보도록 주소 고정
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';


  // 💡 [데이터 로드] 페이지 진입 시 해당 멘토의 상세 프로필 조회
  useEffect(() => {
  const fetchMentorDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/mentors/${id}`);
      if (!response.ok) throw new Error("로드 실패");
      
      const data = await response.json();
      console.log("🔥 서버에서 받은 데이터:", data); // 👈 F12 콘솔에서 이 로그를 꼭 확인하세요!

      // 💡 핵심: 백엔드에서 이미 []를 보내주므로, 
      // 만약 데이터가 [ ] 배열이면 그냥 쓰고, 문자열이면 파싱합니다.
      const safeParse = (val) => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try { return JSON.parse(val); } catch { return []; }
        }
        return [];
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
  
  // 후기 데이터는 요구사항에 따라 고정 더미 상태로 유지합니다.
  const reviews = [
    {
      id: 1,
      author: 'Michael Johnson',
      role: '이직을 준비하던 백엔드 개발자',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      rating: 5,
      date: '2026-05-10',
      comment: "분산 시스템이 너무 막막했는데 동네 누나가 설명해주듯 편하게 짚어주셔서 감을 잡았습니다. 면접용 팁이 아니라 실무에서 왜 이렇게 쓰는지 이해시켜 주셔서 정말 좋았어요."
    },
    {
      id: 2,
      author: '김다윗',
      role: '직무 전환을 고민하던 주니어',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      rating: 5,
      date: '2026-05-05',
      comment: "프론트에서 백엔드로 넘어가려니 불안했는데, 사라님도 스타트업 시절 맨땅에 해딩했던 이야기를 해주셔서 엄청 위로가 되었어요. 공부 방향성도 친근하게 조언해 주셔서 든든합니다!"
    }
  ];

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
        <p className="text-gray-500 font-semibold">존재하지 않거나 등록되지 않은 멘토 프로필입니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/mentors" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition no-underline">
            <ChevronLeft className="w-5 h-5" />
            다른 멘토들 만나러 가기
          </Link>
        </div>
      </div>

      {/* Page Title */}
      <div className="max-w-7xl mx-auto px-6 py-3">
        <h1 className="!text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          멘토와 대화하기
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* [좌측 컬럼] 사진, 이름, 직무/연차, 멘토 경력 배열 */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 sticky top-8">
              <div className="mb-6">
                <img
                  src={
                    mentorData.profile_image && 
                    mentorData.profile_image !== 'null' && 
                    mentorData.profile_image !== 'undefined' &&
                    // 💡 [치트키] DB에 아주머니 주소가 들어있어도 강제로 차단하고 실루엣으로 보냅니다!
                    !mentorData.profile_image.includes('photo-1573497019940') 
                      ? (mentorData.profile_image.startsWith('http') || mentorData.profile_image.startsWith('data:')
                          ? mentorData.profile_image
                          : `data:image/jpeg;base64,${mentorData.profile_image}`)
                      : 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'
                  }
                  onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'; }}
                  alt={mentorData.name}
                  className="w-16 h-16 rounded-full object-cover mb-3 ring-4 ring-slate-100 group-hover:ring-blue-100 transition duration-300 bg-gray-100"
                />
              </div>

              <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{mentorData.name}</h2>
                <p className="text-gray-600 font-medium text-sm m-0">{mentorData.job_title}</p>
              </div>

              {/* 지나온 발자취 (career_history 배열 바인딩) */}
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
                커피 한잔하며 대화 나누기 ☕
              </Link>
            </div>
          </div>

          {/* [우측 컬럼] 자기소개, 대화주제, 상세 경험 리스트 */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 자기 소개 (HTML 문자열 렌더링) */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-red-50 to-pink-50 rounded-lg">
                  <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">자기 소개</h2>
              </div>

              {/* 💡 에디터에서 작성된 HTML을 깨짐 없이 안전하게 렌더링합니다. */}
              <div 
                className="prose max-w-none text-gray-600 text-sm leading-relaxed ql-editor !p-0"
                dangerouslySetInnerHTML={{ __html: mentorData.mentor_intro || '<p class="text-gray-400">등록된 소개글이 없습니다.</p>' }}
              />

              {/* 이런 주제로 편하게 이야기 걸어주세요 (mentoring_topics) */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-3 text-sm">
                  💡 이런 주제로 편하게 이야기 걸어주세요!
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

            {/* 이런 경험들을 공유해 드릴 수 있어요 (detailed_experience 문자열 배열) */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                  <Code className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">이런 경험들을 공유해 드릴 수 있어요</h2>
              </div>

              <div className="grid gap-4">
                {/* 💡 mentorData.detailed_experience가 있을 때만 map을 돌리도록 수정 */}
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
                
                {/* 데이터가 아예 없거나 빈 배열일 때 메시지 출력 */}
                {(!Array.isArray(mentorData.detailed_experience) || mentorData.detailed_experience.length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-4 m-0">등록된 공유 내용이 없습니다.</p>
                )}
              </div>
            </div>

            {/* 후기 섹션 (더미 유지) */}
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
                      <img src={review.avatar} alt={review.author} className="w-10 h-10 rounded-full object-cover" />
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