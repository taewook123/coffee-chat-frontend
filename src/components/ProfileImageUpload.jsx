import React, { useState, useRef, useEffect } from 'react';
import { Camera } from 'lucide-react'; 

const ProfileImageUpload = ({ currentImageUrl, onFileSelect }) => {
  const DEFAULT_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png';
  const [preview, setPreview] = useState(currentImageUrl || DEFAULT_IMAGE);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentImageUrl) {
      setPreview(currentImageUrl);
    }
  }, [currentImageUrl]);

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 1. 화면에 즉시 미리보기 띄우기
    setPreview(URL.createObjectURL(file));

    // 2. 부모에게 실제 파일 객체 넘겨주기 (업로드는 여기서 절대 안 함!)
    if (onFileSelect) onFileSelect(file);
    
    event.target.value = ''; 
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        onClick={handleImageClick}
        className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 cursor-pointer group hover:border-blue-400 transition-all shadow-sm"
        title="클릭하여 프로필 사진 변경"
      >
        <img 
          src={preview} 
          alt="프로필 이미지" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="w-8 h-8 text-white" />
        </div>
      </div>

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