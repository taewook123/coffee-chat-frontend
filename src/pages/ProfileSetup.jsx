import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';

// 💡 [확장자 명시] Vite 번들 분석가 에러가 나지 않도록 수줍게 확장자 매핑
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

  const [tempCareer, setTempCareer] = useState('');
  const [tempHashtag, setTempHashtag] = useState('');
  const [tempLink, setTempLink] = useState('');

  const [formData, setFormData] = useState({
    name: '', bio: '', mbti: '', hashtags: '', experience: '', portfolio_url: '', help_provide: '', help_receive: '',
    phone_number: '', 
    main_category: '', 
    sub_category: '',
    status: '',
    profile_image: '',
    mentor_job: '', mentor_careers: [], mentor_hashtags: [], mentor_story: '', mentor_keywords: '',
    mentor_experiences: [{ id: Date.now(), text: '' }], mentor_links: []
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // 💡 1. signUpData가 있더라도 여기서 return으로 끝내지 않고 아래의 백엔드 조회를 무조건 타도록 수정!
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

          // 🌟 [핵심 수리] 문자열로 넘어온 배열(JSON)을 안전하게 진짜 배열로 바꿔주는 마법의 함수
          const safeParse = (data, fallback) => {
            if (!data) return fallback;
            if (typeof data === 'string') {
              try { return JSON.parse(data); } catch (e) { return fallback; }
            }
            return data;
          };

          // 🌟 [핵심 수리] 백엔드의 변수명(job_title 등)을 프론트엔드의 변수명(mentor_job 등)과 완벽하게 매핑
          const parsedExperiences = safeParse(user.detailed_experience, []);

          setFormData({
            name: user.name || '', 
            bio: user.bio || '', 
            mbti: user.mbti || '', 
            hashtags: user.hashtags || '',
            experience: user.experience || '', 
            portfolio_url: user.portfolio_url || '',
            help_provide: user.help_provide || '', 
            help_receive: user.help_receive || '', 
            phone_number: user.phone_number || '', 
            profile_image: user.profile_image || '',
            main_category: user.main_category || '',
            sub_category: user.sub_category || '',
            status: user.status || '',
            // 👇 바로 이 부분! 호스트(멘토) 데이터를 올바르게 연결하고 해독합니다.
            mentor_job: user.job_title || '', 
            mentor_story: user.mentor_intro || '',
            mentor_careers: safeParse(user.career_history, []),
            mentor_hashtags: safeParse(user.mentoring_topics, []),
            mentor_keywords: user.mentor_keywords || '',
            mentor_links: safeParse(user.mentor_links, []),
            
            // 경험 리스트가 비어있으면 쓸 수 있는 빈 칸을 하나 만들어줌
            mentor_experiences: parsedExperiences.length > 0 ? parsedExperiences : [{ id: Date.now(), text: '' }]
          });
        }
      } catch (error) {
        setDbEmail(searchParams.get('email') ? decodeURIComponent(searchParams.get('email')) : "sjlee5125@gmail.com");
        if (searchParams.get('name')) setFormData(prev => ({ ...prev, name: decodeURIComponent(searchParams.get('name')) }));
      } finally {
        setIsLoading(false);
      }
    };
    fetchExistingProfile();
  }, [userId, token, searchParams, signUpData]);


  const handleKeyDownArray = (e, field, value, setValue) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      if (!formData[field].includes(value.trim())) {
        setFormData({ ...formData, [field]: [...formData[field], value.trim()] });
      }
      setValue('');
    }
  };

  const handleRemoveArrayItem = (field, index) => {
    const updated = [...formData[field]];
    updated.splice(index, 1);
    setFormData({ ...formData, [field]: updated });
  };

  const handleExperienceChange = (id, text) => {
    setFormData({ ...formData, mentor_experiences: formData.mentor_experiences.map(item => item.id === id ? { ...item, text } : item) });
  };

  const addExperienceField = () => setFormData({ ...formData, mentor_experiences: [...formData.mentor_experiences, { id: Date.now(), text: '' }] });
  const removeExperienceField = (id) => setFormData({ ...formData, mentor_experiences: formData.mentor_experiences.filter(item => item.id !== id) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.bio.trim() || !formData.mbti.trim() || !formData.hashtags.trim() || !formData.experience.trim() || !formData.help_provide.trim() || !formData.help_receive.trim() || !formData.phone_number.trim()) {
      alert("⚠️ 필수 텍스트 항목을 채워주세요.");
      setActiveTab('general');
      return;
    }
    try {
      const activeToken = token || localStorage.getItem('token');
      const commonPayload = {
        name: formData.name, 
        bio: formData.bio, 
        mbti: formData.mbti, 
        hashtags: formData.hashtags, 
        experience: formData.experience,
        portfolio_url: formData.portfolio_url || '', 
        help_provide: formData.help_provide, 
        help_receive: formData.help_receive, 
        profile_image: formData.profile_image || "", 
        phone_number: formData.phone_number, 
        main_category: formData.main_category,
        sub_category: formData.sub_category,
        status: formData.status,

        job_title: formData.mentor_job || "", 
        career_history: JSON.stringify(formData.mentor_careers || []), 
        mentor_intro: formData.mentor_story || "", 
        mentoring_topics: JSON.stringify(formData.mentor_hashtags || []), 
        detailed_experience: JSON.stringify(formData.mentor_experiences || [])
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
        } 
        else {
          alert('🎉 프로필 정보가 성공적으로 업데이트되었습니다!');
          navigate('/dashboard'); 
        }
      }
    } catch (error) {
      alert(`❌ DB 업데이트 실패: ${error.message}`);
    }
  };

  if (isLoading) return <div className="text-center pt-20">데이터 가드 가동 중...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 pb-16">
      <div className="max-w-4xl mx-auto px-6 pt-12">
        
        {/* 상단 스위치 탭바 */}
        <div className="flex border-b border-gray-200 mb-8 max-w-md mx-auto bg-white p-1.5 rounded-xl shadow-sm">
          <button 
            type="button" 
            onClick={() => setActiveTab('general')} 
            className={`flex-1 py-2.5 text-center font-bold text-sm border-0 rounded-lg cursor-pointer transition ${activeTab === 'general' ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-gray-500'}`}
          >
            일반 프로필 설정
          </button>
          
          {/* 🚀 2. 속 썩이던 권한 검문소를 철거했습니다! 바로 클릭해서 넘어갑니다. */}
          <button 
            type="button" 
            onClick={() => {
              if (!isMentor) {
                alert("⚠️ 호스트(멘토) 권한이 있는 회원만 접근할 수 있습니다.\n호스트 등록을 원하시면 고객센터로 문의해 주세요.");
                return; // 👈 이 줄이 핵심! 알림창 띄우고 멈추게 합니다.
              }
              setActiveTab('mentor');
            }} 
            className={`flex-1 py-2.5 text-center font-bold text-sm border-0 rounded-lg cursor-pointer transition ${activeTab === 'mentor' ? 'bg-purple-600 text-white shadow-sm' : 'bg-transparent text-gray-500'}`}
          >
            호스트 프로필 설정
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {activeTab === 'general' ? (
            <GeneralProfileForm formData={formData} setFormData={setFormData} userId={userId} portfolioFile={portfolioFile} setPortfolioFile={setPortfolioFile} dbEmail={dbEmail} />
          ) : (
            <MentorProfileForm formData={formData} setFormData={setFormData} tempCareer={tempCareer} setTempCareer={setTempCareer} tempHashtag={tempHashtag} setTempHashtag={setTempHashtag} tempLink={tempLink} setTempLink={setTempLink} mentorResumeFile={mentorResumeFile} setMentorResumeFile={setMentorResumeFile} handleMentorResumeUpload={(e) => { if(e.target.files?.[0]) setMentorResumeFile(e.target.files[0]); }} handleKeyDownArray={handleKeyDownArray} handleRemoveArrayItem={handleRemoveArrayItem} handleExperienceChange={handleExperienceChange} addExperienceField={addExperienceField} removeExperienceField={removeExperienceField} />
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