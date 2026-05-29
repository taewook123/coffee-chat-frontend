import React from 'react';
import { Upload, User as UserIcon, Link2, Sparkles, Award, FileText, X } from 'lucide-react';

export default function GeneralProfileForm({
  formData,
  setFormData,
  profileImage,
  handleImageUpload,
  portfolioFile,
  setPortfolioFile,
  handlePortfolioFileUpload,
  dbEmail
}) {
  return (
    <div className="grid md:grid-cols-3 gap-8 items-start animate-fadeIn">
      
      {/* 왼쪽 고정 사이드바 */}
      <div className="md:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-center sticky top-24">
        <label className="block text-sm font-bold text-gray-700 mb-4 text-left">프로필 이미지 <span className="text-gray-400 font-normal text-xs">(선택)</span></label>
        <div className="relative group max-w-[180px] mx-auto">
          <input type="file" id="profile-image" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <label htmlFor="profile-image" className="block w-full aspect-square bg-slate-100 rounded-2xl cursor-pointer hover:bg-slate-200 transition flex flex-col items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 group-hover:border-blue-500">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <Upload className="w-7 h-7 text-gray-400 mx-auto mb-2 group-hover:text-blue-500 transition" />
                <p className="text-xs text-gray-500 m-0">사진 업로드</p>
              </div>
            )}
          </label>
        </div>
        
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
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition text-sm bg-white"
              placeholder="실명을 입력해 주세요."
              required
            />
          </div>
          <div className="mb-6">
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
                value={formData.portfolio_url}
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 m-0 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600" /> 경력 및 보유 기술
          </h3>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">주요 이력 및 경력 사항 <span className="text-red-500">*</span></label>
            <textarea
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition text-sm resize-none bg-white"
              placeholder="담당 직무, 프로젝트 기술 스택 등을 상세하게 요약해 주세요."
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">내가 확실히 도움을 줄 수 있는 분야 <span className="text-red-500">*</span></label>
            <textarea
              value={formData.help_provide}
              onChange={(e) => setFormData({ ...formData, help_provide: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition text-sm resize-none bg-white"
              placeholder="예: Spring Boot JPA 구조 고도화, 실시간 2-way 웹소켓 동기화"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">배우고 싶은 분야 <span className="text-red-500">*</span></label>
            <textarea
              value={formData.help_receive}
              onChange={(e) => setFormData({ ...formData, help_receive: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition text-sm resize-none bg-white"
              placeholder="예: 대용량 데이터 분산 인프라 아키텍처"
              required
            />
          </div>
        </div>

        {/* 자기소개 및 성향 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 m-0 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> 자기소개 및 성향
          </h3>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">한 줄 자기소개 <span className="text-red-500">*</span></label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition text-sm resize-none bg-white"
              placeholder="커피챗을 통해 함께 나누고 싶은 고민이나 목표를 적어주세요."
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">MBTI <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.mbti}
                onChange={(e) => setFormData({ ...formData, mbti: e.target.value.toUpperCase() })}
                maxLength={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition text-sm bg-white"
                placeholder="예: INTP"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">관심 해시태그 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={formData.hashtags}
                onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition text-sm bg-white"
                placeholder="#백엔드 #FastAPI #리액트"
                required
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}