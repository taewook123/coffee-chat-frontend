import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';

import GeneralProfileForm from '../components/GeneralProfileForm.jsx';
import MentorProfileForm from '../components/MentorProfileForm.jsx';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
  const signUpData = location.state?.signUpData;
  const token = searchParams.get('token');
  const userId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState('general');
  const [isMentor, setIsMentor] = useState(false); 
  
  const [portfolioFile, setPortfolioFile] = useState(null);
  const [mentorResumeFile, setMentorResumeFile] = useState(null);
  const [dbEmail, setDbEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [tempCareer, setTempCareer] = useState('');
  const [tempHashtag, setTempHashtag] = useState('');
  const [tempLink, setTempLink] = useState('');
  const [tempKeyword, setTempKeyword] = useState(''); // 💡 [추가] 대화 키워드용 임시 저장소

  const [formData, setFormData] = useState({
    name: '', bio: '', mbti: '', hashtags: '', experience: '', portfolio_url: '', help_provide: '', help_receive: '',
    phone_number: '', 
    main_category: '', sub_category: '', status: '', profile_image: '',
    mentor_job: '', mentor_careers: [], mentor_hashtags: [], mentor_story: '', mentor_keywords: [], // 💡 배열로 초기화
    mentor_experiences: [{ id: Date.now(), text: '' }], mentor_links: []
  });

  // 💡 포장지(JSON) 예쁘게 벗기는 함수 부활!
  const safeParse = (data, fallback) => {
    if (!data) return fallback;
    if (typeof data === 'string') {
      try { return JSON.parse(data); } catch (e) { return fallback; }
    }
    return data;
  };

  // 💡 억울하게 묻어온 HTML 태그(<p> 등) 지워주는 함수 부활!
  const stripHTML = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    
    if (signUpData) {
      setDbEmail(signUpData.email || '');
      setFormData(prev => ({ ...prev, name: signUpData.name || '', phone_number: signUpData.phone_number || '' }));
      if (signUpData.role === 'mentor' || signUpData.role === 'host') setIsMentor(true);
    }

    if (token) localStorage.setItem('token', token);
    if (userId) localStorage.setItem('userId', userId);

    const fetchExistingProfile = async () => {
      const activeUserId = userId || localStorage.getItem('userId');
      if (!activeUserId) { setIsLoading(false); return; }
      try {
        const activeToken = token || localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/api/user/${activeUserId}`, {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        
        
        if (response.data) {
          const user = response.data;
          setDbEmail(user.email || '');

          // 🌟 [핵심] 일반 프로필 -> 호스트 프로필 완벽 연동 로직!
          const generalTags = user.hashtags ? user.hashtags.split(' ').map(t => t.trim()).filter(Boolean) : [];
          const mTags = safeParse(user.mentor_hashtags || user.mentoring_topics, []);
          const finalTags = mTags.length > 0 ? mTags : generalTags; // 호스트 태그가 없으면 일반 태그 가져오기

          const mLinks = safeParse(user.mentor_links, []);
          const finalLinks = mLinks.length > 0 ? mLinks : (user.portfolio_url ? [user.portfolio_url] : []); // 링크 가져오기

          setFormData({
            name: user.name || '', bio: stripHTML(user.bio), mbti: user.mbti || '', hashtags: user.hashtags || '',
            experience: user.experience || '', portfolio_url: user.portfolio_url || '',
            help_provide: user.help_provide || '', help_receive: user.help_receive || '', 
            phone_number: user.phone_number || '', 
            main_category: user.main_category || '', sub_category: user.sub_category || '',
            status: user.status || '', profile_image: user.profile_image || '',

            mentor_job: user.mentor_job || user.job_title || '', 
            mentor_careers: safeParse(user.mentor_careers || user.career_history, []),
            mentor_hashtags: finalTags, // 💡 연동된 해시태그 삽입
            mentor_story: stripHTML(user.mentor_story || user.mentor_intro), // 자기소개 <p> 제거
            mentor_keywords: safeParse(user.mentor_keywords, []), // 💡 대화 키워드 배열로 가져오기
            mentor_experiences: safeParse(user.detailed_experience || user.mentor_experiences, [{ id: Date.now(), text: '' }]),
            mentor_links: finalLinks // 💡 연동된 링크 삽입
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExistingProfile();
  }, [userId, token, searchParams, signUpData]);

  // 💡 한국어 치고 Enter 누를 때 폼 날아가거나 두 번 실행되는 고질병 완벽 방지!
  const handleKeyDownArray = (e, field, value, setValue) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.nativeEvent.isComposing) return; 

      if (value.trim() && !formData[field].includes(value.trim())) {
        setFormData({ ...formData, [field]: [...formData[field], value.trim()] });
      }
      setValue('');
    }
  };

  const handleRemoveArrayItem = (field, index) => {
    setFormData(prev => {
      const currentList = Array.isArray(prev[field]) ? prev[field] : [];
      const updated = [...currentList];
      updated.splice(index, 1);
      return { ...prev, [field]: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.bio.trim() || !formData.mbti.trim() || !formData.hashtags.trim() || !formData.experience.trim() || !formData.help_provide.trim() || !formData.help_receive.trim() || !formData.phone_number.trim()) {
      alert("⚠️ 필수 텍스트 항목을 채워주세요.");
      setActiveTab('general');
      return;
    }
    try {
      const activeToken = token || localStorage.getItem('token');
      
      const formatString = (val) => {
        if (Array.isArray(val)) return val.join(', ');
        return val != null ? String(val) : "";
      };

      const commonPayload = {
        name: formData.name, bio: formData.bio, mbti: formData.mbti, hashtags: formData.hashtags, experience: formData.experience,
        portfolio_url: formData.portfolio_url || (formData.mentor_links?.[0] || ''), // 💡 포트폴리오 링크도 양방향 연동!
        help_provide: formData.help_provide, help_receive: formData.help_receive, profile_image: formData.profile_image || "", phone_number: formData.phone_number, 
        main_category: formData.main_category, sub_category: formData.sub_category, status: formData.status,

        job_title: formData.mentor_job || "", 
        career_history: JSON.stringify(formData.mentor_careers || []), 
        mentor_intro: formData.mentor_story || "", 
        mentoring_topics: JSON.stringify(formData.mentor_hashtags || []), 
        mentor_keywords: JSON.stringify(formData.mentor_keywords || []), // 🌟 대화 키워드 DB 저장 누락 복구!
        detailed_experience: JSON.stringify(formData.mentor_experiences || []),
        mentor_links: JSON.stringify(formData.mentor_links || []) // 🌟 멘토 링크 DB 저장 누락 복구!
      };

      let response;
      if (signUpData) {
        response = await axios.post(`${BACKEND_URL}/api/auth/register`, { email: signUpData.email, password: signUpData.password, role: signUpData.role, ...commonPayload });
      } else {
        const activeUserId = userId || localStorage.getItem('userId');
        response = await axios.put(`${BACKEND_URL}/api/user/profile/${activeUserId}`, commonPayload, { headers: { Authorization: `Bearer ${activeToken}` } });
      }
      
      if (response && (response.status === 200 || response.status === 201)) {
        if (response.data && response.data.access_token) {
          localStorage.setItem('token', response.data.access_token);
          localStorage.setItem('userId', response.data.user_id || response.data.id || '');
          alert('🎉 회원가입 완료! 자동으로 로그인되었습니다.');
          navigate('/dashboard');
        } else {
          alert('🎉 변경 사항이 성공적으로 저장되었습니다!');
          navigate('/dashboard');
        }
      }
    } catch (error) {
      alert(`❌ DB 업데이트 실패: ${error.message}`);
    }
  };

  const handleExperienceChange = (id, text) => setFormData({ ...formData, mentor_experiences: formData.mentor_experiences.map(item => item.id === id ? { ...item, text } : item) });
  const addExperienceField = () => setFormData({ ...formData, mentor_experiences: [...formData.mentor_experiences, { id: Date.now(), text: '' }] });
  const removeExperienceField = (id) => setFormData({ ...formData, mentor_experiences: formData.mentor_experiences.filter(item => item.id !== id) });

  if (isLoading) return <div className="text-center pt-20">데이터 가드 가동 중...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 pb-16">
      <div className="max-w-4xl mx-auto px-6 pt-12">
        <div className="flex border-b border-gray-200 mb-8 max-w-md mx-auto bg-white p-1.5 rounded-xl shadow-sm">
          <button type="button" onClick={() => setActiveTab('general')} className={`flex-1 py-2.5 text-center font-bold text-sm border-0 rounded-lg cursor-pointer transition ${activeTab === 'general' ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-gray-500'}`}>일반 프로필 설정</button>
          <button type="button" onClick={() => { if (!isMentor) { alert("⚠️ 호스트 권한이 있는 회원만 접근할 수 있습니다."); return; } setActiveTab('mentor'); }} className={`flex-1 py-2.5 text-center font-bold text-sm border-0 rounded-lg cursor-pointer transition ${activeTab === 'mentor' ? 'bg-purple-600 text-white shadow-sm' : 'bg-transparent text-gray-500'}`}>호스트 프로필 설정</button>
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === 'general' ? (
            <GeneralProfileForm 
              formData={formData} 
              setFormData={setFormData} 
              userId={userId} 
              dbEmail={dbEmail} 
              portfolioFile={portfolioFile}
              setPortfolioFile={setPortfolioFile}
              handlePortfolioFileUpload={(e) => { if(e.target.files?.[0]) setPortfolioFile(e.target.files[0]); }}
              handleAddArrayItem={handleAddArrayItem}
              handleRemoveArrayItem={handleRemoveArrayItem}
            />
          ) : (
            // 💡 [추가] tempKeyword와 setTempKeyword를 자식 컴포넌트로 전달합니다!
            <MentorProfileForm 
              formData={formData} setFormData={setFormData} 
              tempCareer={tempCareer} setTempCareer={setTempCareer} 
              tempHashtag={tempHashtag} setTempHashtag={setTempHashtag} 
              tempLink={tempLink} setTempLink={setTempLink} 
              tempKeyword={tempKeyword} setTempKeyword={setTempKeyword} 
              mentorResumeFile={mentorResumeFile} setMentorResumeFile={setMentorResumeFile} 
              handleMentorResumeUpload={(e) => { if(e.target.files?.[0]) setMentorResumeFile(e.target.files[0]); }} 
              handleKeyDownArray={handleKeyDownArray} handleRemoveArrayItem={handleRemoveArrayItem} 
              handleExperienceChange={handleExperienceChange} addExperienceField={addExperienceField} removeExperienceField={removeExperienceField} 
            />
          )}

          <div className="text-center pt-8">
            <button type="submit" className="px-16 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-base transition border-0 cursor-pointer shadow-md hover:opacity-90">
              내 프로필 정보 최종 저장하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}