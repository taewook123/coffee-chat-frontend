import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, Sparkles, Filter, X } from 'lucide-react';

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

  const [mentorsList, setMentorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('전체');
  const [selectedSubCategory, setSelectedSubCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [openCategory, setOpenCategory] = useState(null);
  // 💡 [배포 고정] 대시보드와 동일한 클라우드 원격 서버 백엔드 주소 정의
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

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
        console.error("❌ 호스트 실시간 목록 수신 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRealMentors();
  }, [BACKEND_URL]);

  const statuses = ['전체', '현직자', '이직자', '프리랜서', '대학생', '취준생'];

  const categories = [
    {
      main: '개발/엔지니어링',
      subs: [
        '전체 개발', '프론트엔드', '백엔드', '풀스택', '인프라/DevOps',
        '데이터 엔지니어', '머신러닝/AI', '모바일(iOS)', '모바일(Android)',
        '임베디드/펌웨어', '게임 개발', 'QA/테스트', '보안', 'DBA',
        '블록체인', 'AR/VR'
      ]
    },
    {
      main: '기획/PM',
      subs: [
        '전체 기획', '서비스 기획', '프로덕트 매니저(PM)', '콘텐츠 기획',
        '게임 기획', '광고 기획', '이벤트 기획', 'MD/상품기획',
        '전략기획', 'BM기획', '공연/전시 기획', 'IT컨설턴트'
      ]
    },
    {
      main: '디자인',
      subs: [
        '전체 디자인', 'UI/UX', '그래픽', '브랜드/BI',
        '영상/모션', '3D/렌더링', '패션', '제품/산업',
        '인테리어', '캐릭터/일러스트', '인쇄/출판', '광고디자인'
      ]
    },
    {
      main: '마케팅',
      subs: [
        '전체 마케팅', '디지털 마케팅', '퍼포먼스 마케팅', 'SNS/인플루언서',
        '브랜드 마케팅', 'CRM/그로스', '콘텐츠 마케팅', 'PR/홍보',
        'SEO/SEM', '이메일 마케팅', '제휴/파트너십', '데이터 분석'
      ]
    },
    {
      main: '경영/사무',
      subs: [
        '전체 경영', '경영기획', '인사/HR', '재무/회계',
        '법무/컴플라이언스', '총무/운영', '구매/자재', '물류/SCM',
        'IR/투자', '감사', '비서/어드민'
      ]
    },
    {
      main: '영업/CS',
      subs: [
        '전체 영업', 'B2B영업', 'B2C영업', '해외영업',
        '기술영업', '영업관리', '고객성공(CS)', '콜센터',
        '파트너/채널영업', '리테일/매장관리'
      ]
    },
    {
      main: '미디어/콘텐츠',
      subs: [
        '전체 미디어', '방송/PD', '작가/에디터', '포토그래퍼',
        '유튜브/크리에이터', '번역/통역', '출판/편집', '음악/음향',
        '스트리머', '기자/저널리스트', '웹툰/만화'
      ]
    },
    {
      main: '전문직',
      subs: [
        '전체 전문직', '변호사/법조', '의사/의료', '약사',
        '공인회계사(CPA)', '세무사', '노무사', '변리사',
        '건축사', '감정평가사', '금융(IB/PE/VC)', '컨설턴트(MBB)'
      ]
    },
    {
      main: '교육',
      subs: [
        '전체 교육', '학교교사', '학원강사', '온라인 강사',
        '교육기획', '코치/멘토', '연구원', '에듀테크'
      ]
    },
    {
      main: '스타트업',
      subs: [
        '전체 스타트업', '창업자/CEO', 'CTO', 'COO',
        '초기 멤버', '사이드프로젝트', '투자/VC', '액셀러레이터'
      ]
    },
    {
      main: '기타',
      subs: ['기타']
    }
  ];

  const filteredMentors = mentorsList.filter((mentor) => {
    // 1. 상태 필터 (전체 또는 일치)
    const mentorStatus = mentor.status || '현직자';
    const matchesStatus = selectedStatus === '전체' || mentorStatus === selectedStatus;

    // 2. 직무 필터 (주/세부 직무 매칭 로직 개선)
    let matchesCategory = true;
    if (selectedSubCategory !== '전체') {
      // 멘토의 직무 정보를 가져옴 (백엔드 데이터 구조에 따라 mentor.main_category, sub_category 혹은 job_title 등 사용)
      const mentorMain = mentor.main_category || '';
      const mentorSub = mentor.sub_category || '';

      if (selectedSubCategory.startsWith('전체')) {
        // '전체 [메인카테고리]'를 선택했을 때
        const mainCatKey = selectedSubCategory.split(' ')[1];
        matchesCategory = mentorMain === mainCatKey;
      } else {
        // 구체적인 [세부직무]를 선택했을 때
        matchesCategory = mentorSub === selectedSubCategory;
      }
    }

    // 3. 키워드 검색 (기존 로직 유지)
    const mentorName = mentor.name || '';
    const mentorCompany = mentor.company || '🏢 크루 멤버';
    const mentorRole = mentor.job_title || '';
    const techStackArray = mentor.techStack || [];

    const matchesSearch =
      mentorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentorCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentorRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      techStackArray.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()));

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
        {/* 대형 필터 영역 */}
        <div className="bg-gradient-to-b from-slate-50 to-white border-b border-gray-200/60 py-10 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight m-0">
                원하는 조건의 호스트 크루 찾기
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

                <div className="flex flex-col gap-3"> {/* <div className="flex flex-col gap-3"> {/* 열 방향 컨테이너 시작 */}
                  <div className="flex items-start gap-4">
                    <span className="text-xs font-bold text-slate-400 w-16 flex-shrink-0 mt-1.5">직무별</span>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                      {categories.map((cat) => (
                        <div key={cat.main} className="relative">
                          <button 
                            onClick={() => setOpenCategory(openCategory === cat.main ? null : cat.main)}
                            className={`text-xs font-bold transition flex items-center gap-0.5 border-0 cursor-pointer ${openCategory === cat.main ? 'text-blue-600' : 'text-slate-700'}`}
                          >
                            {cat.main.split('/')[0]} <ChevronDown className="w-3 h-3" />
                          </button>
                          {openCategory === cat.main && (
                            <div className="absolute left-0 top-6 mt-2 w-48 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5">
                              {cat.subs.map((sub) => (
                                <button key={sub} onClick={() => { setSelectedSubCategory(sub); setOpenCategory(null); }} className="block w-full px-4 py-2 text-left text-xs text-slate-600 hover:bg-slate-50">
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
                </div> {/* 1. 여기서 열 방향 컨테이너 닫기 */}
              </div> {/* 2. 여기서 lg:col-span-8 (왼쪽 영역) 닫기 */}
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
              </div> {/* ✅ lg:col-span-4 닫힘 */}
            </div> {/* ✅ grid 닫힘 */}
          </div> {/* ✅ max-w-7xl 닫힘 */}
        </div> {/* ✅ 필터 영역 닫힘 */}

        {/* 멘토 리스트 그리드 세션 */}
        <div className="max-w-7xl mx-auto px-6 py-10">
          <div className="mb-8">
            <h3 className="text-base font-bold text-slate-800 m-0">
              {selectedStatus === '전체' ? '엄선된 추천' : selectedStatus} 매칭 크루 목록
              <span className="text-xs text-slate-400 font-normal ml-2">({filteredMentors.length}명 검색됨)</span>
            </h3>
          </div>

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
                    <img
                      src={mentor.profile_image || 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400'}
                      alt={mentor.name}
                      className="w-16 h-16 rounded-full object-cover mb-3 ring-4 ring-slate-100 group-hover:ring-blue-100 transition duration-300"
                    />
                    <span className="px-2 py-0.5 bg-blue-50 text-[10px] font-bold text-blue-600 rounded-md mb-2">
                      {mentor.company || '🏢 CoffeeChat 크루'}
                    </span>
                    <h4 className="font-bold text-base text-slate-800 group-hover:text-blue-600 transition m-0">
                      {mentor.name} 호스트
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 font-semibold m-0">
                      {mentor.job_title || '커리어 가이드'}
                    </p>
                  </div>

                  <p className="text-xs text-slate-600 text-center leading-relaxed line-clamp-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 m-0 font-medium min-h-[48px] flex items-center justify-center">
                    {stripHTML(mentor.bio) || mentor.job_title || '반가워요! 함께 깊이 고민하고 길을 찾는 든든한 상담 메이트가 되어 드리겠습니다.'}
                  </p>

                  <div className="flex flex-wrap gap-1 justify-center mt-3">
                    {(mentor.techStack || ['백엔드', '커리어']).map((tech, idx) => (
                      <span key={idx} className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                        #{tech}
                      </span>
                    ))}
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
              <p className="text-slate-400 text-sm font-medium m-0">조건에 일치하는 티타임 호스트 크루가 아직 없습니다.</p>
              <button
                onClick={() => { setSelectedStatus('전체'); setSelectedSubCategory('전체'); setSearchQuery(''); }}
                className="mt-3 text-xs bg-white text-slate-600 px-4 py-2 rounded-xl border border-slate-200 font-semibold cursor-pointer hover:bg-slate-50"
              >
                필터 조건 초기화하기
              </button>
            </div>
          )}
        </div> {/* ✅ 멘토 리스트 닫힘 */}
      </div> {/* ✅ 최상위 div 닫힘 */}

      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-6">
          © 2026 TeeTimes 크루. 우리들의 평등하고 편안한 대화 공간.
        </div>
      </footer>
    </div>
  );
}