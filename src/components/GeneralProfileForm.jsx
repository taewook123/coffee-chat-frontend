import React, { useState, useRef } from 'react';
import { Upload, User as UserIcon, Link2, Sparkles, Award, FileText, X } from 'lucide-react';
import axios from 'axios';
import ProfileImageUpload from './ProfileImageUpload';
import TagInput from './TagInput';

export default function GeneralProfileForm({
  formData,
  setFormData,
  userId,
  portfolioFile,
  setPortfolioFile,
  dbEmail,
  handleAddArrayItem,
  handleRemoveArrayItem,
  handleProfileImageChange 
}) {
  // 🌟 드래그 앤 드롭 및 파일 창 강제 호출을 위한 상태와 Ref
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  
  // 🚀 Azure 컨테이너(portfoliofile)로 즉시 업로드하는 핸들러 (멘토 폼과 동일한 로직)
  const handlePortfolioUploadAction = async (file) => {
    if (!file) return;

    setPortfolioFile(file); // UI에 파일명 표시

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';
      
      const response = await axios.post(`${BACKEND_URL}/api/user/upload/portfolio`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // prev를 사용해서 옛날 데이터 덮어쓰기 방지
      setFormData(prev => ({ ...prev, portfolio_file_path: response.data.url }));
      
    } catch (error) {
      console.error("포트폴리오 업로드 실패:", error);
      alert("파일 업로드에 실패했습니다. 용량이나 네트워크 상태를 확인해주세요.");
      setPortfolioFile(null);
    } finally {
      // 같은 파일 다시 선택 가능하도록 초기화
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 💡 드래그 앤 드롭 이벤트 핸들러
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handlePortfolioUploadAction(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 items-start animate-fadeIn">
      
      {/* 🟢 왼쪽 고정 사이드바 */}
      <div className="md:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center sticky top-24">
        <label className="block text-sm font-bold text-gray-700 mb-4 text-left">프로필 이미지 <span className="text-gray-400 font-normal text-xs">(선택)</span></label>
        
        <ProfileImageUpload 
          currentImageUrl={formData.profile_image} 
          onFileSelect={handleProfileImageChange} 
        />
        
        <div className="mt-5 pt-4 border-t border-gray-100 bg-slate-50/50 rounded-xl p-3">
          <p className="text-[11px] text-gray-400 font-medium m-0 uppercase tracking-wider">로그인 이메일</p>
          <p className="text-xs text-gray-700 font-semibold mt-1 break-all m-0">{dbEmail}</p>
        </div>
      </div>

      {/* 🟢 오른쪽 입력란 */}
      <div className="md:col-span-2 space-y-6">
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 m-0 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-blue-600" /> 기본 인적 사항
          </h3>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">이름 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition text-sm bg-white"
              placeholder="실명을 입력해 주세요."
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              📱 휴대폰 번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="'-' 없이 숫자만 입력해주세요 (예: 01012345678)"
              value={formData.phone_number || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">포트폴리오 / 링크 URL <span className="text-gray-400 font-normal text-xs">(선택)</span></label>
            <div className="relative">
              <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={formData.portfolio_url || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, portfolio_url: e.target.value }))}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition text-sm bg-white"
                placeholder="GitHub 주소 또는 웹사이트 링크 (http:// 포함)"
              />
            </div>
          </div>
          
          {/* 🌟 드래그 앤 드롭 파일 첨부 영역 (파란색 테마 적용) */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">포트폴리오 파일 첨부 <span className="text-gray-400 font-normal text-xs">(선택)</span></label>
            
            <div 
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors cursor-pointer
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-slate-50 hover:border-blue-400'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                <div className="flex text-sm text-gray-600 justify-center">
                  <span className="relative font-bold text-blue-600 hover:text-blue-500">
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
                onChange={(e) => handlePortfolioUploadAction(e.target.files[0])} 
                accept=".pdf,.docx,.zip" 
              />
            </div>

            {/* 🌟 업로드된 파일 표시 영역 */}
            {!portfolioFile && !formData.portfolio_file_path ? null : (
              <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="flex-shrink-0 h-5 w-5 text-blue-600" />
                  <div className="overflow-hidden">
                    <p className="text-xs text-blue-400 font-medium mb-0.5">저장된 파일</p>
                    <p className="text-sm font-semibold text-blue-900 truncate">
                      {portfolioFile ? portfolioFile.name : formData.portfolio_file_path?.split('/').pop()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPortfolioFile(null); 
                    setFormData(prev => ({ ...prev, portfolio_file_path: '' })); 
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="flex-shrink-0 ml-4 p-1.5 text-blue-400 hover:text-red-500 bg-white rounded-md shadow-sm transition-colors focus:outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 m-0 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" /> 경력 및 보유 기술
          </h3>
          <TagInput label={<>주요 이력 및 경력 사항 <span className="text-red-500">*</span></>} placeholder="예: 우아한형제들 백엔드 인턴 (입력 후 Enter)" tags={formData.experience} onAdd={(val) => handleAddArrayItem('experience', val)} onRemove={(idx) => handleRemoveArrayItem('experience', idx)} />
          <TagInput label={<>내가 확실히 도움을 줄 수 있는 분야 <span className="text-red-500">*</span></>} placeholder="예: Spring Boot JPA 구조 고도화 (입력 후 Enter)" tags={formData.help_provide} onAdd={(val) => handleAddArrayItem('help_provide', val)} onRemove={(idx) => handleRemoveArrayItem('help_provide', idx)} />
          <TagInput label={<>배우고 싶은 분야 <span className="text-red-500">*</span></>} placeholder="예: 대용량 데이터 분산 처리 아키텍처 (입력 후 Enter)" tags={formData.help_receive} onAdd={(val) => handleAddArrayItem('help_receive', val)} onRemove={(idx) => handleRemoveArrayItem('help_receive', idx)} />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 m-0 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> 자기소개 및 성향
          </h3>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">한 줄 자기소개 <span className="text-red-500">*</span></label>
            <textarea value={formData.bio || ''} onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))} rows={3} className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition text-sm resize-none bg-white" placeholder="티타임을 통해 함께 나누고 싶은 고민이나 목표를 적어주세요." required />
          </div>
          <div className="grid md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">MBTI <span className="text-red-500">*</span></label>
              <input type="text" value={formData.mbti || ''} onChange={(e) => setFormData(prev => ({ ...prev, mbti: e.target.value.toUpperCase() }))} maxLength={4} className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition text-sm bg-white" placeholder="예: INTP" required />
            </div>
            <TagInput label={<>관심 해시태그 <span className="text-red-500">*</span></>} placeholder="#백엔드 #FastAPI (Enter)" tags={formData.hashtags} onAdd={(val) => handleAddArrayItem('hashtags', val)} onRemove={(idx) => handleRemoveArrayItem('hashtags', idx)} />
          </div>
        </div>

      </div>
    </div>
  );
}