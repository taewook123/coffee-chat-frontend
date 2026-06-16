import React, { useState, useRef, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import "quill/dist/quill.snow.css";
import { Upload, Briefcase, MessageSquare, Sparkles, X, Plus, GraduationCap, FileText } from 'lucide-react';
import ProfileImageUpload from './ProfileImageUpload';
import TagInput from './TagInput'; // 일반 프로필과 동일한 태그 UI 사용
import axios from 'axios';
export default function MentorProfileForm({
  formData,
  setFormData,
  userId,
  dbEmail,
  mentorResumeFile, 
  setMentorResumeFile,
  handleMentorResumeUpload,
  handleAddArrayItem,
  handleRemoveArrayItem,
  handleExperienceChange,
  addExperienceField,
  removeExperienceField,
    
}) {

  const categories = [
    { main: '개발/엔지니어링', subs: ['전체 개발', '프론트엔드', '백엔드', '풀스택', '인프라/DevOps', '데이터 엔지니어', '머신러닝/AI', '모바일(iOS)', '모바일(Android)', '임베디드/펌웨어', '게임 개발', 'QA/테스트', '보안', 'DBA', '블록체인', 'AR/VR'] },
    { main: '기획/PM', subs: ['전체 기획', '서비스 기획', '프로덕트 매니저(PM)', '콘텐츠 기획', '게임 기획', '광고 기획', '이벤트 기획', 'MD/상품기획', '전략기획', 'BM기획', '공연/전시 기획', 'IT컨설턴트'] },
    { main: '디자인', subs: ['전체 디자인', 'UI/UX', '그래픽', '브랜드/BI', '영상/모션', '3D/렌더링', '패션', '제품/산업', '인테리어', '캐릭터/일러스트', '인쇄/출판', '광고디자인'] },
    { main: '마케팅', subs: ['전체 마케팅', '디지털 마케팅', '퍼포먼스 마케팅', 'SNS/인플루언서', '브랜드 마케팅', 'CRM/그로스', '콘텐츠 마케팅', 'PR/홍보', 'SEO/SEM', '이메일 마케팅', '제휴/파트너십', '데이터 분석'] },
    { main: '경영/사무', subs: ['전체 경영', '경영기획', '인사/HR', '재무/회계', '법무/컴플라이언스', '총무/운영', '구매/자재', '물류/SCM', 'IR/투자', '감사', '비서/어드민'] },
    { main: '영업/CS', subs: ['전체 영업', 'B2B영업', 'B2C영업', '해외영업', '기술영업', '영업관리', '고객성공(CS)', '콜센터', '파트너/채널영업', '리테일/매장관리'] },
    { main: '미디어/콘텐츠', subs: ['전체 미디어', '방송/PD', '작가/에디터', '포토그래퍼', '유튜브/크리에이터', '번역/통역', '출판/편집', '음악/음향', '스트리머', '기자/저널리스트', '웹툰/만화'] },
    { main: '전문직', subs: ['전체 전문직', '변호사/법조', '의사/의료', '약사', '공인회계사(CPA)', '세무사', '노무사', '변리사', '건축사', '감정평가사', '금융(IB/PE/VC)', '컨설턴트(MBB)'] },
    { main: '교육', subs: ['전체 교육', '학교교사', '학원강사', '온라인 강사', '교육기획', '코치/멘토', '연구원', '에듀테크'] },
    { main: '스타트업', subs: ['전체 스타트업', '창업자/CEO', 'CTO', 'COO', '초기 멤버', '사이드프로젝트', '투자/VC', '액셀러레이터'] },
    { main: '기타', subs: ['기타'] }
  ];
  const statuses = ['현직자', '이직자', '프리랜서', '대학생', '취준생'];

  // 💡 ReactQuill 에디터 설정 (기능 유지)
  const quillRef = useRef(null);
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;

      // 1. 파일을 FormData에 담기
      const uploadData = new FormData();
      uploadData.append('file', file);

      try {
        // 2. 백엔드의 에디터 전용 업로드 API로 전송 (경로는 백엔드 설정에 맞게 변경)
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000'}/api/upload/editor-image`, uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        // 3. 백엔드에서 받아온 Azure URL
        const imageUrl = response.data.url;

        // 4. 에디터 커서 위치에 이미지 URL 삽입
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', imageUrl);
        quill.setSelection(range.index + 1);

      } catch (error) {
        console.error("에디터 이미지 업로드 실패:", error);
        alert("이미지 업로드에 실패했습니다. 파일 용량이나 네트워크 상태를 확인해주세요.");
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }], 
        ['bold', 'italic', 'underline', 'strike'], 
        [{'list': 'ordered'}, {'list': 'bullet'}], 
        [{ 'align': [] }], 
        ['image', 'link'], 
        ['clean'] 
      ],
      handlers: { image: imageHandler },
    },
  }), []);

  const formats = ['header', 'bold', 'italic', 'underline', 'strike', 'list', 'align', 'image', 'link'];

  // 💡 드래그 앤 드롭 설정 (기능 유지)
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMentorResumeUpload({ target: { files: e.dataTransfer.files } });
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 items-start animate-fadeIn font-sans">
      
      {/* 🟢 일반 프로필과 동일한 왼쪽 고정 사이드바 */}
      <div className="md:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center sticky top-24">
        <label className="block text-sm font-bold text-gray-700 mb-4 text-left">프로필 이미지</label>
        
        <ProfileImageUpload userId={userId} currentImageUrl={formData.profile_image} onUploadSuccess={(newUrl) => setFormData({ ...formData, profile_image: newUrl })} />
        <div className="mt-5 pt-4 border-t border-gray-100 bg-slate-50/50 rounded-xl p-3">
          <p className="text-[11px] text-gray-400 font-medium uppercase">로그인 이메일</p>
          <p className="text-xs text-gray-700 font-semibold mt-1">{dbEmail}</p>
        </div>
      </div>

      {/* 🟢 오른쪽 입력란 (일반 프로필 UI 박스 디자인 + 멘토 기능 탑재) */}
      <div className="md:col-span-2 space-y-6">
        
        {/* 1. 호스트 활동 정보 (일반 프로필에 없는 직무 정보만) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 m-0">호스트 활동 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">현재 상태</label>
              <select value={formData.status || '현직자'} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white">
                {statuses.map(st => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">주 직무</label>
              <select value={formData.main_category || ''} onChange={(e) => setFormData({ ...formData, main_category: e.target.value, sub_category: '' })} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white">
                <option value="">선택</option>
                {categories.map(c => <option key={c.main} value={c.main}>{c.main}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">세부 직무</label>
              <select value={formData.sub_category || ''} onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm bg-white">
                <option value="">선택</option>
                {categories.find(c => c.main === formData.main_category)?.subs.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* 2. 성장 스토리 (ReactQuill 에디터 이식) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 m-0 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> 성장 스토리 (자기소개)
          </h3>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-600 mb-2">
              어떤 길을 걸어오셨는지, 사진과 함께 자유롭게 작성해 보세요. <span className="text-red-500">*</span>
            </label>
            <div className="prose max-w-none 
              [&_.ql-container]:min-h-[250px] [&_.ql-container]:rounded-b-xl [&_.ql-container]:border-gray-300
              [&_.ql-toolbar]:rounded-t-xl [&_.ql-toolbar]:border-gray-300 [&_.ql-toolbar]:bg-slate-50
              [&_.ql-editor]:text-sm [&_.ql-editor]:text-gray-700
              focus-within:[&_.ql-container]:border-purple-500 focus-within:[&_.ql-toolbar]:border-purple-500 transition-all">
              <ReactQuill 
                ref={quillRef}
                theme="snow" 
                value={formData.mentor_story || ''}
                onChange={(val) => setFormData({ ...formData, mentor_story: val })} 
                modules={modules}
                formats={formats}
                placeholder="안녕하세요! 이곳에 사진과 글을 자유롭게 작성해 주세요..."
              />
            </div>
          </div>
        </div>

        {/* 3. 대화 키워드 및 경험 설정 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 m-0 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-600" /> 이런 주제로 편하게 이야기 걸어주세요
          </h3>
          
          <div className="pt-2">
            <TagInput 
              label={<>게스트가 선택할 수 있는 대화 키워드를 입력해 주세요. <span className="text-gray-400 font-normal text-xs">(입력 후 Enter)</span></>}
              placeholder="예: 이력서 첨삭, 모의면접, 이직 고민"
              tags={formData.hashtags}              // ← mentor_keywords → hashtags
              onAdd={(val) => handleAddArrayItem('hashtags', val)}      // ← 필드명 변경
              onRemove={(idx) => handleRemoveArrayItem('hashtags', idx)} // ← 필드명 변경
            />
          </div>

          <div className="pt-4">
            <label className="block text-xs font-bold text-gray-600 mb-2">이런 경험들을 공유해 드릴 수 있어요 <span className="text-gray-400 font-normal text-xs">(경험 상세 설명)</span></label>
            <div className="space-y-3">
              {Array.isArray(formData.mentor_experiences) && formData.mentor_experiences.map((exp) => (
                <div key={exp.id} className="flex gap-2 items-start bg-slate-50 p-3 rounded-xl border border-gray-100 relative">
                  <textarea
                    rows="2"
                    value={exp.text}
                    onChange={(e) => handleExperienceChange(exp.id, e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-purple-500 transition text-sm bg-white resize-none"
                    placeholder="초당 1,000만 개가 넘는 요청을 감당하기 위해 바닥부터 만든..."
                  />
                  {formData.mentor_experiences.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExperienceField(exp.id)}
                      className="p-3 bg-white text-red-500 border border-gray-200 rounded-lg hover:bg-red-50 transition cursor-pointer flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addExperienceField}
              className="mt-3 flex items-center justify-center gap-1.5 w-full py-3 bg-white hover:bg-slate-50 border border-dashed border-purple-300 text-purple-600 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> + 경험 추가하기
            </button>
          </div>
        </div>

        {/* 4. 링크 및 파일 첨부 (드래그 앤 드롭 이식) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 m-0 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-purple-600" /> 링크 및 파일 첨부
          </h3>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">이력서 등 파일 업로드</label>
            
            <div 
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors cursor-pointer
                ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-slate-50 hover:border-purple-400'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <span className="relative font-bold text-purple-600 hover:text-purple-500">
                    파일 선택하기
                  </span>
                  <p className="pl-1 font-medium">또는 여기로 드래그 앤 드롭</p>
                </div>
                <p className="text-xs text-gray-400 mt-2">PDF, DOCX, ZIP (최대 10MB)</p>
              </div>
              
              <input 
                type="file" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleMentorResumeUpload}
                accept=".pdf,.docx,.zip" 
              />
            </div>

            {/* 업로드된 파일 표시 */}
            {mentorResumeFile ? (
  // 새로 선택한 파일
  <div className="mt-4 flex items-center justify-between p-4 bg-purple-50 border border-purple-100 rounded-xl shadow-sm">
    <div className="flex items-center gap-3 overflow-hidden">
      <FileText className="flex-shrink-0 h-5 w-5 text-purple-600" />
      <div className="overflow-hidden">
        <p className="text-xs text-purple-400 font-medium mb-0.5">새로 선택한 파일</p>
        <p className="text-sm font-semibold text-purple-900 truncate">{mentorResumeFile.name}</p>
      </div>
    </div>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setMentorResumeFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }}
      className="flex-shrink-0 ml-4 p-1.5 text-purple-400 hover:text-red-500 bg-white rounded-md shadow-sm transition-colors focus:outline-none"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
) : formData.portfolio_file_path ? (
  // DB에 저장된 기존 파일
  <div className="mt-4 flex items-center justify-between p-4 bg-slate-50 border border-gray-200 rounded-xl shadow-sm">
    <div className="flex items-center gap-3 overflow-hidden">
      <FileText className="flex-shrink-0 h-5 w-5 text-gray-400" />
      <div className="overflow-hidden">
        <p className="text-xs text-gray-400 font-medium mb-0.5">저장된 파일</p>
        <p className="text-sm font-semibold text-gray-700 truncate">
          {formData.portfolio_file_path.split('/').pop()}
        </p>
      </div>
    </div>
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        setFormData({ ...formData, portfolio_file_path: '' });
      }}
      className="flex-shrink-0 ml-4 p-1.5 text-gray-400 hover:text-red-500 bg-white rounded-md shadow-sm transition-colors focus:outline-none"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
) : null}
          </div>

        </div>

      </div>
    </div>
  );
}