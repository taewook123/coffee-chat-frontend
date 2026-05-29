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
  const [portfolioFile, setPortfolioFile] = useState(null);
  const [mentorResumeFile, setMentorResumeFile] = useState(null);
  const [dbEmail, setDbEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [tempCareer, setTempCareer] = useState('');
  const [tempHashtag, setTempHashtag] = useState('');
  const [tempLink, setTempLink] = useState('');

  const [formData, setFormData] = useState({
    name: '', bio: '', mbti: '', hashtags: '', experience: '', portfolio_url: '', help_provide: '', help_receive: '',
    phone_number: '', profile_image: '', // 💡 [추가] 초기 상태값에 전화번호 필드 결합
    mentor_job: '', mentor_careers: [], mentor_hashtags: [], mentor_story: '', mentor_keywords: '',
    mentor_experiences: [{ id: Date.now(), text: '' }], mentor_links: []
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    if (signUpData) {
      setDbEmail(signUpData.email || '');
      // 💡 [추가] 가입 데이터 유입 시 전화번호 매핑 추가
      setFormData(prev => ({ ...prev, name: signUpData.name || '', phone_number: signUpData.phone_number || '' }));
      setIsLoading(false);
      return; 
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
          setFormData({
            name: user.name || '', bio: user.bio || '', mbti: user.mbti || '', hashtags: user.hashtags || '',
            experience: user.experience || '', portfolio_url: user.portfolio_url || '',
            help_provide: user.help_provide || '', help_receive: user.help_receive || '', 
            phone_number: user.phone_number || '', // 💡 [추가] DB 데이터 로드 시 전화번호 매핑
            mentor_job: user.mentor_job || '', mentor_careers: user.mentor_careers || [],
            mentor_hashtags: user.mentor_hashtags || [], mentor_story: user.mentor_story || '',
            mentor_keywords: user.mentor_keywords || '',
            mentor_experiences: user.mentor_experiences?.length ? user.mentor_experiences : [{ id: Date.now(), text: '' }],
            profile_image: user.profile_image || '',
            mentor_links: user.mentor_links || []
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
    // 💡 [추가] 빈칸 검증 구문에 !formData.phone_number.trim() 분기 결합
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
        phone_number: formData.phone_number, // 💡 [추가] 백엔드 전송 페이로드에 전화번호 포함

        // 멘토 관련 데이터 이름 변경 
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
          alert('🎉 회원가입이 완료되었습니다! 가입하신 정보로 다시 로그인해 주세요.');
          navigate('/login');
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
          <button type="button" onClick={() => setActiveTab('general')} className={`flex-1 py-2.5 text-center font-bold text-sm border-0 rounded-lg cursor-pointer transition ${activeTab === 'general' ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-gray-500'}`}>일반 프로필 설정</button>
          <button type="button" onClick={() => setActiveTab('mentor')} className={`flex-1 py-2.5 text-center font-bold text-sm border-0 rounded-lg cursor-pointer transition ${activeTab === 'mentor' ? 'bg-purple-600 text-white shadow-sm' : 'bg-transparent text-gray-500'}`}>멘토 프로필 설정</button>
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