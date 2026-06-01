import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Star } from 'lucide-react';
import Hero from '../components/Hero'; // Hero 컴포넌트 경로 확인 필요

export default function MainContent() {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  // 💡 탭 구성을 전자 명세인 [전체, 개발, 디자인, 기획] 구조로 적용
  const tabs = ['전체', '개발', '디자인', '기획'];
  const [activeTab, setActiveTab] = useState('전체');

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/mentors`);
        
        // 💡 백엔드 데이터를 전자의 '가공된 포맷(별점, 리뷰수, 명예 등)'에 맞게 매핑
        const formattedMentors = response.data.map((m) => {
          // 직무(job_title) 기반으로 카테고리 자동 유추
          let cat = '개발';
          const job = m.job_title || '';
          if (job.includes('디자인') || job.includes('UI')) cat = '디자인';
          else if (job.includes('기획') || job.includes('PM')) cat = '기획';

          return {
            ...m,
            category: cat,
            // 백엔드 데이터에 경력이 없으므로 기본값 세팅 (나중에 실제 데이터로 연동 가능)
            rating: 4.9, 
            reviewCount: Math.floor(Math.random() * 50) + 10, // 10~60 사이 랜덤 리뷰수 가짜 데이터 부여
            isHonor: Math.random() > 0.7 // 30% 확률로 '명예' 배지 부여
          };
        });

        // 💡 상위 8명만 잘라서 보여줍니다.
        setMentors(formattedMentors.slice(0, 8)); 
      } catch (error) {
        console.error("❌ 메인 화면 호스트 데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, []);

  const stripHTML = (htmlString) => {
    if (!htmlString) return '';
    return htmlString.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ');
  };

  // 💡 선택된 직무 탭에 따라 실시간 필터링
  const filteredHosts = activeTab === '전체' 
    ? mentors 
    : mentors.filter(host => host.category === activeTab);

  // 💥 가로 4열 고정 정밀 그리드 락(Lock) 스타일
  const listStyles = {
    display: 'grid',
    gridTemplateColumns: window.innerWidth > 1024 ? 'repeat(4, minmax(0, 1fr))' : window.innerWidth > 640 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))',
    gap: '24px',
    width: '100%',
  };

  return (
    <div className="w-full bg-white">
      {/* 1. 상단 히어로 배너 영역 */}
      <Hero />
      
      {/* ─── 섹션 1: 지금 주목받는 인기 호스트 ─── */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 border-0 border-b border-solid border-gray-100">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#1a2332] mb-3 m-0">
            지금 주목받는 인기 호스트
          </h2>
          <p className="text-gray-500 text-sm m-0 font-medium">목표하는 직무의 호스트를 탭을 통해 빠르게 만나보세요.</p>
        </div>

        {/* 탭 버튼 그룹 인터페이스 */}
        <div className="flex justify-center border-0 border-b border-solid border-gray-200 max-w-md mx-auto mb-12">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 pb-4 text-center font-bold text-sm bg-transparent border-0 cursor-pointer transition-all duration-200 relative ${
                activeTab === tab ? 'text-[#4a90e2]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4a90e2]" />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          /* 💥 전자의 4열 그리드 리스트 적용 */
          <div style={listStyles}>
            {filteredHosts.map((host) => (
              <div
                key={host.id}
                onClick={() => navigate(`/mentors/apply/${host.id}`)}
                className="bg-white border border-solid border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-5 flex flex-col justify-between cursor-pointer group"
                style={{ boxSizing: 'border-box' }}
              >
                <div>
                  {/* 둥근 사각형 프로필 박스 처리 */}
                  <div className="w-full aspect-square overflow-hidden rounded-xl mb-4 bg-slate-50 relative">
                    <img
                      // 💡 마지막 남은 아줌마 사진 퇴출! 기본 실루엣으로 변경
                      src={host.profile_image || 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'}
                      
                      // 💡 이미지 로드 실패 시 방어막 추가
                      onError={(e) => { e.target.src = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'; }}
                      
                      alt={host.name}
                      className="w-full h-full object-cover group-hover:scale-103 transition duration-300 bg-gray-100"
                    />
                    {host.isHonor && (
                      <span className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                        👑 명예
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-[#4a90e2] text-[10px] font-bold rounded">
                        {host.category}
                      </span>
                      {/* 백엔드에 회사 정보가 없어서 일단 호스트의 첫 번째 해시태그나 역할을 출력 */}
                      <span className="text-xs text-blue-600 font-bold">{host.job_title || '크루'}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-base mb-1 m-0 group-hover:text-[#4a90e2] transition">
                      {host.name} 호스트
                    </h3>
                    <p className="text-xs text-gray-500 m-0 font-medium">{host.job_title || '커리어 가이드'}</p>
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 m-0 leading-relaxed font-medium">"{stripHTML(host.bio) || host.mentor_intro || '환영합니다! 함께 길을 찾아보아요.'}"</p>
                  </div>
                </div>
                
                {/* 별점 스코어 및 하단 가이드 링크 영역 */}
                <div className="pt-3 mt-4 border-0 border-t border-solid border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-gray-900">{host.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-gray-400">({host.reviewCount})</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#4a90e2] group-hover:underline">
                    프로필 보기 &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 전체 호스트 페이지로 넘어가는 버튼 */}
        <div className="text-center mt-12">
          <Link 
            to="/mentors" 
            className="inline-block px-8 py-3.5 bg-slate-800 text-white font-bold text-sm rounded-full hover:bg-blue-600 transition duration-300 shadow-md no-underline"
          >
            호스트 전체보기 &rarr;
          </Link>
        </div>
      </section>

      {/* ─── 섹션 2: How It Works (이용 방법) ─── */}
      <section id="how-it-works" className="bg-[#f5f0e8] py-20 w-full" style={{ boxSizing: 'border-box' }}>
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-[#1a2332] mb-16 m-0 tracking-tight">
            이용 방법
          </h2>
          
          {/* 가로 배열 잠금 조치 */}
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: window.innerWidth > 768 ? 'row' : 'column',
              justifyContent: 'space-between', 
              alignItems: 'flex-start', 
              gap: '32px', 
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            {/* Step 1 */}
            <div className="text-center space-y-3" style={{ flex: 1, width: '100%', boxSizing: 'border-box' }}>
              <div className="w-16 h-16 bg-[#4a90e2] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-200">
                <span className="text-2xl text-white font-extrabold">1</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 m-0">나만의 호스트 찾기</h3>
              <p className="text-gray-600 text-xs leading-relaxed max-w-xs mx-auto m-0 font-medium">
                엄선된 네카라쿠배 업계 전문가 리스트를 살펴보고 자신의 커리어 목표에 꼭 맞는 완벽한 호스트를 찾아보세요.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-3" style={{ flex: 1, width: '100%', boxSizing: 'border-box' }}>
              <div className="w-16 h-16 bg-[#4a90e2] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-200">
                <span className="text-2xl text-white font-extrabold">2</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 m-0">세션 예약하기</h3>
              <p className="text-gray-600 text-xs leading-relaxed max-w-xs mx-auto m-0 font-medium">
                호스트의 오픈된 일정을 직관적으로 조율해 일대일 맞춤형 티타임 세션을 간편하게 예약할 수 있습니다.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-3" style={{ flex: 1, width: '100%', boxSizing: 'border-box' }}>
              <div className="w-16 h-16 bg-[#4a90e2] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-200">
                <span className="text-2xl text-white font-extrabold">3</span>
              </div>
              <h3 className="text-lg font-bold text-slate-800 m-0">대화하고 성장하기</h3>
              <p className="text-gray-600 text-xs leading-relaxed max-w-xs mx-auto m-0 font-medium">
                호스트와 직접 만나 기술 장벽, 불안감에 대해 질문을 주고받으며 든든한 커리어 인사이트를 쟁취하세요.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}