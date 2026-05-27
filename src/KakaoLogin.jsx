import React from 'react';

const KakaoLogin = () => {
  // .env 파일에 정의한 환경 변수 호출
  const REST_API_KEY = process.env.REACT_APP_KAKAO_REST_API_KEY;
  const REDIRECT_URI = process.env.REACT_APP_KAKAO_REDIRECT_URI;
  
  // 카카오 인증 서버 주소 구성
  const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

  const handleLogin = () => {
    // 카카오 로그인 페이지로 리다이렉트
    window.location.href = KAKAO_AUTH_URL;
  };

  return (
    <div className="login-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px' }}>
      <h2>CoffeeChat 시작하기</h2>
      <button 
        onClick={handleLogin}
        style={{
          backgroundColor: '#FEE500',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '16px'
        }}
      >
        카카오 로그인
      </button>
    </div>
  );
};

export default KakaoLogin;