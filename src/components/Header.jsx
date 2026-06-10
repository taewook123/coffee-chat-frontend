import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Coffee, Bell, X } from 'lucide-react'; 
import axios from 'axios';

const Header = ({ isLoggedIn, setIsLoggedIn, userName }) => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  const [currentName, setCurrentName] = useState('회원');
  const [isMentor, setIsMentor] = useState(false); 
  const [notifications, setNotifications] = useState([]); 
  const [hasUnread, setHasUnread] = useState(false);        
  const [isOpen, setIsOpen] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  useEffect(() => {
    // 💡 로그인 여부 확인 및 유저 정보 동기화
    if (isLoggedIn) {
      const loggedInUserId = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('user_id');
      
      if (loggedInUserId) {
        // 1. 실제 유저 이름을 서버에서 조회 (멘토 이름 X)
        axios.get(`${BACKEND_URL}/api/users/${loggedInUserId}`)
          .then(res => {
            setCurrentName(res.data.name);
          })
          .catch(() => {
            setCurrentName(userName || '회원');
          });

        // 2. 멘토 권한 확인 (본인 유저 ID와 매칭되는 멘토가 있는지)
        axios.get(`${BACKEND_URL}/api/mentors/list`)
          .then(response => {
            const checkMentor = response.data.some(
              mentor => parseInt(mentor.user_id, 10) === parseInt(loggedInUserId, 10)
            );
            setIsMentor(checkMentor);
          })
          .catch(error => {
            console.error("❌ 멘토 권한 확인 실패:", error);
          });
      }
    } else {
      setCurrentName('회원');
      setIsMentor(false);
    }
  }, [userName, isLoggedIn, location.pathname]); 

  // 알림 가져오기 로직은 기존과 동일
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
          setHasUnread(data.some(n => !n.is_read));
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

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation(); 
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error("❌ 알림 삭제 중 에러:", error);
    }
  };

  const handleDeleteAll = async (e) => {
    e.stopPropagation();
    setNotifications([]);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/api/notifications/all`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error("❌ 알림 전체 삭제 중 에러:", error);
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
        
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => navigate('/')}>
            <Coffee className="w-8 h-8 text-white" />
            <span className="text-xl font-bold tracking-tight">TeaTimes</span>
          </div>

          <ul className="flex items-center gap-6 list-none m-0 p-0 text-sm font-medium">
            <li onClick={() => navigate('/mentors')} className={`hover:text-blue-300 transition cursor-pointer ${location.pathname === '/mentors' ? 'text-blue-400 font-bold' : 'text-white/80'}`}>호스트 찾기</li>
            <li onClick={() => navigate('/coffee-chats')} className={`hover:text-blue-300 transition cursor-pointer ${location.pathname === '/coffee-chats' ? 'text-blue-400 font-bold' : 'text-white/80'}`}>커피챗</li>
          </ul>
        </div>

        <div className="flex items-center gap-4">
          {(!isLoggedIn || !isMentor) && (
            <button 
              className="bg-transparent border border-white/30 hover:border-white px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer mr-2" 
              onClick={() => navigate('/mentor-registration')}
            >
              호스트 등록하기
            </button>
          )}
          
          {isLoggedIn ? (
            <div className="flex items-center gap-4 relative">
              <div className="relative cursor-pointer mr-1" onClick={() => setIsOpen(!isOpen)}>
                <Bell className="w-6 h-6 text-white hover:text-blue-300 transition" />
                {hasUnread && <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-[#1a2332] rounded-full"></span>}
              </div>

              {isOpen && (
                <div className="absolute right-24 top-10 w-80 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-500">실시간 알림</span>
                    {notifications.length > 0 && (
                      <button onClick={handleDeleteAll} className="text-[10px] text-gray-400 hover:text-red-500 font-semibold bg-transparent border-0 cursor-pointer">전체 삭제</button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? <div className="px-4 py-8 text-center text-sm text-gray-400">새로운 알림이 없습니다.</div> :
                      notifications.map((notif) => (
                        <div key={notif.id} onClick={() => handleNotificationClick(notif.id)} className={`group relative px-4 py-3 text-xs border-b border-gray-50 transition cursor-pointer hover:bg-gray-50 ${!notif.is_read ? 'bg-blue-50/60 font-semibold' : 'opacity-60'}`}>
                          <p className="m-0 text-gray-700 pr-6">{notif.message}</p>
                          <button onClick={(e) => handleDeleteNotification(e, notif.id)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 bg-transparent border-0 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              <span onClick={() => navigate('/dashboard')} className="cursor-pointer text-sm font-bold text-amber-300 hover:text-amber-200 transition">
                {currentName}님
              </span>
              <button type="button" onClick={handleLogout} className="bg-red-500/80 hover:bg-red-600 px-5 py-2 rounded-full text-xs font-bold text-white transition border-0 cursor-pointer">로그아웃</button>
            </div>
          ) : (
            <button type="button" onClick={() => navigate('/login')} className="bg-[#4a90e2] hover:bg-[#3a7bc8] px-6 py-2 rounded-full text-xs font-bold text-white transition border-0 cursor-pointer">로그인</button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Header;