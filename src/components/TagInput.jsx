// src/components/TagInput.jsx
import React, { useState } from 'react';

export default function TagInput({ label, placeholder, tags, onAdd, onRemove }) {
  const [inputValue, setInputValue] = useState('');

  const safeTags = (() => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }
    return [];
  })();

  // 💡 [핵심 방어막] 데이터 중에 진짜 글자가 있는 태그만 살아남게 필터링합니다.
  const validTags = safeTags.filter(tag => typeof tag === 'string' && tag.trim() !== '');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.nativeEvent.isComposing === false) {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !validTags.includes(newTag)) {
        onAdd(newTag);
      }
      setInputValue('');
    }
  };

  return (
    <div className="w-full">
      {/* 💡 부모 컴포넌트에서 빨간 별표(*)를 넘겨주면 그대로 출력합니다 */}
      <label className="block text-xs font-bold text-gray-600 mb-2">
        {label}
      </label>
      
      {/* 💡 [핵심] 텅 빈 유령 태그가 없을 때만 여백(mb-2) 공간을 만듭니다! */}
      {validTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {validTags.map((tag, index) => (
            <span 
              key={index} 
              className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[13px] font-bold rounded-md flex items-center gap-1 shadow-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="text-blue-400 hover:text-blue-800 focus:outline-none ml-1 font-extrabold"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 transition text-sm bg-white"
      />
    </div>
  );
}