import React, { useState, useRef, useMemo, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import "quill/dist/quill.snow.css";
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { User } from 'lucide-react';
const MentorRegistration = () => {
  const [searchParams] = useSearchParams();
  
  const rawUserId = localStorage.getItem('userId');
  const validUserId = (rawUserId && rawUserId !== "undefined" && rawUserId !== "null") 
    ? rawUserId 
    : (searchParams.get('id') || "1");
  const [userId, setUserId] = useState(parseInt(validUserId));

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

  // 💡 수정된 ReactQuill 에디터 이미지 핸들러 (Azure Blob 업로드 방식)
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
        // 2. 백엔드의 에디터 전용 업로드 API로 전송 (앞서 만든 API 재사용)
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';
        const response = await axios.post(`${BACKEND_URL}/api/upload/editor-image`, uploadData, {
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
      handlers: {
        image: imageHandler,
      },
    },
  }), []);

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

  const [basicInfo, setBasicInfo] = useState({ 
    name: '', 
    job: '', 
    main_category: '', 
    sub_category: '',
    status: ''
  });

  const categories = [
    {
      main: '개발/엔지니어링',
      subs: [
        '전체 개발', '프론트엔드', '백엔드', '풀스택', '인프라/DevOps',
        '데이터 엔지니어', '머신러닝/AI', '모바일(iOS)', '모바일(Android)',
        '임베디드/펌웨어', '게임 개발', 'QA/테스트', '보안', 'DBA',
        '블록체인', 'AR/VR'
      ]
    },
    {
      main: '기획/PM',
      subs: [
        '전체 기획', '서비스 기획', '프로덕트 매니저(PM)', '콘텐츠 기획',
        '게임 기획', '광고 기획', '이벤트 기획', 'MD/상품기획',
        '전략기획', 'BM기획', '공연/전시 기획', 'IT컨설턴트'
      ]
    },
    {
      main: '디자인',
      subs: [
        '전체 디자인', 'UI/UX', '그래픽', '브랜드/BI',
        '영상/모션', '3D/렌더링', '패션', '제품/산업',
        '인테리어', '캐릭터/일러스트', '인쇄/출판', '광고디자인'
      ]
    },
    {
      main: '마케팅',
      subs: [
        '전체 마케팅', '디지털 마케팅', '퍼포먼스 마케팅', 'SNS/인플루언서',
        '브랜드 마케팅', 'CRM/그로스', '콘텐츠 마케팅', 'PR/홍보',
        'SEO/SEM', '이메일 마케팅', '제휴/파트너십', '데이터 분석'
      ]
    },
    {
      main: '경영/사무',
      subs: [
        '전체 경영', '경영기획', '인사/HR', '재무/회계',
        '법무/컴플라이언스', '총무/운영', '구매/자재', '물류/SCM',
        'IR/투자', '감사', '비서/어드민'
      ]
    },
    {
      main: '영업/CS',
      subs: [
        '전체 영업', 'B2B영업', 'B2C영업', '해외영업',
        '기술영업', '영업관리', '고객성공(CS)', '콜센터',
        '파트너/채널영업', '리테일/매장관리'
      ]
    },
    {
      main: '미디어/콘텐츠',
      subs: [
        '전체 미디어', '방송/PD', '작가/에디터', '포토그래퍼',
        '유튜브/크리에이터', '번역/통역', '출판/편집', '음악/음향',
        '스트리머', '기자/저널리스트', '웹툰/만화'
      ]
    },
    {
      main: '전문직',
      subs: [
        '전체 전문직', '변호사/법조', '의사/의료', '약사',
        '공인회계사(CPA)', '세무사', '노무사', '변리사',
        '건축사', '감정평가사', '금융(IB/PE/VC)', '컨설턴트(MBB)'
      ]
    },
    {
      main: '교육',
      subs: [
        '전체 교육', '학교교사', '학원강사', '온라인 강사',
        '교육기획', '코치/멘토', '연구원', '에듀테크'
      ]
    },
    {
      main: '스타트업',
      subs: [
        '전체 스타트업', '창업자/CEO', 'CTO', 'COO',
        '초기 멤버', '사이드프로젝트', '투자/VC', '액셀러레이터'
      ]
    },
    {
      main: '기타',
      subs: ['기타']
    }
  ];
  
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
  // 💡 [핵심 수정!] users 테이블에서 진짜 프로필 데이터 끌고오기
  // =========================================================
  useEffect(() => {
    if (!userId) return;

    // 이름 임시 복구 (만약 통신 지연 시 빈칸 방지용)
    const savedName = localStorage.getItem('userName');
    if (savedName) {
      setBasicInfo(prev => ({ ...prev, name: savedName }));
    }

    const fetchRealUserData = async () => {
      try {
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';
        
        // 🚨 여기가 가장 중요합니다! mentor/dashboard가 아니라 진짜 유저 정보를 주는 API를 호출합니다.
        const url = `${BACKEND_URL}/api/users/${userId}`;
        
        const response = await axios.get(url);
        const userData = response.data;

        if (!userData || Object.keys(userData).length === 0) return;

        // 1. 이름
        if (userData.name) {
          setBasicInfo(prev => ({ ...prev, name: userData.name }));
        }

        // 공통 파싱 함수 (DB에 JSON으로 저장되어있든 콤마로 저장되어있든 다 풀어줍니다)
        const safeParseArray = (rawStr) => {
          if (!rawStr) return [];
          try {
            const parsed = JSON.parse(rawStr);
            const arr = Array.isArray(parsed) ? parsed : String(rawStr).split(',').filter(Boolean);
            
            // 💡 [핵심] 0,1,2 로 쪼개진 이상한 객체가 오면 'text'만 쏙 뽑아내서 순수 글자로 바꿉니다.
            return arr.map(item => {
              if (typeof item === 'object' && item !== null) {
                return item.text || item.title || item.value || '';
              }
              return item;
            });
          } catch (e) {
            return String(rawStr).split(',').filter(Boolean);
          }
        };

        // 2. 해시태그
        if (userData.hashtags) {
          setHashtags(safeParseArray(userData.hashtags));
        }

        // 3. 주요 경력 (컬럼명이 experience일 수 있음)
        if (userData.experience) {
          setExperiences(safeParseArray(userData.experience));
        }

        // 4. 포트폴리오/링크
        if (userData.portfolio_url) {
          setLinks(safeParseArray(userData.portfolio_url));
        }

      } catch (error) {
        console.error("유저 정보를 불러오는데 실패했습니다.", error);
      }
    };
    
    fetchRealUserData();
  }, [userId]);


  // =========================================================
  // 💡 [데이터 전송] 백엔드 규격에 맞춰 전송
  // =========================================================
// =========================================================
  // 💡 [데이터 전송] Azure 업로드 후 백엔드 규격에 맞춰 전송
  // =========================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalFileUrl = ''; // 최종적으로 DB에 들어갈 파일 URL

    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

      // 🌟 1. 이력서/포트폴리오 파일이 첨부되어 있다면, 폼 제출 전에 파일부터 백엔드로 올립니다.
      if (attachedFiles.length > 0) {
        const fileFormData = new FormData();
        fileFormData.append('file', attachedFiles[0]);

        const uploadRes = await axios.post(`${BACKEND_URL}/api/upload/file`, fileFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        // 백엔드가 Azure에 올린 후 반환해준 URL을 변수에 저장합니다.
        finalFileUrl = uploadRes.data.url; 
      }

      // 🌟 2. 파일 URL을 포함해서 최종 JSON 데이터를 구성합니다.
      const targetUrl = links.length > 0 ? links.join(',') : '';

      const submitData = {
        name: basicInfo.name,
        status: basicInfo.status,
        main_category: basicInfo.main_category,
        sub_category: basicInfo.sub_category,
        hashtags: hashtags.join(','),
        
        portfolio_url: targetUrl,          
        portfolio_file_path: finalFileUrl, // <== 파일 이름 대신 Azure URL이 들어갑니다!

        job_title: basicInfo.job,                  
        career_history: JSON.stringify(histories),  
        mentor_intro: introduction,                 
        mentoring_topics: JSON.stringify(topics),         
        detailed_experience: JSON.stringify(experiences)
      };

      // 🌟 3. 완성된 데이터를 호스트 등록 API로 전송!
      const response = await fetch(`${BACKEND_URL}/api/mentor/register/${userId}`, {
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
          <p className="mt-2 text-gray-600">게스트에게 나누어 줄 소중한 경험을 적어주세요.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          <div className="bg-white rounded-2xl p-8 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-50">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
              <User className="w-5 h-5 text-blue-600" /> 기본 정보 및 경력
            </h2>
            
            <div className="space-y-6">
              
              {/* 1열: 이름 및 현재 직무 (1:1 비율) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">이름 / 닉네임</label>
                  <input type="text" name="name" value={basicInfo.name} onChange={handleBasicChange} placeholder="예: 사라 (Sarah)" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">현재 직무 및 연차</label>
                  <input type="text" name="job" value={basicInfo.job} onChange={handleBasicChange} placeholder="예: 백엔드 개발자 / 12년차" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                </div>
              </div>

              {/* 2열: 카테고리 및 상태 (1:1:1 비율) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">현재 상태</label>
                  <select 
                    name="status" 
                    value={basicInfo.status || '현직자'} 
                    onChange={handleBasicChange} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    {['현직자', '이직자', '프리랜서', '대학생', '취준생'].map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">주 직무</label>
                  <select 
                    name="main_category" 
                    value={basicInfo.main_category} 
                    onChange={(e) => setBasicInfo(prev => ({ ...prev, main_category: e.target.value, sub_category: '' }))} 
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                  >
                    <option value="" disabled>주 직무 선택</option>
                    {categories.map(cat => <option key={cat.main} value={cat.main}>{cat.main}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">세부 직무</label>
                  <select 
                    name="sub_category" 
                    value={basicInfo.sub_category} 
                    onChange={handleBasicChange}
                    disabled={!basicInfo.main_category}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <option value="" disabled>세부 직무 선택</option>
                    {categories
                      .find(c => c.main === basicInfo.main_category)?.subs
                      .map(sub => <option key={sub} value={sub}>{sub}</option>)
                    }
                  </select>
                </div>
              </div>
              
              <div className="border-t border-gray-100 my-2"></div>

              {/* 3열: 주요 경력 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">주요 경력 <span className="text-gray-400 font-normal text-xs ml-1">(최근 순으로 입력 후 Enter)</span></label>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {histories.map((history, index) => (
                    <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-800 border border-gray-200 rounded-lg text-sm font-medium shadow-sm">
                      {history}
                      <button type="button" onClick={() => removeHistory(index)} className="flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-red-500 hover:bg-white transition-colors focus:outline-none">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                />
              </div>

              {/* 4열: 해시태그 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">나를 표현하는 해시태그 <span className="text-gray-400 font-normal text-xs ml-1">(입력 후 Enter)</span></label>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {hashtags.map((tag, index) => (
                    <span key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-sm font-medium shadow-sm">
                      {tag}
                      <button type="button" onClick={() => removeHashtag(index)} className="flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:text-red-500 hover:bg-white transition-colors focus:outline-none">
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
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-slate-50 focus:bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
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
                게스트가 선택할 수 있는 대화 키워드를 입력해 주세요.
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