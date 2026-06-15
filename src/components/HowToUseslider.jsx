import React, { useState, useEffect } from 'react';

const steps = [
  {
    id: 1,
    title: "나만의 호스트 찾기",
    description: "엄선된 네카라쿠배 업계 전문가 리스트를 살펴보고 자신의 커리어 목표에 꼭 맞는 완벽한 호스트를 찾아보세요.",
    // 💡 상황에 맞는 고품질 무료 이미지(Unsplash) 적용
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80" 
  },
  {
    id: 2,
    title: "세션 예약하기",
    description: "호스트의 오픈된 일정을 직관적으로 조율해 일대일 맞춤형 티타임 세션을 간편하게 예약할 수 있습니다.",
    image: "https://images.unsplash.com/photo-1606857521015-7f9fcf423740?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: 3,
    title: "대화하고 성장하기",
    description: "호스트와 직접 만나 기술 장벽, 불안감에 대해 질문을 주고받으며 든든한 커리어 인사이트를 쟁취하세요.",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80"
  }
];

const HowToUseSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // 4초마다 자동으로 다음 슬라이드로 넘어가는 효과
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === steps.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 bg-white w-full">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">이용 방법</h2>
          <p className="text-gray-500">단 3단계로 꿈꾸던 커리어를 향해 나아가세요.</p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20 bg-[#F0F7FF] rounded-3xl p-8 lg:p-12">
          
          {/* 왼쪽: 텍스트 및 인디케이터 영역 */}
          <div className="w-full md:w-1/2 space-y-8">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                onClick={() => setCurrentSlide(index)}
                className={`cursor-pointer transition-all duration-300 border-l-4 pl-6 py-2 ${
                  currentSlide === index 
                    ? 'border-[#1A73E8] opacity-100' 
                    : 'border-transparent opacity-40 hover:opacity-70'
                }`}
              >
                <div className="flex items-center gap-4 mb-2">
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                    currentSlide === index ? 'bg-[#1A73E8] text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step.id}
                  </span>
                  <h3 className={`text-xl font-bold ${currentSlide === index ? 'text-[#1A73E8]' : 'text-gray-700'}`}>
                    {step.title}
                  </h3>
                </div>
                <p className={`text-gray-600 leading-relaxed transition-all duration-300 overflow-hidden ${
                  currentSlide === index ? 'max-h-40 mt-3' : 'max-h-0'
                }`}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* 오른쪽: 변하는 이미지 영역 */}
          <div className="w-full md:w-1/2 relative h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden shadow-xl">
            {steps.map((step, index) => (
              <img
                key={step.id}
                src={step.image}
                alt={step.title}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                  currentSlide === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              />
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default HowToUseSlider;