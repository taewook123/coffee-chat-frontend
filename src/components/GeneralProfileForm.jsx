import React from 'react';
import { Upload, User as UserIcon, Link2, Sparkles, Award, FileText, X } from 'lucide-react';
import ProfileImageUpload from './ProfileImageUpload';
import TagInput from './TagInput';

export default function GeneralProfileForm({
  formData,
  setFormData,
  userId,
  portfolioFile,
  setPortfolioFile,
  handlePortfolioFileUpload,
  dbEmail,
  handleAddArrayItem,
  handleRemoveArrayItem,
  
  // 🚀 [추가됨] 부모(ProfileSetup)에서 받아온 이미지 파일 선택 핸들러
  handleProfileImageChange 
}) {
  return (
    <div className="grid md:grid-cols-3 gap-8 items-start animate-fadeIn">
      
      {/* 왼쪽 고정 사이드바 */}
      <div className="md:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center sticky top-24">
        <label className="block text-sm font-bold text-gray-700 mb-4 text-left">프로필 이미지 <span className="text-gray-400 font-normal text-xs">(선택)</span></label>
        
        {/* 💡 방금 바꾼 onFileSelect를 연결해줍니다 */}
        <ProfileImageUpload 
          currentImageUrl={formData.profile_image} 
          onFileSelect={handleProfileImageChange} 
        />
        
        <div className="mt-5 pt-4 border-t border-gray-100 bg-slate-50/50 rounded-xl p-3">
          <p className="text-[11px] text-gray-400 font-medium m-0 uppercase tracking-wider">로그인 이메일</p>
          <p className="text-xs text-gray-700 font-semibold mt-1 break-all m-0">{dbEmail}</p>
        </div>
      </div>

      {/* 오른쪽 입력란 */}
      <div className="md:col-span-2 space-y-6">
        
        {/* 기본 인적 사항 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 m-0 flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-blue-600" /> 기본 인적 사항
          </h3>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">이름 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(newUrl) => setFormData({ ...formData, profile_image: newUrl })}
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
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none text-sm"
              required
            />
            <p className="mt-1 text-xs text-gray-400">
              커피챗 예약 확정/신청 시 알림 문자를 받기 위해 필요합니다.
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">포트폴리오 / 링크 URL <span className="text-gray-400 font-normal text-xs">(선택)</span></label>
            <div className="relative">
              <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={formData.portfolio_url || ''}
                onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition text-sm bg-white"
                placeholder="GitHub 주소 또는 웹사이트 링크 (http:// 포함)"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">포트폴리오 파일 첨부 <span className="text-gray-400 font-normal text-xs">(선택)</span></label>
            <input type="file" id="portfolio-file" accept=".pdf,.zip" onChange={handlePortfolioFileUpload} className="hidden" />
            {!portfolioFile ? (
              <label htmlFor="portfolio-file" className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-50/30 transition text-sm text-gray-600 font-medium">
                <Upload className="w-4 h-4 text-gray-400" />
                <span>파일 선택 (PDF, ZIP 등)</span>
              </label>
            ) : (
              <div className="flex items-center justify-between px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-purple-900 truncate">{portfolioFile.name}</span>
                </div>
                <button type="button" onClick={() => setPortfolioFile(null)} className="p-1 bg-transparent border-0 text-purple-600 hover:text-purple-800 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 경력 및 보유 기술 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 m-0 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600" /> 경력 및 보유 기술
          </h3>
          
          <TagInput 
            label={<>주요 이력 및 경력 사항 <span className="text-red-500">*</span></>} 
            placeholder="예: 우아한형제들 백엔드 인턴 (입력 후 Enter)" 
            tags={formData.experience} 
            onAdd={(val) => handleAddArrayItem('experience', val)} 
            onRemove={(idx) => handleRemoveArrayItem('experience', idx)} 
          />

          <TagInput 
            label={<>내가 확실히 도움을 줄 수 있는 분야 <span className="text-red-500">*</span></>} 
            placeholder="예: Spring Boot JPA 구조 고도화 (입력 후 Enter)" 
            tags={formData.help_provide} 
            onAdd={(val) => handleAddArrayItem('help_provide', val)} 
            onRemove={(idx) => handleRemoveArrayItem('help_provide', idx)} 
          />

          <TagInput 
            label={<>배우고 싶은 분야 <span className="text-red-500">*</span></>} 
            placeholder="예: 대용량 데이터 분산 처리 아키텍처 (입력 후 Enter)" 
            tags={formData.help_receive} 
            onAdd={(val) => handleAddArrayItem('help_receive', val)} 
            onRemove={(idx) => handleRemoveArrayItem('help_receive', idx)} 
          />
        </div>

        {/* 자기소개 및 성향 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 m-0 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> 자기소개 및 성향
          </h3>
          
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">한 줄 자기소개 <span className="text-red-500">*</span></label>
            <textarea
              value={formData.bio || ''}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition text-sm resize-none bg-white"
              placeholder="커피챗을 통해 함께 나누고 싶은 고민이나 목표를 적어주세요."
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">MBTI <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.mbti || ''}
                onChange={(e) => setFormData({ ...formData, mbti: e.target.value.toUpperCase() })}
                maxLength={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition text-sm bg-white"
                placeholder="예: INTP"
                required
              />
            </div>
            
            <TagInput 
              label={<>관심 해시태그 <span className="text-red-500">*</span></>} 
              placeholder="#백엔드 #FastAPI (Enter)" 
              tags={formData.hashtags} 
              onAdd={(val) => handleAddArrayItem('hashtags', val)} 
              onRemove={(idx) => handleRemoveArrayItem('hashtags', idx)} 
            />
          </div>

        </div>

      </div>
    </div>
  );
} 