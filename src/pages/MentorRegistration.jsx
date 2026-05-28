import React, { useState, useRef, useMemo, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import "quill/dist/quill.snow.css";
import { useSearchParams } from 'react-router-dom';

const MentorRegistration = () => {
  const [searchParams] = useSearchParams();
  
  const activeUserId = localStorage.getItem('userId') || searchParams.get('id') || "1";
  const [userId, setUserId] = useState(parseInt(activeUserId));

  const [experiences, setExperiences] = useState([""]);

  const addExperience = () => {
    setExperiences([...experiences, ""]);
  };

  const removeExperience = (indexToRemove) => {
    setExperiences(experiences.filter((_, index) => index !== indexToRemove));
  };

  const handleExperienceChange = (index, value) => {
    const newExperiences = [...experiences];
    newExperiences[index] = value;
    setExperiences(newExperiences);
  };
  
  const [introduction, setIntroduction] = useState('');
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
        const range = quillRef.current.getEditor().getSelection();
        const quill = quillRef.current.getEditor();
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
      handlers: {
        image: imageHandler,
      },
    },
  }), []);

  // 💡 Quill 불릿 에러를 방지하는 표준 규격 포맷 선언
  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'align', 'image', 'link',
  ];

  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const [basicInfo, setBasicInfo] = useState({ name: '', job: '' });
  
  const handleBasicChange = (e) => {
    const { name, value } = e.target;
    setBasicInfo(prev => ({ ...prev, [name]: value }));
  };

  const [histories, setHistories] = useState([]);
  const [historyInput, setHistoryInput] = useState('');

  const handleHistoryKeyDown = (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      const newHistory = historyInput.trim();
      if (newHistory && !histories.includes(newHistory)) {
        setHistories([...histories, newHistory]);
        setHistoryInput('');
      }
    }
  };

  const removeHistory = (indexToRemove) => {
    setHistories(histories.filter((_, index) => index !== indexToRemove));
  };

  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState('');

  const handleHashtagKeyDown = (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      let newHashtag = hashtagInput.trim();
      if (newHashtag && !newHashtag.startsWith('#')) {
        newHashtag = '#' + newHashtag;
      }
      if (newHashtag && !hashtags.includes(newHashtag)) {
        setHashtags([...hashtags, newHashtag]);
        setHashtagInput('');
      }
    }
  };

  const removeHashtag = (indexToRemove) => {
    setHashtags(hashtags.filter((_, index) => index !== indexToRemove));
  };

  const [topics, setTopics] = useState([]); 
  const [topicInput, setTopicInput] = useState('');

  const handleTopicKeyDown = (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault(); 
      const newTopic = topicInput.trim();
      if (newTopic && !topics.includes(newTopic)) {
        setTopics([...topics, newTopic]);
        setTopicInput(''); 
      }
    }
  };

  const removeTopic = (indexToRemove) => {
    setTopics(topics.filter((_, index) => index !== indexToRemove));
  };

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
      const newFiles = Array.from(e.dataTransfer.files);
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (e, indexToRemove) => {
    e.stopPropagation(); 
    setAttachedFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const [links, setLinks] = useState([]); 
  const [linkInput, setLinkInput] = useState('');

  const handleLinkKeyDown = (e) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      let newLink = linkInput.trim();
      if (newLink && !newLink.startsWith('http')) {
        newLink = 'https://www.' + newLink;
      }
      if (newLink && !links.includes(newLink)) {
        setLinks([...links, newLink]);
        setLinkInput(''); 
      }
    }
  };

  const removeLink = (indexToRemove) => {
    setLinks(links.filter((_, index) => index !== indexToRemove));
  };

  // =========================================================
  // 💡 1. [데이터 로드] 원격 클라우드 IP 타겟팅 및 연동 동기화
  // =========================================================
  useEffect(() => {
    if (!userId) {
      console.warn("로그인된 유저 ID를 찾을 수 없습니다.");
      return; 
    }

    const fetchSharedUserData = async () => {
      try {
        const response = await fetch(`http://48.211.169.52:8000/api/user/${userId}`);
        if (response.ok) {
          const userData = await response.json();
          setBasicInfo(prev => ({ ...prev, name: userData.name || '' }));
          
          if (userData.hashtags) {
            setHashtags(userData.hashtags.split(',').filter(Boolean));
          }
          
          if (userData.portfolio_url) {
            try {
              setLinks(JSON.parse(userData.portfolio_url));
            } catch (e) {
              // 쉼표 문자열로 저장되어 있을 경우 분리 바인딩 백업
              setLinks(userData.portfolio_url.split(',').filter(Boolean));
            }
          }
        }
      } catch (error) {
        console.error("공유 프로필 데이터를 불러오는 중 에러 발생:", error);
      }
    };
    fetchSharedUserData();
  }, [userId]);


  // =========================================================
  // 💡 2. [데이터 전송] 꼬이던 JSON 문자열 포맷 해제 및 다이렉트 연동
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🟢 [정밀 교정] JSON.stringify 껍데기를 벗겨내고 순수 문자열 형태로 포장합니다.
    const targetUrl = links.length > 0 ? links.join(',') : '';
    const targetFilePath = attachedFiles.length > 0 ? attachedFiles[0].name : '';

    const submitData = {
      name: basicInfo.name,
      hashtags: hashtags.join(','),
      
      // 💡 컬럼 스펙에 100% 대응하도록 가방 래핑 수정 완료!
      portfolio_url: targetUrl,          
      portfolio_file_path: targetFilePath,  

      job_title: basicInfo.job,                  
      career_history: JSON.stringify(histories),  
      mentor_intro: introduction,                 
      mentoring_topics: JSON.stringify(topics),         
      detailed_experience: JSON.stringify(experiences)
    };

    try {
      const response = await fetch(`http://48.211.169.52:8000/api/mentor/register/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });
      
      if (response.ok) {
        alert("🎉 성공적으로 호스트 등록이 완료되었습니다!");
      } else {
        alert("❌ 호스트 등록에 실패했습니다. 입력값을 확인해 주세요.");
      }
    } catch (error) {
      console.error("통신 에러 발생:", error);
      alert("서버와의 통신이 원활하지 않습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">호스트 등록하기</h1>
          <p className="mt-2 text-gray-600">예비 멘티들에게 나누어 줄 소중한 경험을 적어주세요.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          <div className="bg-white rounded-2xl p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              기본 정보 및 경력
            </h2>
            <div className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름 / 닉네임</label>
                  <input type="text" name="name" value={basicInfo.name} onChange={handleBasicChange} placeholder="예: 사라 (Sarah)" className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">현재 직무 및 연차</label>
                  <input type="text" name="job" value={basicInfo.job} onChange={handleBasicChange} placeholder="예: 백엔드 개발자 / 12년차" className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">주요 경력 (최근 순으로 입력 후 Enter)</label>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {histories.map((history, index) => (
                    <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-800 border border-gray-300 rounded-lg text-sm font-medium">
                      {history}
                      <button type="button" onClick={() => removeHistory(index)} className="flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-red-500 transition-colors focus:outline-none">
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <input 
                  type="text" 
                  value={historyInput} 
                  onChange={(e) => setHistoryInput(e.target.value)} 
                  onKeyDown={handleHistoryKeyDown} 
                  placeholder="예: Google (2020 - 현재)" 
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">나를 표현하는 해시태그 (입력 후 Enter)</label>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {hashtags.map((tag, index) => (
                    <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-sm font-medium">
                      {tag}
                      <button type="button" onClick={() => removeHashtag(index)} className="flex items-center justify-center w-4 h-4 rounded-full text-blue-300 hover:text-red-500 hover:bg-white transition-colors focus:outline-none">
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                <input 
                  type="text" 
                  value={hashtagInput} 
                  onChange={(e) => setHashtagInput(e.target.value)} 
                  onKeyDown={handleHashtagKeyDown} 
                  placeholder="예: 대용량트래픽" 
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              호스트님의 성장 스토리 (자기소개)
            </h2>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                어떤 길을 걸어오셨는지, 사진과 함께 자유롭게 작성해 보세요.
              </label>
              
              <div className="prose max-w-none 
                [&_.ql-container]:min-h-[300px] [&_.ql-container]:rounded-b-lg [&_.ql-container]:border-gray-200
                [&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:border-gray-200 [&_.ql-toolbar]:bg-gray-50
                [&_.ql-editor]:text-base [&_.ql-editor]:text-gray-700 [&_.ql-editor]:leading-relaxed
                focus-within:[&_.ql-container]:border-blue-300 focus-within:[&_.ql-toolbar]:border-blue-300 transition-all">
                
                <ReactQuill 
                  ref={quillRef}
                  theme="snow" 
                  value={introduction}
                  onChange={setIntroduction} 
                  modules={modules}
                  formats={formats}
                  placeholder="안녕하세요! 이곳에 사진과 글을 자유롭게 작성해 주세요..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              이런 주제로 편하게 이야기 걸어주세요
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                멘티가 선택할 수 있는 대화 키워드를 입력해 주세요.
              </label>
              
              <div className="flex gap-2 mb-3 flex-wrap">
                {topics.map((topic, index) => (
                  <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 border border-gray-200 rounded-full text-sm">
                    {topic}
                    <button 
                      type="button" 
                      onClick={() => removeTopic(index)}
                      className="flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors focus:outline-none"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              
              <input 
                type="text" 
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={handleTopicKeyDown}
                placeholder="새로운 대화 주제 키워드 입력 후 Enter" 
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" 
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              이런 경험들을 공유해 드릴 수 있어요
            </h2>
            
            <div className="space-y-4">
              {experiences.map((exp, index) => (
                <div key={index} className="space-y-4 border border-gray-100 rounded-xl p-5 bg-gray-50/50 relative">
                  
                  {experiences.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeExperience(index)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-sm font-medium"
                    >
                      삭제
                    </button>
                  )}
                
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">경험 상세 설명</label>
                    <textarea 
                      rows="3" 
                      value={exp} 
                      onChange={(e) => handleExperienceChange(index, e.target.value)} 
                      placeholder="초당 1,000만 개가 넘는 요청을 감당하기 위해 바닥부터 만든..." 
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    ></textarea>
                  </div>
                </div>
              ))}

              <button 
                type="button" 
                onClick={addExperience}
                className="w-full py-3 border-2 border-dashed border-blue-200 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-50 hover:border-blue-400 transition-all mt-2"
              >
                + 경험 추가하기
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              링크 및 파일 첨부
            </h2>
            <div className="space-y-5">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">포트폴리오, 깃허브, 블로그 링크 (입력 후 Enter)</label>
                
                <div className="flex gap-2 mb-3 flex-wrap">
                  {links.map((link, index) => (
                    <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-blue-600 border border-gray-200 rounded-lg text-sm font-medium">
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                      </svg>
                      <span className="max-w-[200px] truncate">{link}</span>
                      <button 
                        type="button" 
                        onClick={() => removeLink(index)} 
                        className="flex items-center justify-center w-4 h-4 ml-1 text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
                
                <input 
                  type="text" 
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={handleLinkKeyDown}
                  placeholder="예: github.com/my-profile" 
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
          
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이력서 등 파일 업로드</label>
                
                <div 
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer
                    ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-blue-400'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-600 justify-center">
                      <span className="relative font-medium text-blue-600 hover:text-blue-500">
                        파일 선택하기
                      </span>
                      <p className="pl-1">또는 여기로 드래그 앤 드롭</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, DOCX, PNG (최대 10MB)</p>
                  </div>
                  
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.png" 
                  />
                </div>

                {attachedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <svg className="flex-shrink-0 h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                          </svg>
                          <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={(e) => handleRemoveFile(e, index)} 
                          className="flex-shrink-0 ml-4 text-sm text-gray-400 hover:text-red-500 font-semibold transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 pb-12">
            <button 
              type="submit" 
              className="w-full bg-[#4078FF] hover:bg-[#2b65f5] text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              호스트 등록하기
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default MentorRegistration;