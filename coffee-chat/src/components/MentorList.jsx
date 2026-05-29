import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// 💡 전자의 세련된 별(Star) 마감 처리를 위해 Lucide 아이콘을 수입합니다.
import { Star } from 'lucide-react';
import { mentors } from '../mentorsData'; 
import './MentorList.css';

const MentorList = () => {
  const navigate = useNavigate();
  
  // 💡 1. 탭 구성을 전자 명세인 [전체, 개발, 디자인, 기획] 구조로 완벽 체인지!
  const tabs = ['전체', '개발', '디자인', '기획'];
  const [activeTab, setActiveTab] = useState('전체');

  // 💡 2. 외부 mentorsData.js 스펙을 랜딩 컴포넌트 조건과 매칭되도록 가공 및 포맷팅
  const popularHosts = mentors.map((m) => {
    // 테일윈드 탭 필터링을 위한 대분류 카테고리 자동 유추 가드
    let cat = '개발';
    if (m.techStack.includes('UX 디자인') || m.techStack.includes('UI 디자인') || m.role.includes('디자인')) cat = '디자인';
    else if (m.techStack.includes('PM 역량') || m.techStack.includes('서비스 기획') || m.role.includes('기획')) cat = '기획';

    return {
      ...m,
      category: cat,
      rating: m.experience >= 10 ? 5.0 : 4.9, // 경력 기반 자연스러운 스코어 연출
      reviewCount: m.experience * 14 + 5    // 현실감 있는 리뷰 수 계산
    };
  });

  // 💡 3. 선택된 직무 탭에 따라 실시간으로 필터링되는 렌더링 엔진
  const filteredHosts = activeTab === '전체' 
    ? popularHosts 
    : popularHosts.filter(host => host.category === activeTab);

  // 💥 전자 레이아웃 씹힘 방지용 가로 4열 고정 정밀 그리드 락(Lock) 스타일
  const listStyles = {
    display: 'grid',
    gridTemplateColumns: window.innerWidth > 1024 ? 'repeat(4, minmax(0, 1fr))' : window.innerWidth > 640 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))',
    gap: '24px',
    width: '100%',
  };

  return (
    <div className="w-full bg-white">
      
      {/* ─── 섹션 1: 지금 주목받는 인기 호스트 ─── */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-20 border-0 border-b border-solid border-gray-100">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-[#1a2332] mb-3 m-0">
            지금 주목받는 인기 호스트
          </h2>
          <p className="text-gray-500 text-sm m-0 font-medium">목표하는 직무의 멘토를 탭을 통해 빠르게 만나보세요.</p>
        </div>

        {/* 전자의 트렌디한 탭 버튼 그룹 인터페이스 매칭 */}
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

        {/* 💥 전자의 미려한 테두리 라운딩 처리와 그림자 효과가 가미된 4열 그리드 리스트 */}
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
                    src={host.avatar}
                    alt={host.name}
                    className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                  />
                  {host.experience >= 7 && (
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
                    <span className="text-xs text-blue-600 font-bold">{host.company}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1 m-0 group-hover:text-[#4a90e2] transition">
                    {host.name} 멘토
                  </h3>
                  <p className="text-xs text-gray-500 m-0 font-medium">{host.role}</p>
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2 m-0 leading-relaxed font-medium">"{host.bio}"</p>
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
      </section>

      {/* ─── 섹션 2: How It Works (이용 방법) ─── */}
     <section id="how-it-works" className="bg-[#f5f0e8] py-20 w-full" style={{ boxSizing: 'border-box' }}>
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-[#1a2332] mb-16 m-0 tracking-tight">
            이용 방법
          </h2>
          
          {/* 💡 [정밀 타격 수정] Flex 레이아웃 인라인 스타일을 주입하여 무조건 가로로 나열되도록 잠금 조치합니다. */}
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: window.innerWidth > 768 ? 'row' : 'column', // 태블릿 이상 가로, 모바일은 세로 반응형 방어
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
                멘토의 오픈된 일정을 직관적으로 조율해 일대일 맞춤형 커피챗 세션을 간편하게 예약할 수 있습니다.
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
};

export default MentorList;