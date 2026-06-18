import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, Check, Download, FileText } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useReactToPrint } from 'react-to-print';

export default function CoffeeChatReport() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  
  const [summary, setSummary] = useState(''); 
  const [booking, setBooking] = useState(null);
  const [session, setSession] = useState(null);
  const [aiAdvice, setAiAdvice] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false); 
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';
  
  // 🌟 PDF로 추출할 영역을 지정하는 Ref
  const printRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;

    axios.get(`${BACKEND_URL}/api/booking/detail/${chatId}`)
      .then(res => setBooking(res.data))
      .catch(err => console.error("예약 상세 로드 실패:", err));

    axios.get(`${BACKEND_URL}/api/chat-session/${chatId}`)
      .then(res => {
        setSession(res.data);
        if (res.data.ai_summary) setSummary(res.data.ai_summary);
      })
      .catch(err => console.error("세션 데이터 로드 실패:", err));

    axios.get(`${BACKEND_URL}/api/coffee-chat-report/${chatId}`)
      .then(res => {
        if (res.data) {
          if (res.data.summary) setSummary(res.data.summary);
          if (res.data.ai_advice) setAiAdvice(res.data.ai_advice);
        }
      })
      .catch(err => console.error("리포트 데이터 로드 실패:", err));
  }, [chatId]);

  const generateSummary = async () => {
    if (!chatId) return;
    setIsSummaryLoading(true);
    const pollTimer = setInterval(async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/chat-session/${chatId}`);
        if (res.data && res.data.ai_summary) {
          setSummary(res.data.ai_summary);
          setIsSummaryLoading(false);
          clearInterval(pollTimer);
        }
      } catch (err) { }
    }, 2000);
    setTimeout(() => {
      clearInterval(pollTimer);
      setIsSummaryLoading(false);
    }, 30000);
  };

  const generateAiAdvice = async () => {
    if (!chatId) return;
    setIsAiLoading(true);

    try {
      // 🚨 [핵심 수정] 백엔드가 실제로 열어둔 주소(/api/wrap-up)로 POST 요청을 보냅니다!
      await axios.post(`${BACKEND_URL}/api/wrap-up/${chatId}`);

      const pollTimer = setInterval(async () => {
        try {
          const res = await axios.get(`${BACKEND_URL}/api/coffee-chat-report/${chatId}`);
          if (res.data && res.data.ai_advice) {
            setAiAdvice(res.data.ai_advice);
            if (res.data.summary) setSummary(res.data.summary);
            setIsAiLoading(false);
            clearInterval(pollTimer);
          }
        } catch (err) { 
          console.error("어드바이스 확인 중 에러:", err);
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(pollTimer);
        setIsAiLoading(false);
      }, 90000);

    } catch (error) {
      console.error("AI 생성 요청 실패:", error);
      setIsAiLoading(false);
      alert(`AI 생성 요청 실패! 백엔드 에러를 확인해주세요.`);
    }
  };

  // ==========================================
  // 🌟 [핵심 변경] 브라우저 내장 텍스트 PDF 엔진 사용
  // ==========================================
  const handlePrintPdf = useReactToPrint({
    contentRef: printRef, 
    content: () => printRef.current, 
    documentTitle: `티타임_AI리포트_${booking?.mentor_name || '멘토'}`,
    pageStyle: `
      @page { 
        size: A4; 
        margin: 15mm 15mm; 
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact;
        }
        /* 1. 그리드를 블록으로 풀어서 위아래로 배치 */
        .grid {
          display: block !important;
        }
        .md\\:col-span-8, .md\\:col-span-4 {
          width: 100% !important;
          display: block !important;
          margin-bottom: 30px !important;
        }
        
        /* 2. 🌟 핵심: 높이 제한을 풀고 다음 페이지로 넘어가게 허용 */
        .h-full, .min-h-\\[600px\\] {
          height: auto !important;
          min-height: auto !important;
        }
        .bg-white {
          display: block !important;
          height: auto !important;
          break-inside: auto !important;
          page-break-inside: auto !important;
          box-shadow: none !important;
          border: none !important;
        }

        /* 3. 문단이나 표가 중간에 반갈죽(잘림) 되는 것 방지 */
        p, h2, h3, li, tr {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
      }
    `,
  });

  return (
    <div 
      style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif" }} 
      className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12 font-sans"
    >
      <div className="max-w-7xl mx-auto w-full">
        
        {/* 헤더 */}
        <div className="flex flex-col items-center mb-12 text-center">
          {booking?.mentor_profile_image ? (
            <img 
              src={booking.mentor_profile_image} 
              alt="멘토 프로필" 
              className="w-20 h-20 rounded-2xl shadow-lg object-cover mb-6 border border-slate-200"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-slate-800 rounded-2xl shadow-lg flex items-center justify-center text-white font-extrabold text-3xl mb-6">
              {booking?.mentor_name?.slice(0, 1) || '멘'}
            </div>
          )}
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            티타임 AI 분석 리포트
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            {booking?.mentor_name || '멘토'} 님과의 대화가 성공적으로 분석되었습니다
          </p>
          {session?.duration_sec && (
            <div className="mt-4 px-4 py-1.5 bg-slate-200/50 text-slate-600 rounded-full text-sm font-semibold">
              진행 시간: {Math.floor(session.duration_sec / 60)}분 {session.duration_sec % 60}초
            </div>
          )}
        </div>

        {/* ========================================== */}
        {/* 🌟 printRef가 연결된 실제 PDF 변환 영역 */}
        {/* ========================================== */}
        <div ref={printRef} className="grid grid-cols-1 md:grid-cols-12 gap-8 bg-slate-50 items-start">
          
          {/* 왼쪽: 대화 요약 */}
          <div className="md:col-span-4 flex flex-col gap-6 h-full">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 flex flex-col h-full sticky top-6">
              
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  대화 요약
                </h2>
                {summary && (
                  <button
                    // 🌟 버튼 클릭 시 handlePrintPdf 실행!
                    onClick={handlePrintPdf}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    PDF로 저장
                  </button>
                )}
              </div>

              {isSummaryLoading ? (
                <div className="w-full h-full min-h-[12rem] px-6 py-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-pulse flex items-center justify-center text-indigo-400 font-semibold">
                  요약 데이터를 생성하고 있습니다...
                </div>
              ) : summary ? (
                <div className="w-full h-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 whitespace-pre-wrap leading-[2.2] text-base">
                  {summary}
                </div>
              ) : (
                <div className="w-full h-full min-h-[12rem] bg-slate-50 border border-slate-100 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center">
                  <p className="text-slate-400 mb-4 text-sm">아직 요약된 데이터가 없습니다.</p>
                  <button
                    onClick={generateSummary}
                    className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition shadow-md"
                  >
                    요약 생성하기
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: AI 어드바이스 */}
          <div className="md:col-span-8 flex flex-col gap-6 h-full">
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-8 md:p-10 min-h-[600px] flex flex-col">
              
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                  페이스메이커 어드바이스
                </h2>
                <button
                  onClick={generateAiAdvice}
                  disabled={isAiLoading || aiAdvice !== ''}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    aiAdvice !== ''
                      ? 'bg-emerald-50 text-emerald-600 cursor-default border border-emerald-100'
                      : isAiLoading
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                  }`}
                >
                  {aiAdvice !== '' ? '분석 완료' : isAiLoading ? 'AI가 분석 중입니다...' : '실전 가이드 생성 ✨'}
                </button>
              </div>

              {isAiLoading ? (
                <div className="w-full flex-1 p-6 bg-slate-50 rounded-2xl animate-pulse flex flex-col gap-6">
                  <div className="h-5 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-5 bg-slate-200 rounded w-full"></div>
                  <div className="h-5 bg-slate-200 rounded w-5/6"></div>
                  <div className="h-5 bg-slate-200 rounded w-1/2 mt-8"></div>
                </div>
              ) : (
                <div className="w-full flex-1 h-auto text-slate-800">
                  {aiAdvice ? (
                    <div className="prose prose-base max-w-none whitespace-pre-wrap
                      prose-p:leading-[2.2] prose-p:mt-6 prose-p:mb-6 prose-p:text-slate-700
                      prose-li:leading-[2.2] prose-li:mt-6 prose-li:mb-6 prose-li:text-slate-700
                      prose-ol:mt-6 prose-ul:mt-6
                      prose-headings:text-slate-900 prose-headings:font-extrabold prose-headings:tracking-tight
                      prose-h3:text-indigo-800 prose-h3:mt-10
                      prose-strong:text-slate-900 prose-strong:font-extrabold
                      prose-a:text-indigo-600 prose-li:marker:text-indigo-500 prose-li:marker:font-bold
                      prose-table:border-collapse prose-table:border prose-table:border-solid prose-table:border-slate-300 prose-table:w-full prose-table:my-10
                      prose-th:bg-slate-100 prose-th:border prose-th:border-solid prose-th:border-slate-300 prose-th:p-4 prose-th:text-slate-900 prose-th:font-bold
                      prose-td:border prose-td:border-solid prose-td:border-slate-300 prose-td:p-5 break-keep"
                    >
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({node, ...props}) => (
                            <div className="overflow-x-auto my-10 rounded-xl border border-slate-300 shadow-sm">
                              <table className="w-full border-collapse text-sm" {...props} />
                            </div>
                          ),
                          thead: ({node, ...props}) => (
                            <thead className="bg-slate-100 border-b border-slate-300" {...props} />
                          ),
                          th: ({node, ...props}) => (
                            <th className="border-r last:border-r-0 border-slate-300 px-5 py-4 text-left font-extrabold text-slate-900 align-middle" {...props} />
                          ),
                          td: ({node, ...props}) => (
                            <td className="border-t border-r last:border-r-0 border-slate-300 px-5 py-4 text-slate-700 align-top leading-[1.8]" {...props} />
                          )
                        }}
                      >
                        {aiAdvice}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="h-full min-h-[20rem] flex flex-col items-center justify-center text-slate-400 gap-4">
                      <Sparkles className="w-12 h-12 text-slate-200" />
                      <p className="text-lg">상단의 생성 버튼을 눌러 나만의 실전 커리어 가이드를 받아보세요.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
        </div>

        {/* 하단 네비게이션 */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={() => navigate('/coffee-chats')}
            className="w-full mt-6 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold text-lg transition shadow-lg flex items-center justify-center gap-3"
          >
            <Check className="w-5 h-5" />
            목록으로 돌아가기
          </button>
        </div>

      </div>
    </div>
  );
}