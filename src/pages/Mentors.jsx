import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, Sparkles, Filter, X } from 'lucide-react';
import SearchBar from '../components/SearchBar'; // 👈 새로 만든 검색바 컴포넌트 수입!

export default function Mentors() {
  const stripHTML = (htmlString) => {
    if (!htmlString) return '';
    return htmlString
      .replace(/<[^>]*>?/gm, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  };

  const [searchParams] = useSearchParams();
  const [mentorsList, setMentorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('전체');
  const [selectedSubCategory, setSelectedSubCategory] = useState('전체');
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || ''); 
  const [openCategory, setOpenCategory] = useState(null);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  useEffect(() => {
   const fetchMentors = async () => {
  try {
    setLoading(true);
    const userId = localStorage.getItem('userId');
    
    // 백엔드 라우터와 일치하도록 명확히 작성
    const url = userId
      ? `${BACKEND_URL}/api/mentors/recommended?user_id=${userId}`
      : `${BACKEND_URL}/api/mentors`;

    console.log("요청 URL:", url); // 디버깅용 로그

    const response = await fetch(url);
    if (!response.ok) {
       // 500 에러 시 서버에서 상세 메시지를 받아올 수 있도록 확인
       const errorData = await response.text();
       console.error("서버 에러 응답:", errorData);
       throw new Error(`Server returned ${response.status}`);
    }
    const data = await response.json();
    setMentorsList(data);
  } catch (error) {
    console.error("❌ 호스트 목록 수신 실패:", error);
  } finally {
    setLoading(false);
  }
};
    fetchMentors();
  }, [BACKEND_URL]);

  const statuses = ['전체', '현직자', '이직자', '프리랜서', '대학생', '취준생'];

  const categories = [
    { main: '개발/엔지니어링', subs: ['전체 개발', '프론트엔드', '백엔드', '풀스택', '인프라/DevOps', '데이터 엔지니어', '머신러닝/AI', '모바일(iOS)', '모바일(Android)', '임베디드/펌웨어', '게임 개발', 'QA/테스트', '보안', 'DBA', '블록체인', 'AR/VR'] },
    { main: '기획/PM', subs: ['전체 기획', '서비스 기획', '프로덕트 매니저(PM)', '콘텐츠 기획', '게임 기획', '광고 기획', '이벤트 기획', 'MD/상품기획', '전략기획', 'BM기획', '공연/전시 기획', 'IT컨설턴트'] },
    { main: '디자인', subs: ['전체 디자인', 'UI/UX', '그래픽', '브랜드/BI', '영상/모션', '3D/렌더링', '패션', '제품/산업', '인테리어', '캐릭터/일러스트', '인쇄/출판', '광고디자인'] },
    { main: '마케팅', subs: ['전체 마케팅', '디지털 마케팅', '퍼포먼스 마케팅', 'SNS/인플루언서', '브랜드 마케팅', 'CRM/그로스', '콘텐츠 마케팅', 'PR/홍보', 'SEO/SEM', '이메일 마케팅', '제휴/파트너십', '데이터 분석'] },
    { main: '경영/사무', subs: ['전체 경영', '경영기획', '인사/HR', '재무/회계', '법무/컴플라이언스', '총무/운영', '구매/자재', '물류/SCM', 'IR/투자', '감사', '비서/어드민'] },
    { main: '영업/CS', subs: ['전체 영업', 'B2B영업', 'B2C영업', '해외영업', '기술영업', '영업관리', '고객성공(CS)', '콜센터', '파트너/채널영업', '리테일/매장관리'] },
    { main: '미디어/콘텐츠', subs: ['전체 미디어', '방송/PD', '작가/에디터' , '포토그래퍼', '유튜브/크리에이터', '번역/통역', '출판/편집', '음악/음향', '스트리머', '기자/저널리스트', '웹툰/만화'] },
    { main: '전문직', subs: ['전체 전문직', '변호사/법조', '의사/의료', '약사', '공인회계사(CPA)', '세무사', '노무사', '변리사', '건축사', '감정평가사', '금융(IB/PE/VC)', '컨설턴트(MBB)'] },
    { main: '교육', subs: ['전체 교육', '학교교사', '학원강사', '온라인 강사', '교육기획', '코치/멘토', '연구원', '에듀테크'] },
    { main: '스타트업', subs: ['전체 스타트업', '창업자/CEO', 'CTO', 'COO', '초기 멤버', '사이드프로젝트', '투자/VC', '액셀러레이터'] },
    { main: '기타', subs: ['기타'] }
  ];

  const filteredMentors = mentorsList.filter((mentor) => {
    const matchesStatus = selectedStatus === '전체' || (mentor.status || '현직자') === selectedStatus;

    let matchesCategory = true;
    if (selectedSubCategory !== '전체') {
      const mentorMain = mentor.main_category || '';
      const mentorSub = mentor.sub_category || '';
      if (selectedSubCategory.startsWith('전체')) {
        matchesCategory = mentorMain === selectedSubCategory.split(' ')[1];
      } else {
        matchesCategory = mentorSub === selectedSubCategory;
      }
    }

    // 🚀 [무적의 올인원 검색망 구축] 요구하신 모든 데이터 필드를 한데 모아 대소문자 안 가리고 검색!
    const query = searchQuery.toLowerCase();
    
    const mentorName = (mentor.name || '').toLowerCase();
    const mentorRole = (mentor.job_title || '').toLowerCase();
    const mainCat = (mentor.main_category || '').toLowerCase();
    const subCat = (mentor.sub_category || '').toLowerCase();
    const bioText = stripHTML(mentor.bio || mentor.mentor_intro || '').toLowerCase();

    const careerText = (Array.isArray(mentor.career_history) ? mentor.career_history.join(' ') : (mentor.career_history || '')).toLowerCase();
    const topicsText = (Array.isArray(mentor.mentoring_topics) ? mentor.mentoring_topics.join(' ') : (mentor.mentoring_topics || '')).toLowerCase();
    const expText = (Array.isArray(mentor.detailed_experience) ? mentor.detailed_experience.join(' ') : (mentor.detailed_experience || '')).toLowerCase();
    const techStackArray = mentor.techStack || [];

    const matchesSearch =
      mentorName.includes(query) ||
      mentorRole.includes(query) ||
      mainCat.includes(query) ||
      subCat.includes(query) ||
      bioText.includes(query) ||
      careerText.includes(query) ||
      topicsText.includes(query) ||
      expText.includes(query) ||
      techStackArray.some(tech => tech.toLowerCase().includes(query));

    return matchesStatus && matchesCategory && matchesSearch;
  });

  const gridForcedStyles = {
    display: 'grid',
    gridTemplateColumns: window.innerWidth > 1024 ? 'repeat(4, minmax(0, 1fr))' : window.innerWidth > 768 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))',
    gap: '24px',
    width: '100%'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfdfd]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfdfd] flex flex-col justify-between">
      <div>
        <div className="bg-gradient-to-b from-slate-50 to-white border-b border-gray-200/60 py-10 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 grid lg:grid-cols-12 gap-6 items-center">
              {/* 왼쪽 카테고리 셀렉터 */}
              <div className="lg:col-span-8 space-y-5 border-gray-100 lg:pr-6 lg:border-r">
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-400 w-16 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> 그룹별
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {statuses.map((st) => (
                      <button
                        key={st}
                        onClick={() => setSelectedStatus(st)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border-0 ${
                          selectedStatus === st ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-start gap-4">
                    <span className="text-xs font-bold text-slate-400 w-16 flex-shrink-0 mt-1.5">직무별</span>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {categories.map((cat) => (
                        <div key={cat.main} className="relative">
                          <button 
                            onClick={() => setOpenCategory(openCategory === cat.main ? null : cat.main)}
                            className={`text-xs font-bold transition flex items-center gap-0.5 border-0 bg-transparent cursor-pointer ${openCategory === cat.main ? 'text-blue-600' : 'text-slate-700'}`}
                          >
                            {cat.main.split('/')[0]} <ChevronDown className="w-3 h-3" />
                          </button>
                          {openCategory === cat.main && (
                            <div className="absolute left-0 top-6 mt-2 w-48 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5">
                              {cat.subs.map((sub) => (
                                <button 
                                  key={sub} 
                                  onClick={() => { setSelectedSubCategory(sub); setOpenCategory(null); }} 
                                  className="block w-full px-4 py-2 text-left text-xs text-slate-600 hover:bg-slate-50 border-0 bg-transparent cursor-pointer"
                                >
                                  {sub}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedSubCategory !== '전체' && (
                    <div className="ml-20">
                      <button onClick={() => setSelectedSubCategory('전체')} className="text-[10px] bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-200 font-semibold cursor-pointer flex items-center gap-1.5">
                        {selectedSubCategory} <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div> 
              
              {/* 오른쪽 키워드 검색바 (🚨 분리한 SearchBar 조립 완료) */}
              <div className="lg:col-span-4 w-full">
                <span className="block text-xs font-bold text-slate-400 mb-2">키워드 검색</span>
                <SearchBar value={searchQuery} onChange={setSearchQuery} variant="square" placeholder="이름, 경력, 소개, 스택 등 통함 검색..." />
              </div>
            </div> 
          </div> 
        </div> 

        {/* 멘토 리스트 그리드 세션 */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div style={gridForcedStyles}>
            {filteredMentors.map((mentor) => (
              <Link
                to={`/mentors/apply/${mentor.id}`}
                key={mentor.id}
                className="bg-white rounded-2xl border border-slate-200/70 p-5 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group no-underline text-inherit"
                style={{ boxSizing: 'border-box', width: '100%', minHeight: '300px' }}
              >
                <div>
                  <div className="flex flex-col items-center text-center mb-4">
                    {mentor.match_score > 0 && (
                        <span className="mb-2 text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-bold border border-blue-100">
                          ✨ 매칭도 {mentor.match_score}점
                        </span>
                      )}
                    <img
                      src={mentor.profile_image || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
                      onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'; }}
                      alt={mentor.name}
                      className="w-16 h-16 rounded-full object-cover mb-3 ring-4 ring-slate-100 group-hover:ring-blue-100 transition duration-300 bg-gray-100"
                    />
                    <h4 className="font-bold text-base text-slate-800 group-hover:text-blue-600 transition m-0">
                      {mentor.name} 호스트
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 font-semibold m-0">
                      {mentor.job_title || '커리어 가이드'}
                    </p>
                    {mentor.match_reasons?.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center mt-1.5">
                          {mentor.match_reasons.slice(0, 2).map((reason, i) => (
                            <span key={i} className="text-[9px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100 font-medium">
                              {reason.split(':')[0]}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>

                  <p className="text-xs text-slate-600 text-center leading-relaxed line-clamp-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 m-0 font-medium min-h-[48px] flex items-center justify-center">
                    {stripHTML(mentor.bio) || mentor.job_title || '반가워요! 함께 깊이 고민하고 길을 찾는 든든한 상담 메이트가 되어 드리겠습니다.'}
                  </p>

                  <div className="flex flex-wrap gap-1 justify-center mt-3">
                    {(() => {
                        const tags = mentor.mentor_keywords
                          ? (Array.isArray(mentor.mentor_keywords)
                              ? mentor.mentor_keywords
                              : JSON.parse(mentor.mentor_keywords || '[]'))
                          : mentor.hashtags
                          ? (Array.isArray(mentor.hashtags)
                              ? mentor.hashtags
                              : mentor.hashtags.split(',').map(s => s.trim()))
                          : ['커리어'];
                        return tags.slice(0, 4).map((tag, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                            #{tag}
                          </span>
                        ));
                      })()}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-blue-600 font-bold group-hover:text-blue-700 tracking-tight">
                  상세 프로필 & 티타임 신청하기 ☕
                </div>
              </Link>
            ))}
          </div>

          {filteredMentors.length === 0 && (
            <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-500 font-medium mb-4">조건에 맞는 호스트를 찾지 못했습니다.</p>
              <button
                onClick={() => { setSelectedStatus('전체'); setSelectedSubCategory('전체'); setSearchQuery(''); }}
                className="text-xs bg-white text-slate-600 px-4 py-2 rounded-xl border border-slate-200 font-semibold cursor-pointer hover:bg-slate-50"
              >
                필터 조건 초기화하기
              </button>
            </div>
          )}
        </div> 
      </div> 
    </div>
  );
}