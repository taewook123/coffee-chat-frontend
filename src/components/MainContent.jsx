import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Hero from '../components/Hero'; // 이제 여기서 다 해결됩니다!

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

  const listStyles = {
    display: 'grid',
    gridTemplateColumns: window.innerWidth > 1024 ? 'repeat(4, minmax(0, 1fr))' : window.innerWidth > 640 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))',
    gap: '24px',
    width: '100%',
  };

  return (
    <div className="w-full bg-white">
      {/* 1. 상단 히어로 배너 영역 (여기에 다 포함됨!) */}
      <Hero />
      
      {/* 2. 지금 주목받는 인기 호스트 섹션 */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3 m-0 tracking-tight">
            지금 주목받는 인기 호스트
          </h2>
          <p className="text-gray-500 text-sm m-0 font-medium">목표하는 직무의 호스트를 탭을 통해 빠르게 만나보세요.</p>
        </div>

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
                className="bg-white border border-solid border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 p-5 flex flex-col justify-between cursor-pointer group"
                style={{ boxSizing: 'border-box' }}
              >
                <div>
                  <div className="w-full aspect-square overflow-hidden rounded-xl mb-4 bg-slate-50 relative">
                    <img
                      src={host.profile_image || 'https://coffeechat.blob.core.windows.net/profiles/KakaoTalk_20260601_105227589.png'}
                      onError={(e) => { e.target.src = 'https://coffeechat.blob.core.windows.net/profiles/KakaoTalk_20260601_105227589.png'; }}
                      alt={host.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500 bg-gray-100"
                    />
                    {host.isHonor && (
                      <span className="absolute top-2 left-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                        👑 명예
                      </span>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="px-2 py-0.5 bg-blue-50 text-[#1A73E8] text-[10px] font-bold rounded">
                        {host.category}
                      </span>
                      <span className="text-xs text-gray-500 font-bold">{host.job_title || '크루'}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-base mb-1 m-0 group-hover:text-[#1A73E8] transition">
                      {host.name} 호스트
                    </h3>
                    <p className="text-xs text-gray-500 m-0 font-medium">{host.job_title || '커리어 가이드'}</p>
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 m-0 leading-relaxed font-medium">"{stripHTML(host.bio) || host.mentor_intro || '환영합니다! 함께 길을 찾아보아요.'}"</p>
                  </div>
                </div>
                
                <div className="pt-3 mt-4 border-0 border-t border-solid border-gray-50 flex items-center justify-between">
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