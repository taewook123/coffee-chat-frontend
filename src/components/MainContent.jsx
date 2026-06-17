import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Hero from '../components/Hero'; // Hero 컴포넌트 경로 확인 필요

export default function MainContent() {
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    '전체', '개발/엔지니어링', '기획/PM', '디자인', '마케팅', 
    '경영/사무', '영업/CS', '미디어/콘텐츠', '전문직', '교육', '스타트업', '기타'
  ];
  const [activeTab, setActiveTab] = useState('전체');

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  useEffect(() => {
    const fetchMentors = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/mentors`);
        
        const formattedMentors = response.data.map((m) => {
          let cat = m.main_category || '';
          if (!cat) {
            const job = m.job_title || '';
            if (job.includes('디자인') || job.includes('UI') || job.includes('UX')) cat = '디자인';
            else if (job.includes('기획') || job.includes('PM') || job.includes('프로덕트')) cat = '기획/PM';
            else if (job.includes('마케팅') || job.includes('홍보') || job.includes('SEO')) cat = '마케팅';
            else if (job.includes('인사') || job.includes('재무') || job.includes('회계') || job.includes('경영')) cat = '경영/사무';
            else if (job.includes('영업') || job.includes('CS') || job.includes('고객')) cat = '영업/CS';
            else if (job.includes('영상') || job.includes('PD') || job.includes('작가') || job.includes('콘텐츠')) cat = '미디어/콘텐츠';
            else if (job.includes('변호사') || job.includes('회계사') || job.includes('의사') || job.includes('전문')) cat = '전문직';
            else if (job.includes('강사') || job.includes('교사') || job.includes('교육')) cat = '교육';
            else if (job.includes('창업') || job.includes('CEO') || job.includes('스타트업')) cat = '스타트업';
            else if (job.includes('개발') || job.includes('엔지니어') || job.includes('백엔드') || job.includes('프론트') || job.includes('DevOps')) cat = '개발/엔지니어링';
            else cat = '기타';
          }
          return { ...m, category: cat, isHonor: Math.random() > 0.7 };
        });

        setMentors(formattedMentors.slice(0, 8)); 
      } catch (error) {
        console.error("❌ 메인 화면 호스트 데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMentors();
  }, [BACKEND_URL]);

  const stripHTML = (htmlString) => {
    if (!htmlString) return '';
    return htmlString.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ');
  };

  const filteredHosts = activeTab === '전체' 
    ? mentors 
    : mentors.filter(host => host.category === activeTab);

  // 💡 리스트 간격을 20px로 넓혀 숨통을 틔워줍니다.
  const listStyles = {
    display: 'grid',
    gridTemplateColumns: window.innerWidth > 1024 ? 'repeat(4, minmax(0, 1fr))' : window.innerWidth > 640 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))',
    gap: '20px',
    width: '100%',
  };

  return (
    <div className="w-full bg-white">
      {/* 1. 상단 히어로 배너 */}
      <Hero />
      
      {/* 2. 인기 호스트 섹션 */}
      <section className="max-w-7xl mx-auto px-6 pt-10 pb-20">
        
        {/* 중앙 정렬된 타이틀 영역 */}
        <div className="flex flex-col items-center text-center mb-14 space-y-4">
          {/* 뱃지 */}
          <span className="inline-block text-[#1A73E8] bg-blue-50 text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full mb-1">
            POPULAR HOSTS
          </span>

          {/* 메인 타이틀 */}
          <h2 
            className="text-gray-900 m-0" 
            style={{ 
              fontSize: '2.5rem',
              lineHeight: '1.2', 
              fontWeight: '900',
              letterSpacing: '-0.06em'
            }}
          >
            지금 주목받는 <span className="text-[#1A73E8]">인기 호스트</span>
          </h2>
          
          {/* 서브 설명 */}
          <p 
            className="text-gray-400 m-0 max-w-md w-full break-keep"
            style={{
              fontSize: '1rem',
              fontWeight: '400',
              letterSpacing: '-0.02em',
              lineHeight: '1.6'
            }}
          >
            목표하는 직무의 호스트를 탭을 통해 <br className="sm:hidden" />
            빠르고 간편하게 만나보세요.
          </p>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-3 border-0 border-b border-solid border-gray-100 max-w-5xl mx-auto mb-12 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-2 px-1 text-center font-bold text-sm bg-transparent border-0 cursor-pointer transition-all duration-200 relative ${
                activeTab === tab ? 'text-[#1A73E8]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1A73E8]" />
              )}
            </button>
          ))}
        </div>

        {/* 호스트 카드 리스트 */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#1A73E8] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div style={listStyles}>
            {filteredHosts.map((host) => (
              <div
                key={host.id}
                onClick={() => navigate(`/mentors/apply/${host.id}`)}
                // 💡 h-full 로 높이를 통일하고, 패딩을 p-[18px]로 조절해 여백 확보
                className="bg-white border border-solid border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-[18px] flex flex-col justify-between cursor-pointer group h-full"
                style={{ boxSizing: 'border-box' }}
              >
                <div>
                  {/* 💡 aspect-[4/3] 적용으로 세로 비율 축소 */}
                  <div className="w-full aspect-[4/3] overflow-hidden rounded-xl mb-4 bg-slate-50 relative">
                    <img
                      src={host.profile_image || 'https://coffeechat.blob.core.windows.net/profiles/KakaoTalk_20260601_105227589.png'}
                      onError={(e) => { e.target.src = 'https://coffeechat.blob.core.windows.net/profiles/KakaoTalk_20260601_105227589.png'; }}
                      alt={host.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-700 bg-gray-100"
                    />
                    {host.isHonor && (
                      <span className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                        👑 명예
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <span className="px-2 py-0.5 bg-blue-50 text-[#1A73E8] text-[10px] font-bold rounded">
                        {host.category}
                      </span>
                      <span className="text-xs text-gray-500 font-bold">{host.job_title || '크루'}</span>
                    </div>
                    {/* 💡 폰트 크기와 여백 최적화 */}
                    <h3 className="font-bold text-gray-900 text-[1.05rem] leading-tight mb-1 m-0 group-hover:text-[#1A73E8] transition">
                      {host.name} 호스트
                    </h3>
                    <p className="text-[13px] text-gray-500 m-0 font-medium">{host.job_title || '커리어 가이드'}</p>
                    <p className="text-xs text-gray-400 mt-3 line-clamp-2 m-0 leading-relaxed font-medium">
                      "{stripHTML(host.bio) || host.mentor_intro || '환영합니다! 함께 길을 찾아보아요.'}"
                    </p>
                  </div>
                </div>
                
                {/* 💡 위 요소들과 충분한 간격을 두기 위해 mt-5 설정 */}
                <div className="pt-3 mt-5 border-0 border-t border-solid border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-orange-50 px-2.5 py-1 rounded-md border border-solid border-orange-100">
                    <span className="text-[11px] text-orange-600 font-extrabold">🔥 {host.views || 0}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#1A73E8] group-hover:underline">
                    프로필 보기 &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link 
            to="/mentors" 
            className="inline-block px-8 py-3.5 bg-gray-900 text-white font-bold text-sm rounded-full hover:bg-[#1A73E8] transition duration-300 shadow-md no-underline"
          >
            호스트 전체보기 &rarr;
          </Link>
        </div>
      </section>
    </div>
  );
}