import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar'; 

const steps = [
  {
    id: 1,
    title: "나만의 호스트 찾기",
    description: "업계 전문가 리스트를 살펴보고 내 목표에 맞는 호스트를 찾아보세요.",
    image: "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 2,
    title: "세션 예약하기",
    description: "호스트의 일정을 확인하고 일대일 맞춤형 티타임을 간편하게 예약하세요.",
    image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    title: "대화하고 성장하기",
    description: "커리어 고민을 나누고 든든한 인사이트를 쟁취하세요.",
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80"
  }
];

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === steps.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="bg-[#F0F7FF] py-8 lg:py-12 w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        
        {/* 왼쪽: 텍스트 콘텐츠 및 검색바 영역 */}
        <div className="space-y-4 z-10 relative">
          <div className="space-y-5">
            <h1 className="text-[2.5rem] lg:text-[3.25rem] text-[#1a2332] leading-[1.3] m-0 break-keep tracking-tight">
              꿈꾸던 기업의 현직자와<br />
              <span className="text-[#1A73E8]">티 한 잔의 대화</span>를 나누세요
            </h1>
            
            <p className="text-base lg:text-lg text-gray-500 leading-[1.7] m-0 break-keep">
              검증된 호스트들과 실시간으로 연결되어 커리어 고민을 해결하고, <br className="hidden md:block" />
              나만을 위한 맞춤형 로드맵과 생생한 업계 정보를 가득 얻어가세요.
            </p>
          </div>

          {/* 💡 교정 핵심: 높이를 h-[58px]로 살짝 넓히고, 짤림의 원인이던 overflow-hidden을 삭제했습니다. */}
          <div className="bg-white h-[58px] flex items-center px-1 border border-blue-100/50 rounded-[29px] shadow-xl shadow-blue-900/5 max-w-md w-full">
            <SearchBar placeholder="회사, 직무, 키워드 (예: 네이버, 백엔드)" />
          </div>
        </div>

        {/* 오른쪽: 이용 방법 다이내믹 슬라이더 영역 */}
        <div className="flex justify-center mt-4 lg:mt-0 relative h-[380px] sm:h-[400px] w-[500px] max-w-lg mx-auto lg:ml-auto">
          <div className="absolute -inset-4 bg-gradient-to-tr from-blue-100 to-[#1A73E8] rounded-[2.5rem] blur-3xl opacity-20" />
          
          <div className="relative w-full h-full rounded-[2rem] overflow-hidden shadow-2xl bg-[#1a2332]">
            {steps.map((step, index) => (
              <div 
                key={step.id} 
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  currentSlide === index ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'
                }`}
              >
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover opacity-80"
                />
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/80 to-transparent p-8 pt-24">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="bg-[#1A73E8] text-white text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-md">
                      STEP {step.id}
                    </span>
                    <h3 className="text-white text-xl lg:text-2xl m-0 tracking-tight">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-gray-300 text-sm font-medium leading-relaxed line-clamp-2 m-0 break-keep">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}

            <div className="absolute top-5 right-6 z-20 flex gap-2">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    currentSlide === idx ? 'w-6 bg-[#1A73E8]' : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;