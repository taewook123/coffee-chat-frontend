import React from 'react';
// 💡 투박한 🔍 이모지 대신 세련된 스타일을 위해 Lucide의 Search 아이콘을 수입합니다.
import { Search } from 'lucide-react';

const Hero = () => {
  return (
    // 💡 랜딩페이지의 고급스러운 베이지 톤 배경과 와이드한 패딩 스타일을 적용합니다.
    <section className="bg-[#f5f0e8] py-20 w-full">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        
        {/* 왼쪽: 텍스트 콘텐츠 및 검색바 영역 */}
        <div className="space-y-6">
          <h1 className="text-5xl font-bold text-[#1a2332] leading-tight m-0">
            꿈꾸던 기업의 현직자와<br />
            <span className="text-[#4a90e2]">커피 한 잔의 대화</span>를 나누세요
          </h1>
          <p className="text-lg text-gray-700 leading-relaxed m-0">
            검증된 멘토들과 실시간으로 연결되어 커리어 고민을 해결하고, <br />
            나만을 위한 맞춤형 로드맵과 생생한 업계 정보를 가득 얻어가세요.
          </p>

          {/* 💡 전자의 세련된 둥근 캡슐형 검색바 레이아웃에 기존 검색 기능을 결합 */}
          <div className="bg-white rounded-full shadow-lg p-2 flex items-center gap-3 max-w-xl mt-4 border border-solid border-transparent">
            <Search className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
            <input
              type="text"
              placeholder="회사, 직무, 키워드로 검색해보세요 (예: 네이버, 프론트엔드)"
              className="flex-1 outline-none text-gray-800 px-2 py-2 text-sm bg-transparent border-0"
            />
            <button 
              type="button"
              className="bg-[#4a90e2] hover:bg-[#3a7bc8] text-white px-8 py-3 rounded-full transition text-sm font-bold border-0 cursor-pointer"
            >
              검색
            </button>
          </div>
        </div>

        {/* 오른쪽: 서비스 신뢰도를 극대화하는 미팅 실사 일러스트레이션 영역 */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-md">
            {/* 은은한 그림자 장식 효과 가드 */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-200 to-amber-400 rounded-2xl blur opacity-20" />
            <img
              src="https://images.unsplash.com/photo-1604881988758-f76ad2f7aac1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxjb2ZmZWUlMjBtZWV0aW5nJTIwYnVzaW5lc3MlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzc4NzI2MjE3fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Coffee chat meeting"
              className="rounded-2xl shadow-2xl w-full object-cover h-96 relative z-10 border border-solid border-white/20"
            />
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;