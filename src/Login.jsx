import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    
    // 💡 [배포 고정] 모든 환경에서 클라우드 서버 API를 바라보도록 주소 고정
    const BACKEND_URL = 'http://48.211.169.52:8000';

    const [credentials, setCredentials] = useState({
        email: '',
        password: ''
    });

    const REST_API_KEY = "e2eb2fe1d550c2b3da05dcad347a4517";
    const REDIRECT_URI = "http://48.211.169.52:8000/login/kakao/callback";
    const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code&prompt=select_account`;
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleKakaoLogin = () => {
        window.location.href = KAKAO_AUTH_URL;
    };

    const handleGeneralLogin = async (e) => {
        e.preventDefault();
        try {
            console.log(`[로그인 시도] 서버: ${BACKEND_URL}, Email: ${credentials.email}`);

            const loginPayload = {
                email: credentials.email,
                password: credentials.password
            };

            const response = await axios.post(`${BACKEND_URL}/api/auth/login`, loginPayload);
            
            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
                if (response.data.user_id) {
                    localStorage.setItem('userId', response.data.user_id);
                }
                
                alert('로그인 성공!');
                window.location.href = '/'; // 헤더 상태 갱신을 위해 전체 새로고침 이동
            }
        } catch (error) {
            console.error('❌ 로그인 에러 상세:', error);
            const errorMsg = error.response?.data?.detail || '아이디나 비밀번호를 확인하세요.';
            alert(`로그인 실패: ${errorMsg}`);
        }
    };

    return (
        <div className="min-h-screen grid md:grid-cols-2">
            <div className="block relative h-full">
                <img
                    src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80"
                    alt="Coffee chat lifestyle"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/20" />
            </div>

            <div className="flex items-center justify-center p-12 bg-white">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-[#1a2332] mb-2 m-0">
                            Welcome Back
                        </h1>
                        <p className="text-gray-600 mt-2">
                            SNS 간편로그인
                        </p>
                    </div>

                    <div className="space-y-3 mb-6">
                        <button 
                            type="button"
                            onClick={handleKakaoLogin}
                            className="w-full py-3 px-4 bg-[#FEE500] rounded-full hover:bg-[#FDD835] transition flex items-center justify-center gap-3 shadow-sm border-0 cursor-pointer"
                        >
                            <span className="font-semibold text-[#3C1E1E] text-sm">Continue with Kakao</span>
                        </button>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-gray-500">Or continue with email</span>
                        </div>
                    </div>

                    <form className="space-y-4" onSubmit={handleGeneralLogin}>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                name="email"
                                placeholder="이메일 주소 (Email)"
                                value={credentials.email}
                                onChange={handleChange}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full outline-none focus:border-[#4a90e2] transition bg-white text-sm"
                                required
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={credentials.password}
                                onChange={handleChange}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full outline-none focus:border-[#4a90e2] transition bg-white text-sm"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-[#4a90e2] hover:bg-[#3a7bc8] text-white rounded-full transition font-semibold text-sm shadow-md mt-2 cursor-pointer border-0"
                        >
                            로그인
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link
                                to="/signup"
                                className="text-[#4a90e2] hover:underline font-medium no-underline"
                            >
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;