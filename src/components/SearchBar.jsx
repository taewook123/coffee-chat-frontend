import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function SearchBar({ value, onChange, placeholder = "회사, 직무, 키워드로 검색해보세요...", variant = "capsule" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [localQuery, setLocalQuery] = useState(value || '');

  // 외부(URL 파라미터 등)에서 검색어가 바뀌면 동기화
  useEffect(() => {
    if (value !== undefined) setLocalQuery(value);
  }, [value]);

  const handleSearchSubmit = () => {
    // 1. 호스트 리스트 페이지가 아닐 때는 검색어를 들고 페이지 이동
    if (location.pathname !== '/mentors') {
      navigate(`/mentors?search=${encodeURIComponent(localQuery)}`);
    } else if (onChange) {
      // 2. 호스트 리스트 페이지인 경우 부모 상태 업데이트
      onChange(localQuery);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setLocalQuery(val);
    // 호스트 리스트 페이지에서는 타이핑할 때마다 실시간 라이브 검색 반영
    if (location.pathname === '/mentors' && onChange) {
      onChange(val);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  // 변형 1: Mentors 우측 상단 격자에 들어갈 사각형 형태
  if (variant === "square") {
    return (
      <div className="relative w-full">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={localQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs outline-none focus:border-blue-500 focus:bg-white transition text-gray-800 box-border"
        />
      </div>
    );
  }

  // 변형 2: 랜딩페이지(Hero)에 들어갈 세련된 캡슐 형태 (기본값)
  return (
    <div className="bg-white rounded-full shadow-lg p-2 flex items-center gap-3 w-full max-w-xl mt-4 border border-solid border-transparent box-border shadow-slate-200/80">
      <Search className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
      <input
        type="text"
        placeholder={placeholder}
        value={localQuery}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="flex-1 outline-none text-gray-800 px-2 py-2 text-sm bg-transparent border-0 min-w-0"
      />
      <button 
        type="button"
        onClick={handleSearchSubmit}
        className="bg-[#4a90e2] hover:bg-[#3a7bc8] text-white px-8 py-3 rounded-full transition text-sm font-bold border-0 cursor-pointer whitespace-nowrap flex-shrink-0"
      >
        검색
      </button>
    </div>
  );
}