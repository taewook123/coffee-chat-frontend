import React, { useState, useRef } from 'react';
// 아이콘이 필요하다면 lucide-react에서 가져옵니다 (기존에 쓰시던 것 활용)
import { Camera } from 'lucide-react'; 

const ProfileImageUpload = ({ userId, currentImageUrl, onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(currentImageUrl || 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400');
  
  // 숨겨진 파일 input을 클릭하기 위한 참조
  const fileInputRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000'; // 배포된 서버 주소

  // 1. 이미지를 클릭했을 때 숨겨진 input을 대신 클릭해주는 함수
  const handleImageClick = () => {
    if (!isUploading) {
      fileInputRef.current.click();
    }
  };

  // 2. 파일이 선택되었을 때 실행되는 업로드 함수
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);

    // [핵심] 파일을 서버로 보낼 때는 반드시 FormData 객체를 사용해야 합니다.
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 💡 fetch로 FormData를 보낼 때는 'Content-Type' 헤더를 적지 마세요! 브라우저가 알아서 세팅합니다.
      const response = await fetch(`${BACKEND_URL}/api/user/${userId}/profile-image`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        
        // 업로드 성공 시 화면의 이미지를 방금 받은 Azure URL로 즉시 교체합니다.
        setPreview(data.profile_image); 
        alert('프로필 이미지가 성공적으로 변경되었습니다!');
        
        // 부모 컴포넌트(대시보드 등)에도 변경된 URL을 알려줍니다.
        if (onUploadSuccess) onUploadSuccess(data.profile_image);
      } else {
        alert('이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 업로드 에러:', error);
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      // 같은 파일을 또 올릴 수 있도록 input 초기화
      event.target.value = ''; 
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 프로필 이미지 표시 영역 (클릭 가능) */}
      <div 
        onClick={handleImageClick}
        className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 cursor-pointer group hover:border-blue-400 transition-all"
        title="클릭하여 프로필 사진 변경"
      >
        <img 
          src={preview} 
          alt="프로필 이미지" 
          className={`w-full h-full object-cover ${isUploading ? 'opacity-50 blur-sm' : ''}`}
        />
        
        {/* 마우스 올렸을 때 나타나는 오버레이 효과 */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-8 h-8 text-white" />
        </div>

        {/* 로딩 스피너 */}
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-black/50 px-2 py-1 rounded">업로드 중...</span>
          </div>
        )}
      </div>

      {/* 진짜 파일 선택 input (화면에서는 숨김) */}
      <input 
        type="file" 
        accept="image/png, image/jpeg, image/jpg" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />
    </div>
  );
};

export default ProfileImageUpload;