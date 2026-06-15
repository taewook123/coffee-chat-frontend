import React from 'react';
import SearchBar from './SearchBar'; 

const Hero = () => {
  return (
    <section className="bg-[#F0F7FF] py-20 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        
        {/* 왼쪽: 텍스트 콘텐츠 및 검색바 영역 */}
        <div className="space-y-6">
          {/* 💡 break-keep 속성을 추가하여 "나누세요" 같은 단어가 잘리지 않게 보호합니다. */}
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-[1.3] m-0 break-keep">
            꿈꾸던 기업의 현직자와<br />
            <span className="text-[#1A73E8]">커피 한 잔의 대화</span>를 나누세요
          </h1>
          
          {/* 💡 설명글도 break-keep을 넣어 가독성을 높였습니다. */}
          <p className="text-base lg:text-lg text-gray-500 leading-relaxed m-0 break-keep">
            검증된 호스트들과 실시간으로 연결되어 커리어 고민을 해결하고, <br className="hidden md:block" />
            나만을 위한 맞춤형 로드맵과 생생한 업계 정보를 가득 얻어가세요.
          </p>

          <SearchBar placeholder="회사, 직무, 키워드 (예: 네이버, 백엔드)" />
        </div>

        {/* 오른쪽: 이미지 장식 일러스트레이션 영역 */}
        <div className="flex justify-center mt-8 md:mt-0">
          <div className="relative w-full max-w-md">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-200 to-blue-400 rounded-2xl blur opacity-20" />
            <img
              src="https://images.unsplash.com/photo-1604881988758-f76ad2f7aac1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxjb2ZmZWUlMjBtZWV0aW5nJTIwYnVzaW5lc3MlMjBwcm9mZXNzaW9uYWx|en|1|||1778726217|0&ixlib=rb-4.1.0&q=80&w=1080"
              alt="TeeTimes"
              className="rounded-2xl shadow-2xl w-full object-cover h-96 relative z-10 border border-solid border-white/20"
            />
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;