import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const KakaoCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // 💡 주소창의 ?token=...&name=... 값을 파싱합니다.
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const name = params.get('name');
        const email = params.get('email');
        const id = params.get('id');

        if (token) {
            // 1. 서비스 전용 인증 토큰을 브라우저에 안전하게 저장
            localStorage.setItem('token', token);
            if (name) localStorage.setItem('userName', decodeURIComponent(name));

            // 2. 주소창 뒤에 id가 붙어있다는 것은 '신규 가입자'라는 뜻입니다!
            if (id) {
                alert(`${decodeURIComponent(name)}님, 환영합니다! 프로필 설정 페이지로 이동합니다.`);
                // 💡 백엔드가 넘겨준 정보를 들고 프로필 입력 폼으로 강제 이동시킵니다.
                navigate(`/profile-setup?name=${name}&email=${email}&id=${id}`);
            } else {
                // 3. id가 없으면 기존 회원이므로 바로 메인 화면 진입
                alert('로그인 성공!');
                navigate('/');
            }
        } else {
            alert('인증 토큰을 받아오지 못했습니다.');
            navigate('/login');
        }
    }, [navigate, location]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <p className="text-gray-600 font-medium animate-pulse">카카오 로그인 처리 중입니다...</p>
            </div>
        </div>
    );
};

export default KakaoCallback;