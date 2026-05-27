import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee } from 'lucide-react';
import axios from 'axios'; // 💡 DB 조회를 위해 axios를 가져옵니다.

const Header = ({ isLoggedIn, setIsLoggedIn, userName }) => {
  const navigate = useNavigate();
  
  const [currentName, setCurrentName] = useState('회원');
  const [isMentor, setIsMentor] = useState(false); // 💡 현재 유저의 멘토 등록 여부 상태 추가

  const BACKEND_URL = 'http://48.211.169.52:8000';

  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    
    if (userName) {
      setCurrentName(userName); 
    } else if (savedName) {
      setCurrentName(savedName);
    } else {
      setCurrentName('회원'); 
    }

    // 💡 로그인 상태일 때 백엔드 DB의 멘토 리스트를 가져와 현재 유저가 있는지 확인합니다.
    if (isLoggedIn) {
      const userId = localStorage.getItem('userId');
      if (userId) {
        axios.get(`${BACKEND_URL}/api/mentors/list`)
          .then(response => {
            // DB의 mentor 고유 id 또는 연동된 user_id 중 하나라도 현재 로그인한 userId와 일치하는지 검사
            const checkMentor = response.data.some(
              mentor => String(mentor.id) === String(userId) || String(mentor.user_id) === String(userId)
            );
            setIsMentor(checkMentor);
          })
          .catch(error => {
            console.error("❌ 멘토 권한 확인 실패:", error);
          });
      }
    } else {
      setIsMentor(false);
    }
  }, [userName, isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId'); // 로그아웃 시 유저 ID도 함께 정리합니다.
    setIsLoggedIn(false);
    setIsMentor(false);
    alert("로그아웃 되었습니다.");
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#1a2332] text-white shadow-lg border-0">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* 로고 영역 */}
        <div 
          className="flex items-center gap-2 cursor-pointer select-none" 
          onClick={() => navigate('/')}
        >
          <Coffee className="w-8 h-8 text-white" />
          <span className="text-xl font-bold tracking-tight">Coffee Chat</span>
        </div>

        {/* 내비게이션 링크 영역 */}
        <ul className="flex items-center gap-8 list-none m-0 p-0 text-sm font-medium">
          <li 
            onClick={() => navigate('/mentors')} 
            className="hover:text-blue-300 transition cursor-pointer"
          >
            호스트 찾기
          </li>
          <li className="hover:text-blue-300 transition cursor-pointer opacity-70 hover:opacity-100">주제 탐색</li>
          <li className="hover:text-blue-300 transition cursor-pointer opacity-70 hover:opacity-100">커뮤니티</li>
          <li className="hover:text-blue-300 transition cursor-pointer opacity-70 hover:opacity-100">작동 방식</li>
          <li 
            onClick={() => navigate('/coffee-chats')} 
            className="hover:text-blue-300 transition cursor-pointer opacity-70 hover:opacity-100"
          >
            커피챗
          </li>
        </ul>

        <div className="auth-buttons flex items-center gap-4">
          {/* 💡 비로그인 상태이거나, 로그인했더라도 DB에 멘토로 등록되지 않은 일반 회원에게만 버튼을 보여줍니다. */}
          {(!isLoggedIn || !isMentor) && (
            <button 
              className="btn-register" 
              onClick={() => navigate('/mentor-registration')}
            >
              멘토 등록하기
            </button>
          )}
          
          {/* 로그인 여부에 따른 조건부 동적 렌더링 세션 */}
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <span 
                onClick={() => navigate('/dashboard')} 
                className="cursor-pointer text-sm font-bold text-amber-300 hover:text-amber-200 transition"
                title="마이 대시보드로 이동"
              >
                {currentName}님
              </span>
              <button 
                type="button"
                onClick={handleLogout}
                className="bg-red-500/80 hover:bg-red-600 px-5 py-2 rounded-full text-xs font-bold text-white transition border-0 cursor-pointer"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => navigate('/login')}
              className="bg-[#4a90e2] hover:bg-[#3a7bc8] px-6 py-2 rounded-full text-xs font-bold text-white transition border-0 cursor-pointer"
            >
              로그인
            </button>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Header;