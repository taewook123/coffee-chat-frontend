import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';

import GeneralProfileForm from '../components/GeneralProfileForm.jsx';
import MentorProfileForm from '../components/MentorProfileForm.jsx';

export default function ProfileSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';
  const signUpData = location.state?.signUpData;
  const token = searchParams.get('token');
  const userId = searchParams.get('id');

  const [activeTab, setActiveTab] = useState('general');
  const [isMentor, setIsMentor] = useState(false); 
  
  const [portfolioFile, setPortfolioFile] = useState(null);
  const [mentorResumeFile, setMentorResumeFile] = useState(null);
  const [dbEmail, setDbEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '', bio: '', mbti: '', portfolio_url: '', phone_number: '', 
    main_category: '', sub_category: '', status: '', profile_image: '',
    portfolio_file_path: '', // 🚀 이력서 파일 저장용 컬럼 추가
    hashtags: [], experience: [], help_provide: [], help_receive: [], 
    mentor_job: '', mentor_careers: [], mentor_hashtags: [], mentor_story: '', 
    mentor_keywords: [], mentor_experiences: [{ id: Date.now(), text: '' }], mentor_links: []
  });

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
      if (!activeUserId) {
        setIsLoading(false);
        return;
      }
      try {
        const activeToken = token || localStorage.getItem('token');
        const response = await axios.get(`${BACKEND_URL}/api/user/${activeUserId}`, {
          headers: { Authorization: `Bearer ${activeToken}` }
        });
        
        if (response.data) {
          const user = response.data;
          setDbEmail(user.email || '');
          setIsMentor(user.is_mentor || false); 

          const safeParse = (data, fallback) => {
            if (!data) return fallback;
            if (typeof data === 'string') {
              try { 
                const parsed = JSON.parse(data);
                if (Array.isArray(fallback) && !Array.isArray(parsed)) return [String(parsed)];
                return parsed;
              } catch (e) { return fallback; }
            }
            return Array.isArray(fallback) && !Array.isArray(data) ? [String(data)] : data;
          };

          const parseToTags = (data) => {
            if (!data) return [];
            if (Array.isArray(data)) return data.map(String);
            if (typeof data === 'string') {
              try { 
                const parsed = JSON.parse(data); 
                if (Array.isArray(parsed)) return parsed.map(String);
              } catch (e) {}
              return data.split(',').map(s => String(s).trim()).filter(Boolean);
            }
            return [String(data)];
          };

          const parsedExperiences = safeParse(user.detailed_experience, []);

          setFormData({
            name: user.name || '', 
            bio: user.bio || '', 
            mbti: user.mbti || '', 
            portfolio_url: user.portfolio_url || '',
            portfolio_file_path: user.portfolio_file_path || '', // 🚀 이력서/포트폴리오 경로 로딩
            phone_number: user.phone_number || '', 
            profile_image: user.profile_image || '',
            main_category: user.main_category || '',
            sub_category: user.sub_category || '',
            status: user.status || '',
            
            hashtags: parseToTags(user.hashtags),
            experience: parseToTags(user.experience),
            help_provide: parseToTags(user.help_provide),
            help_receive: parseToTags(user.help_receive),

            mentor_job: user.job_title || '', 
            mentor_story: user.mentor_intro || '',
            mentor_careers: safeParse(user.career_history, []),
            mentor_hashtags: safeParse(user.mentoring_topics, []),
            mentor_keywords: parseToTags(user.mentor_keywords),
            mentor_links: safeParse(user.mentor_links, []),
            mentor_experiences: parsedExperiences.length > 0 ? parsedExperiences : [{ id: Date.now(), text: '' }]
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

  // 🚀 태그 스위치 함수
  const handleAddArrayItem = (field, value) => {
    setFormData(prev => {
      const currentList = Array.isArray(prev[field]) ? prev[field] : [];
      return { ...prev, [field]: [...currentList, value] };
    });
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
    if (!formData.name.trim() || !formData.phone_number.trim()) {
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
        name: String(formData.name || ""), 
        bio: String(formData.bio || ""), 
        mbti: String(formData.mbti || ""), 
        portfolio_url: String(formData.portfolio_url || ""), 
        
        // 🚀 이력서 파일(멘토 폼)이나 포트폴리오 파일(일반 폼)이 있으면 파일 이름을 저장
        portfolio_file_path: mentorResumeFile ? mentorResumeFile.name : (portfolioFile ? portfolioFile.name : formData.portfolio_file_path || ""),
        
        profile_image: String(formData.profile_image || ""), 
        phone_number: String(formData.phone_number || ""), 
        main_category: String(formData.main_category || ""),
        sub_category: String(formData.sub_category || ""),
        status: String(formData.status || ""),

        hashtags: formatString(formData.hashtags),
        experience: formatString(formData.experience),
        help_provide: formatString(formData.help_provide),
        help_receive: formatString(formData.help_receive),

        job_title: String(formData.sub_category || "직무 미정"), 
        career_history: JSON.stringify(formData.experience || []), 
        mentor_intro: String(formData.mentor_story || formData.bio || ""), 
        mentoring_topics: JSON.stringify(formData.hashtags || []), 
        detailed_experience: JSON.stringify(
          (formData.mentor_experiences || []).filter(exp => exp.text && String(exp.text).trim() !== '')
        ),
        mentor_keywords: JSON.stringify(formData.mentor_keywords || []),
        mentor_links: JSON.stringify(formData.mentor_links || [])
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
        } else {
          alert('🎉 프로필 정보가 성공적으로 업데이트되었습니다!');
        }
        window.location.href = '/dashboard'; 
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
            <MentorProfileForm 
              formData={formData} 
              setFormData={setFormData} 
              userId={userId || localStorage.getItem('userId')}
              dbEmail={dbEmail}
              mentorResumeFile={mentorResumeFile} 
              setMentorResumeFile={setMentorResumeFile} 
              handleMentorResumeUpload={(e) => { if(e.target.files?.[0]) setMentorResumeFile(e.target.files[0]); }} 
              
              // 🚀 깜빡하고 안 넘겨줬던 스위치를 드디어 멘토 폼에도 장착 완료!!
              handleAddArrayItem={handleAddArrayItem}
              handleRemoveArrayItem={handleRemoveArrayItem}
              
              handleExperienceChange={handleExperienceChange} 
              addExperienceField={addExperienceField} 
              removeExperienceField={removeExperienceField} 
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