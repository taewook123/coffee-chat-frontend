import React, { useState, useRef, useMemo } from 'react';
import ReactQuill from 'react-quill-new';
import "quill/dist/quill.snow.css";
import { Upload, Briefcase, MessageSquare, Sparkles, X, Plus, GraduationCap, FileText } from 'lucide-react';
import ProfileImageUpload from './ProfileImageUpload';
import TagInput from './TagInput'; // 일반 프로필과 동일한 태그 UI 사용

export default function MentorProfileForm({
  formData,
  setFormData,
  tempCareer, setTempCareer,
  tempHashtag, setTempHashtag,
  tempLink, setTempLink,
  tempKeyword, setTempKeyword,
  mentorResumeFile, setMentorResumeFile,
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
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection(true);
        quill.insertEmbed(range.index, 'image', reader.result); 
        quill.setSelection(range.index + 1);
      };
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
    <div className="space-y-6 animate-fadeIn">
      
      {/* 기본 정보 및 경력 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 m-0 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-purple-600" /> 기본 정보 및 경력
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">현재 상태</label>
            <select 
              value={formData.status || '현직자'} 
              onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
            >
              {statuses.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">주 직무</label>
            <select 
              value={formData.main_category || ''} 
              onChange={(e) => setFormData({ ...formData, main_category: e.target.value, sub_category: '' })} 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm"
            >
              <option value="">주 직무 선택</option>
              {categories.map(c => <option key={c.main} value={c.main}>{c.main}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">세부 직무</label>
            <select 
              value={formData.sub_category || ''} 
              onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })} 
              disabled={!formData.main_category} 
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm disabled:bg-gray-100"
            >
              <option value="">세부 직무 선택</option>
              {categories.find(c => c.main === formData.main_category)?.subs.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">이름 / 닉네임</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-purple-500 transition text-sm bg-white"
            placeholder="호스트 활동 시 노출될 이름 혹은 닉네임"
          />
        </div>



        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">현재 직무 및 연차</label>
          <input
            type="text"
            value={formData.mentor_job}
            onChange={(e) => setFormData({ ...formData, mentor_job: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-purple-500 transition text-sm bg-white"
            placeholder="예: 시니어 백엔드 엔지니어 (5년차)"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">주요 경력 <span className="text-gray-400 font-normal text-xs">(최근 순으로 입력 후 Enter)</span></label>
          <input
            type="text"
            value={tempCareer}
            onChange={(e) => setTempCareer(e.target.value)}
            onKeyDown={(e) => handleKeyDownArray(e, 'mentor_careers', tempCareer, setTempCareer)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-purple-500 transition text-sm bg-white mb-3"
            placeholder="예: Google (2020 - 현재)"
          />
          <div className="flex flex-wrap gap-2">
            {formData.mentor_careers.map((career, index) => (
              <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-gray-700">
                {career}
                <X className="w-3 h-3 cursor-pointer text-gray-400 hover:text-gray-600" onClick={() => handleRemoveArrayItem('mentor_careers', index)} />
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">나를 표현하는 해시태그 <span className="text-gray-400 font-normal text-xs">(입력 후 Enter)</span></label>
          <input
            type="text"
            value={tempHashtag}
            onChange={(e) => setTempHashtag(e.target.value)}
            onKeyDown={(e) => handleKeyDownArray(e, 'mentor_hashtags', tempHashtag, setTempHashtag)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-purple-500 transition text-sm bg-white mb-3"
            placeholder="예: #대용량트래픽 #프로이직러"
          />
          <div className="flex flex-wrap gap-2">
            {formData.mentor_hashtags.map((tag, index) => (
              <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-100 rounded-lg text-xs font-semibold text-purple-700">
                {tag.startsWith('#') ? tag : `#${tag}`}
                <X className="w-3 h-3 cursor-pointer text-purple-400 hover:text-purple-600" onClick={() => handleRemoveArrayItem('mentor_hashtags', index)} />
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">호스트님의 성장 스토리 (자기소개)</label>
          <textarea
            value={formData.mentor_story}
            onChange={(e) => setFormData({ ...formData, mentor_story: e.target.value })}
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-purple-500 transition text-sm resize-none bg-white"
            placeholder="안녕하세요! 이곳에 걸어오신 길을 자유롭게 적어주세요..."
          />
        </div>
      </div>

      {/* 대화 주제 키워드 설정 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
        <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 m-0 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-600" /> 이런 주제로 편하게 이야기 걸어주세요
        </h3>

      {/* 💡 단어는 '게스트'로 바꾸고, Enter 키 태그 기능은 완벽하게 유지한 블록입니다! */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">게스트가 선택할 수 있는 대화 키워드를 입력해 주세요. <span className="text-gray-400 font-normal text-xs">(입력 후 Enter)</span></label>
          <input
            type="text"
            value={tempKeyword} // ProfileSetup에서 내려주는 임시 값 사용
            onChange={(e) => setTempKeyword(e.target.value)}
            onKeyDown={(e) => handleKeyDownArray(e, 'mentor_keywords', tempKeyword, setTempKeyword)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-purple-500 transition text-sm bg-white mb-3"
            placeholder="예: 이력서첨삭, 면접준비 (입력 후 Enter를 쳐주세요!)"
          />
          <div className="flex flex-wrap gap-2">
            {(Array.isArray(formData.mentor_keywords) ? formData.mentor_keywords : []).map((kw, index) => (
              <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-100 rounded-lg text-xs font-semibold text-green-700">
                {kw}
                <X className="w-3 h-3 cursor-pointer text-green-400 hover:text-green-600" onClick={() => handleRemoveArrayItem('mentor_keywords', index)} />
              </span>
            ))}
          </div>
        </div>

        {/* MentorProfileForm.jsx 파일 내부의 경험 상세 설명 입력창 부분 */}
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">이런 경험들을 공유해 드릴 수 있어요 <span className="text-gray-400 font-normal text-xs">(경험 상세 설명)</span></label>
          <div className="space-y-3">
            {formData.mentor_experiences.map((exp, idx) => (
              <div key={exp.id} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={exp.text}
                  onChange={(e) => handleExperienceChange(exp.id, e.target.value)}
                  
                  // 💡 [핵심 추가] 여기서 엔터를 쳐도 폼이 제출되어 일반 탭으로 튕기는 현상을 완벽 차단합니다!
                  onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                  
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-purple-500 transition text-sm bg-white"
                  placeholder="초당 1,000만 개가 넘는 요청을 감당하기 위해 바닥부터 만든..."
                />
                {formData.mentor_experiences.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExperienceField(exp.id)}
                    className="p-3 bg-red-50 text-red-500 border border-red-100 rounded-xl hover:bg-red-100 transition cursor-pointer"
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
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-dashed border-gray-300 rounded-xl text-xs font-bold text-gray-600 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> + 경험 추가하기
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