import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // 🌟 1. useLocation 추가
import { Coffee, Bell } from 'lucide-react';
import axios from 'axios';

const Header = ({ isLoggedIn, setIsLoggedIn, userName }) => {
  const navigate = useNavigate();
  const location = useLocation(); // 🌟 2. 현재 주소 감지용 변수 추가
  
  const [currentName, setCurrentName] = useState('회원');
  const [isMentor, setIsMentor] = useState(false); 

  const [notifications, setNotifications] = useState([]); 
  const [hasUnread, setHasUnread] = useState(false);       
  const [isOpen, setIsOpen] = useState(false);             
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';
  const [isOpen, setIsOpen] = useState(false);             

  const BACKEND_URL = 'http://localhost:8000';

  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    
    if (userName) {
      setCurrentName(userName); 
    } else if (savedName) {
      setCurrentName(savedName);
    } else {
      setCurrentName('회원'); 
    }

    // ─── [보완 완료] 멘토 권한 식별 기준 정밀 동기화 ───
    if (isLoggedIn) {
      const rawUserId = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('user_id');
      const cleanUserId = rawUserId ? parseInt(rawUserId.toString().replace(/[^0-9]/g, ''), 10) : null;

      if (cleanUserId) {
        axios.get(`${BACKEND_URL}/api/mentors/list`)
          .then(response => {
            const checkMentor = response.data.some(
              mentor => parseInt(mentor.id, 10) === cleanUserId || parseInt(mentor.user_id, 10) === cleanUserId
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
  }, [userName, isLoggedIn, location.pathname]); // 🌟 3. 주소(location.pathname)가 바뀔 때마다 재검사!

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${BACKEND_URL}/api/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json(); 
          setNotifications(data);
          const unreadExists = data.some(n => !n.is_read);
          setHasUnread(unreadExists);
        }
      } catch (error) {
        console.error("❌ 알림을 가져오는데 실패했습니다:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); 
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleNotificationClick = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const updated = notifications.map(n => n.id === id ? { ...n, is_read: true } : n);
        setNotifications(updated);
        setHasUnread(updated.some(n => !n.is_read));
      }
    } catch (error) {
      console.error("❌ 알림 읽음 처리 실패:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear(); 
    setIsLoggedIn(false);
    setIsMentor(false);
    setNotifications([]); 
    setHasUnread(false);
    setIsOpen(false);
    alert("로그아웃 되었습니다.");
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#1a2332] text-white shadow-lg border-0">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => navigate('/')}>
          <Coffee className="w-8 h-8 text-white" />
          <span className="text-xl font-bold tracking-tight">TeaTimes</span>
        </div>

        <ul className="flex items-center gap-8 list-none m-0 p-0 text-sm font-medium">
          <li onClick={() => navigate('/mentors')} className="hover:text-blue-300 transition cursor-pointer">호스트 찾기</li>
          <li className="hover:text-blue-300 transition cursor-pointer opacity-70 hover:opacity-100">주제 탐색</li>
          <li className="hover:text-blue-300 transition cursor-pointer opacity-70 hover:opacity-100">커뮤니티</li>
          <li className="hover:text-blue-300 transition cursor-pointer opacity-70 hover:opacity-100">작동 방식</li>
          <li onClick={() => navigate('/coffee-chats')} className="hover:text-blue-300 transition cursor-pointer opacity-70 hover:opacity-100">커피챗</li>
        </ul>

        <div className="auth-buttons flex items-center gap-4">
          {/* 🌟 4. 로그인 안 했거나, 멘토가 아닐 때만 버튼 표시 */}
          {(!isLoggedIn || !isMentor) && (
            <button 
              className="btn-register bg-transparent border border-white/30 hover:border-white px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer mr-2" 
              onClick={() => navigate('/mentor-registration')}
            >
              호스트 등록하기
            </button>
          )}
          
          {isLoggedIn ? (
            <div className="flex items-center gap-4 relative">
              
              <div className="relative cursor-pointer mr-1" onClick={() => setIsOpen(!isOpen)}>
                <Bell className="w-6 h-6 text-white hover:text-blue-300 transition" />
                {hasUnread && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-[#1a2332] rounded-full"></span>
                )}
              </div>

              {isOpen && (
                <div className="absolute right-24 top-10 w-72 bg-white text-gray-800 rounded-lg shadow-2xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 font-bold text-xs text-gray-500">실시간 알림</div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-400">새로운 알림이 없습니다.</div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif.id)}
                          className={`px-4 py-3 text-xs border-b border-gray-50 transition cursor-pointer hover:bg-gray-50 ${!notif.is_read ? 'bg-blue-50/60 font-semibold' : 'opacity-60'}`}
                        >
                          <p className="m-0 text-gray-700">{notif.message}</p>
                          <span className="text-[10px] text-gray-400 block mt-1">방금 전</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

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