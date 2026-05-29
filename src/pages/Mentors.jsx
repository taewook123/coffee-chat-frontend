import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, Sparkles, Filter } from 'lucide-react';

export default function Mentors() {
  const stripHTML = (htmlString) => {
    if (!htmlString) return '';
    return htmlString
      .replace(/<[^>]*>?/gm, '') // <p>, <br> 등 모든 HTML 태그 제거
      .replace(/&nbsp;/g, ' ')   // &nbsp; 를 띄어쓰기로 변환
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  };
  // 💡 실시간으로 백엔드에서 긁어온 멘토 리스트를 담을 상태(State) 선언
  const [mentorsList, setMentorsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // 상태 관리
  const [selectedStatus, setSelectedStatus] = useState('전체');
  const [selectedSubCategory, setSelectedSubCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');

  // 💡 [배포 고정] 대시보드와 동일한 클라우드 원격 서버 백엔드 주소 정의
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  // 💡 [실시간 DB 연동] 컴포넌트 마운트 시 PostgreSQL에 적재된 진짜 멘토 크루 전체 데이터 로드
  useEffect(() => {
    const fetchRealMentors = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/mentors`);
        if (response.ok) {
          const data = await response.json();
          setMentorsList(data);
        }
      } catch (error) {
        console.error("❌ 멘토 실시간 목록 수신 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRealMentors();
  }, [BACKEND_URL]);

  // 1단계: 신분 카테고리
  const statuses = ['전체', '현직자', '이직자', '프리랜서', '대학생', '취준생'];

  // 2단계: 직종 카테고리 구조
  const categories = [
    {
      main: '개발/엔지니어링',
      subs: ['전체 개발', '프론트엔드', '백엔드/인프라', '데이터 엔지니어', '모바일 앱']
    },
    {
      main: '기획/PM',
      subs: ['전체 기획', '서비스 기획자', '프로덕트 매니저(PM)', '데이터 분석가']
    },
    {
      main: '디자인',
      subs: ['전체 디자인', 'UI/UX 디자인', '브랜드 디자인', '그래픽 디자인']
    }
  ];

  // 💡 실시간 필터링 엔진 (DB 연동 안전장치 가드 포함 튜닝)
  const filteredMentors = mentorsList.filter((mentor) => {
    // 1. 신분 그룹 필터링 (DB 데이터가 비어있을 수 있으므로 기본값 가드 적용)
    const mentorStatus = mentor.status || '현직자';
    const matchesStatus = selectedStatus === '전체' || mentorStatus === selectedStatus;
    
    // 2. 기술 스택 및 직무 매칭 필터링
    let matchesCategory = true;
    const techStackArray = mentor.techStack || [];
    const mentorRole = mentor.job_title || ''; // 💡 백엔드 컬럼 스펙인 job_title 매핑

    if (selectedSubCategory !== '전체') {
      if (selectedSubCategory.startsWith('전체')) {
        const mainCatKey = selectedSubCategory.split(' ')[1]; 
        matchesCategory = techStackArray.some(tech => tech.includes(mainCatKey)) || mentorRole.includes(mainCatKey);
      } else {
        const targetJob = selectedSubCategory.replace(/\(.*\)/, '').trim(); 
        matchesCategory = techStackArray.some(tech => tech.toLowerCase().includes(targetJob.toLowerCase())) || 
                          mentorRole.toLowerCase().includes(targetJob.toLowerCase());
      }
    }

    // 3. 통합 검색창 필터링 (null 에러 방지 가드 포함)
    const mentorName = mentor.name || '';
    const mentorCompany = mentor.company || '🏢 크루 멤버';
    const mentorBio = mentor.bio || mentor.job_title || '안녕하세요! 반가워요.';

    const matchesSearch = 
      mentorName.includes(searchQuery) || 
      mentorCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentorRole.includes(searchQuery) ||
      mentorBio.includes(searchQuery) ||
      techStackArray.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesCategory && matchesSearch;
  });

  // 💡 인라인 스타일을 이용한 가로 4열 그리드 강제 고정 레이아웃
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
        
        {/* 대형 필터 영역 */}
        <div className="bg-gradient-to-b from-slate-50 to-white border-b border-gray-200/60 py-10 px-6">
          <div className="max-w-7xl mx-auto">
            
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight m-0">
                원하는 조건의 멘토 크루 찾기
              </h2>
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
                        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                          selectedStatus === st
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-slate-400 w-16">직무별</span>
                  <div className="flex gap-6">
                    {categories.map((cat) => (
                      <div key={cat.main} className="group relative py-1">
                        <button className="text-xs font-bold text-slate-700 group-hover:text-blue-600 transition flex items-center gap-0.5 bg-transparent border-0 cursor-pointer">
                          {cat.main.split('/')[0]} <ChevronDown className="w-3 h-3 text-slate-400" />
                        </button>
                        
                        <div className="absolute left-1/2 -translate-x-1/2 top-full hidden group-hover:flex flex-col bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 w-48 z-50 mt-1">
                          {cat.subs.map((sub) => (
                            <button
                              key={sub}
                              onClick={() => setSelectedSubCategory(sub)}
                              className={`px-4 py-2 text-left text-xs border-0 bg-transparent cursor-pointer transition ${
                                selectedSubCategory === sub
                                  ? 'bg-blue-50 text-blue-600 font-bold'
                                  : 'text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {sub}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedSubCategory !== '전체' && (
                    <button 
                      onClick={() => setSelectedSubCategory('전체')}
                      className="text-[10px] bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md border border-amber-200/60 font-semibold cursor-pointer"
                    >
                      {selectedSubCategory} ✕
                    </button>
                  )}
                </div>
              </div>

              {/* 오른쪽 키워드 검색바 */}
              <div className="lg:col-span-4 w-full">
                <span className="block text-xs font-bold text-slate-400 mb-2">키워드 검색</span>
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="이름, 회사, 키워드로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* 멘토 리스트 그리드 세션 */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="mb-8">
            <h3 className="text-base font-bold text-slate-800 m-0">
               {selectedStatus === '전체' ? '엄선된 추천' : selectedStatus} 매칭 크루 목록 
              <span className="text-xs text-slate-400 font-normal ml-2">({filteredMentors.length}명 검색됨)</span>
            </h3>
          </div>

          {/* 인라인 레이아웃 주입으로 가로 4열 정렬 강제 집행 */}
          <div style={gridForcedStyles}>
            {filteredMentors.map((mentor) => (
              <Link to={`/mentors/apply/${mentor.id}`}
                key={mentor.id}
                className="bg-white rounded-2xl border border-slate-200/70 p-5 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group no-underline text-inherit"
                style={{ boxSizing: 'border-box', width: '100%', minHeight: '300px' }}
              >
                <div>
                  <div className="flex flex-col items-center text-center mb-4">
                    <img
                      src={mentor.profile_image || 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400'}
                      alt={mentor.name}
                      className="w-16 h-16 rounded-full object-cover mb-3 ring-4 ring-slate-100 group-hover:ring-blue-100 transition duration-300"
                    />
                    <span className="px-2 py-0.5 bg-blue-50 text-[10px] font-bold text-blue-600 rounded-md mb-2">
                      {mentor.company || '🏢 CoffeeChat 크루'}
                    </span>
                    <h4 className="font-bold text-base text-slate-800 group-hover:text-blue-600 transition m-0">
                      {mentor.name} 멘토
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 font-semibold m-0">
                      {mentor.job_title || '커리어 가이드'}
                    </p>
                  </div>
                  
                  <p className="text-xs text-slate-600 text-center leading-relaxed line-clamp-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 m-0 font-medium min-h-[48px] flex items-center justify-center">
                  {stripHTML(mentor.bio) || mentor.job_title || '반가워요! 함께 깊이 고민하고 길을 찾는 든든한 멘토링 메이트가 되어 드리겠습니다.'}
                </p>

                  {/* 기술 스택 해시태그 목록 출력 피드 안전장치 가드 처리 */}
                  <div className="flex flex-wrap gap-1 justify-center mt-3">
                    {(mentor.techStack || ['백엔드', '커리어']).map((tech, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                        #{tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-blue-600 font-bold group-hover:text-blue-700 tracking-tight">
                  상세 프로필 & 커피챗 신청하기 ☕
                </div>
              </Link>
            ))}
          </div>

          {filteredMentors.length === 0 && (
            <div className="text-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 text-sm font-medium m-0">조건에 일치하는 커피챗 멘토 크루가 아직 없습니다.</p>
              <button 
                onClick={() => { setSelectedStatus('전체'); setSelectedSubCategory('전체'); setSearchQuery(''); }}
                className="mt-3 text-xs bg-white text-slate-600 px-4 py-2 rounded-xl border border-slate-200 font-semibold cursor-pointer hover:bg-slate-50"
              >
                필터 조건 초기화하기
              </button>
            </div>
          )}
        </div>
      </div>

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6">
          © 2026 Coffee Chat 크루. 우리들의 평등하고 편안한 대화 공간.
        </div>
      </footer>
    </div>
  );
}