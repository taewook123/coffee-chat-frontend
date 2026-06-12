import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, Check, Download } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export default function CoffeeChatReport() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  
  const [summary, setSummary] = useState(''); 
  const [booking, setBooking] = useState(null);
  const [session, setSession] = useState(null);
  const [aiAdvice, setAiAdvice] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false); // ✅ 추가
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';
  const printRef = useRef(null);

  useEffect(() => {
    if (!chatId) return;

    axios.get(`${BACKEND_URL}/api/booking/detail/${chatId}`)
      .then(res => setBooking(res.data))
      .catch(err => console.error("예약 상세 로드 실패:", err));

    axios.get(`${BACKEND_URL}/api/chat-session/${chatId}`)
      .then(res => {
        setSession(res.data);
        if (res.data.ai_summary) {
          setSummary(res.data.ai_summary);
        }
      })
      .catch(err => console.error("세션 데이터 로드 실패:", err));
  }, [chatId]);

  // ✅ 로딩 상태 추가 + 에러 로그 강화
  const generateSummary = async () => {
    if (!chatId) return;
    setIsSummaryLoading(true);
    try {
      console.log("요약 생성 요청 시작...");
      // ✨ 1. POST 요청의 결과를 res 변수에 바로 담습니다.
      const res = await axios.post(`${BACKEND_URL}/api/chat-session/${chatId}/generate-summary`);
      
      // ✨ 2. 불필요한 GET 요청(const res = await axios.get...)은 삭제합니다.

      console.log("요약 결과:", res.data.ai_summary);
      
      // ✨ 3. POST 응답으로 받은 ai_summary를 바로 상태에 업데이트합니다.
      if (res.data.ai_summary) {
        setSummary(res.data.ai_summary);
      }
    } catch (err) {
      console.error("요약 생성 실패 상세:", err.response?.data || err.message);
      alert(`요약 생성 실패: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const generateAiAdvice = async () => {
    if (!chatId) return;
    setIsAiLoading(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/wrap-up/${chatId}`);
      if (response.data && response.data.report) {
        setAiAdvice(response.data.report);
      }
    } catch (error) {
      console.error("AI 어드바이스 생성 실패:", error);
      alert("AI 어드바이스를 불러오는데 실패했습니다.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      const imgData = await toPng(printRef.current, { pixelRatio: 2, backgroundColor: '#ffffff' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfPageHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const totalImgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      let heightLeft = totalImgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalImgHeight);
      heightLeft -= pdfPageHeight;
      while (heightLeft > 0) {
        position -= pdfPageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, totalImgHeight);
        heightLeft -= pdfPageHeight;
      }
      pdf.save(`커피챗_AI리포트_${booking?.mentor_name || '멘토'}.pdf`);
    } catch (error) {
      console.error("PDF 다운로드 실패:", error);
      alert("PDF 저장 중 문제가 발생했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          
          {/* 헤더 */}
          <div className="text-center mb-12">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-6">
              {booking?.mentor_name?.slice(0, 1) || '멘'}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">커피챗 AI 분석 리포트</h1>
            <p className="text-gray-600">
              {booking?.mentor_name || '멘토'} 님과의 대화가 성공적으로 분석되었습니다
            </p>
            {session?.duration_sec && (
              <p className="text-sm text-gray-400 mt-1">
                진행 시간: {Math.floor(session.duration_sec / 60)}분 {session.duration_sec % 60}초
              </p>
            )}
          </div>

          {/* ✅ printRef 시작: 요약본과 어드바이스를 모두 감쌉니다 */}
          <div ref={printRef} className="bg-white">

            {/* --- 1. 대화내용 요약본 영역 --- */}
            <div className="mb-10">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-gray-900">대화내용 요약본</p>
                {/* PDF 다운로드 버튼 */}
                {summary && (
                  <button
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                  >
                    <Download className="w-4 h-4" />
                    PDF 다운로드
                  </button>
                )}
              </div>

              {/* 요약 생성 버튼 또는 요약 내용 */}
              {isSummaryLoading ? (
                <div className="w-full min-h-[8rem] px-5 py-4 bg-blue-50 border border-blue-200 rounded-xl animate-pulse flex items-center justify-center text-blue-400">
                  요약 생성 중...
                </div>
              ) : summary ? (
                <div className="w-full min-h-[8rem] px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 whitespace-pre-wrap leading-relaxed shadow-sm">
                  {summary}
                </div>
              ) : (
                <div className="w-full min-h-[8rem] px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center">
                  <button
                    onClick={generateSummary}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
                  >
                    ✨ 요약 생성하기
                  </button>
                </div>
              )}
            </div>

            {/* --- 2. AI 어드바이스 영역 (버튼 위, 콘텐츠 아래) --- */}
            <div className="mb-6">
              
              {/* 타이틀 및 작동 버튼 */}
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-gray-900">AI 페이스메이커 어드바이스</p>
                <button
                  onClick={generateAiAdvice}
                  disabled={isAiLoading || aiAdvice !== ''}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all border-0 ${
                    aiAdvice !== ''
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : isAiLoading
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  {aiAdvice !== '' ? '생성 완료' : isAiLoading ? '분석 중...' : '어드바이스 받기 ✨'}
                </button>
              </div>

              {/* 로딩 스켈레톤 OR 어드바이스 마크다운 콘텐츠 */}
              {isAiLoading ? (
                <div className="w-full h-64 p-5 bg-blue-50/30 border-2 border-blue-100 rounded-xl animate-pulse flex flex-col gap-4">
                  <div className="h-4 bg-blue-200/50 rounded w-3/4"></div>
                  <div className="h-4 bg-blue-200/50 rounded w-full"></div>
                  <div className="h-4 bg-blue-200/50 rounded w-5/6"></div>
                  <div className="h-4 bg-blue-200/50 rounded w-1/2 mt-4"></div>
                </div>
              ) : (
                <div className="w-full h-auto min-h-[8rem] px-5 py-4 bg-white border-2 border-blue-100 rounded-xl text-gray-700 shadow-inner">
                  {aiAdvice ? (
                    <div className="prose prose-sm max-w-none prose-blue
                      prose-headings:font-bold prose-headings:text-gray-900
                      prose-a:text-blue-600 prose-li:marker:text-blue-500
                      prose-table:border-collapse prose-table:w-full
                      prose-th:bg-blue-50 prose-th:border prose-th:border-gray-300 prose-th:p-2
                      prose-td:border prose-td:border-gray-300 prose-td:p-3 break-keep"
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiAdvice}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="h-full min-h-[8rem] flex items-center justify-center text-gray-400">
                      상단의 버튼을 눌러 나만의 실전 커리어 가이드를 받아보세요!
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
          {/* ✅ printRef 끝 */}

          {/* --- 3. 하단 목록 버튼 --- */}
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