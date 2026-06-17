import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ClipboardCheck } from 'lucide-react';

export default function HostChatReport() {
  const { chatId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6">
      {/* 
        mx-auto: 화면 중앙 정렬 확실하게 보장
        w-full: 반응형 대응
      */}
      <div className="w-full max-w-[520px] bg-white rounded-[24px] shadow-sm border border-[#E5E4E7] p-10 md:p-12 text-center mx-auto">
        
        <div className="w-16 h-16 bg-[#F0F7FF] rounded-2xl flex items-center justify-center mx-auto mb-8">
          <ClipboardCheck className="w-8 h-8 text-[#1A73E8]" />
        </div>
        
        <div className="mb-12 space-y-4">
          {/* 제목이 박스를 넘지 않도록 flex-wrap 설정 추가 */}
          <h1 className="text-[28px] md:text-[32px] font-semibold text-[#08060d] tracking-tight flex flex-wrap justify-center gap-x-2">
            <span>티타임이</span>
            <span>종료되었습니다.</span>
          </h1>
          
          {/* 
            px-4: 좌우 여백을 주어 글자가 테두리에 붙지 않게 함
            break-keep: 줄바꿈을 자연스럽게 유도
          */}
          <p className="text-[16px] md:text-[17px] text-[#6b6375] leading-relaxed px-4 break-keep">
            호스트님, 오늘도 귀중한 인사이트를 나누어 주셔서 감사합니다.
          </p>
        </div>
        
        <button
          onClick={() => navigate(`/coffee-chat-report/${chatId}`)}
          className="w-full py-4 bg-[#1A73E8] text-white rounded-xl font-medium text-[16px] transition-all hover:bg-[#1557b0] shadow-md active:scale-[0.98]"
        >
          AI 요약 리포트 확인하기
        </button>
      </div>
    </div>
  );
}