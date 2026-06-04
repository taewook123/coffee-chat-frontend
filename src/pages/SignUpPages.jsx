import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';

export default function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' ,// 'mentor' 또는 'mentee'
    phone_number: '' 
  });

  // 카카오 회원가입/로그인 인가 코드 요청 설정
  const REST_API_KEY = "e2eb2fe1d550c2b3da05dcad347a4517";
  const REDIRECT_URI = "http://48.211.169.52:8000/login/kakao/callback";

  // 💡 1. 카카오 회원가입 처리 로직 (역할 검증 및 state 파라미터 주입)
  const handleKakaoSignUp = () => {
    if (!formData.role) {
      alert('멘토 또는 멘티 역할을 먼저 선택해주세요!');
      return;
    }

    // 카카오 인증 후 백엔드가 역할을 식별할 수 있도록 &state 변수에 고정 주입합니다.
    const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code&prompt=login&state=${formData.role}`;
    window.location.href = KAKAO_AUTH_URL;
  };

  // 💡 2. 일반 이메일 회원가입 폼 제출 로직
  const handleSubmit = (e) => {
    e.preventDefault();

    // 역할(멘토/멘티)을 선택했는지 검증
    if (!formData.role) {
      alert('멘토 또는 멘티 역할을 선택해주세요!');
      return;
    }

    // 비밀번호 일치 여부를 검증
    if (formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다!');
      return;
    }

    // 💡 백엔드 스키마 유효성 검사(422 에러)를 패스하기 위해 profile_image 기본값 가드를 추가합니다.
    const submitData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role,
      phone_number: formData.phone_number,
      profile_image: "" // 빈 문자열로 스키마 충돌 방어
    };

    // 다음 페이지로 데이터 이전
    navigate('/profile-setup', { state: { signUpData: submitData } });
  };

  return (
    <div className="w-full min-h-screen grid grid-cols-2 bg-white overflow-x-hidden">
      
      {/* 왼쪽 영역 - 이미지 고정 */}
      <div className="relative w-full h-full min-h-screen bg-gray-100">
        <img
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80"
          alt="TeeTimes lifestyle"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
      </div>

      {/* 오른쪽 영역 - 회원가입 폼 */}
      <div className="flex items-center justify-center p-8 bg-white w-full">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#1a2332] mb-2 m-0">
              TeeTimes 시작하기
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              멘토 또는 멘티로 가입하세요
            </p>
          </div>

          {/* 역할 선택 탭 */}
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'mentee' })}
              className={`flex-1 py-2.5 px-4 rounded-full font-semibold text-sm transition ${
                formData.role === 'mentee'
                  ? 'bg-[#4a90e2] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              멘티로 가입
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, role: 'mentor' })}
              className={`flex-1 py-2.5 px-4 rounded-full font-semibold text-sm transition ${
                formData.role === 'mentor'
                  ? 'bg-[#4a90e2] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              멘토로 가입
            </button>
          </div>

          {/* 💡 소셜 버튼 그룹 (form 태그 외부 배치로 이메일 검증 로직 간섭 원천 차단) */}
          <div className="space-y-2.5 mb-6">
            <button type="button" className="w-full py-2.5 px-4 border border-gray-300 rounded-full hover:bg-gray-50 transition flex items-center justify-center gap-3 bg-white text-gray-700 font-medium text-xs shadow-sm">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 계속하기
            </button>
            <button 
              type="button" 
              onClick={handleKakaoSignUp}
              className="w-full py-2.5 px-4 bg-[#FEE500] hover:bg-[#FDD835] text-gray-900 rounded-full transition flex items-center justify-center gap-3 font-semibold text-xs shadow-sm border-0 cursor-pointer"
            >
              Kakao로 계속하기
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white text-gray-400">또는 이메일로 가입</span>
            </div>
          </div>

          {/* 이메일 회원가입 폼 */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="이름"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-full outline-none focus:border-[#4a90e2] transition bg-white text-xs"
                  required
                />
              </div>
            </div>
              <div>
              <div className="relative">
                {/* 스마트폰 아이콘을 대신할 단순 텍스트나 다른 아이콘을 써도 좋습니다 */}
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">📱</span>
                <input
                  type="tel"
                  placeholder="휴대폰 번호 (- 없이 입력)"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-full outline-none focus:border-[#4a90e2] transition bg-white text-xs"
                  required
                />
              </div>
            </div>
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="이메일 주소"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-full outline-none focus:border-[#4a90e2] transition bg-white text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  placeholder="비밀번호"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-full outline-none focus:border-[#4a90e2] transition bg-white text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="password"
                  placeholder="비밀번호 확인"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-full outline-none focus:border-[#4a90e2] transition bg-white text-xs"
                  required
                />
              </div>
            </div>

            <div className="flex items-start gap-3 pt-1">
              <input
                type="checkbox"
                id="terms"
                className="mt-0.5 w-4 h-4 text-[#4a90e2] border-gray-300 rounded focus:ring-[#4a90e2]"
                required
              />
              <label htmlFor="terms" className="text-[11px] text-gray-400 leading-relaxed cursor-pointer select-none">
                이용약관 및 개인정보 처리방침에 동의합니다
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#4a90e2] hover:bg-[#3a7bc8] text-white rounded-full transition font-semibold text-xs shadow-md mt-2"
            >
              다음 단계로
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-xs text-gray-500">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="text-[#4a90e2] hover:underline font-medium no-underline">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}