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
    if (isLoggedIn) {
      const rawUserId = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('user_id');
      const cleanUserId = rawUserId ? parseInt(rawUserId.toString().replace(/[^0-9]/g, ''), 10) : null;

      if (cleanUserId) {
        // 💡 [핵심 수정] 회원님이 만드신 완벽한 단수형 API(/api/user/{id})를 호출합니다!
        axios.get(`${BACKEND_URL}/api/user/${cleanUserId}`)
          .then(res => {
            if (res.data && res.data.name) {
              setCurrentName(res.data.name);
              localStorage.setItem('userName', res.data.name);
              // 백엔드 API에서 is_mentor 값도 내려주고 있으므로 바로 활용 가능합니다!
              setIsMentor(res.data.is_mentor || false);
            }
          })
          .catch(error => {
            console.error("❌ 내 정보 불러오기 실패:", error);
            // 에러 시 로컬 스토리지에 있는 이름으로 대체
            setCurrentName(userName || localStorage.getItem('userName') || '회원');
          });
      }
    } else {
      setCurrentName('회원');
      setIsMentor(false);
    }
  }, [isLoggedIn, userName, location.pathname]); 

  // 알림 가져오기
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
      console.error("❌ 알림 영구 삭제 중 에러 발생:", error);
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
      console.error("❌ 알림 전체 영구 삭제 중 에러 발생:", error);
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
        
        {/* 왼쪽 영역: 로고 + 메뉴 묶음 */}
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => navigate('/')}>
            <Coffee className="w-8 h-8 text-white" />
            <span className="text-xl font-bold tracking-tight">TeaTimes</span>
          </div>

          <ul className="flex items-center gap-6 list-none m-0 p-0 text-sm font-medium">
            <li 
              onClick={() => navigate('/mentors')} 
              className={`hover:text-blue-300 transition cursor-pointer ${location.pathname === '/mentors' ? 'text-blue-400 font-bold' : 'text-white/80'}`}
            >
              호스트 찾기
            </li>
            <li 
              onClick={() => navigate('/coffee-chats')} 
              className={`hover:text-blue-300 transition cursor-pointer ${location.pathname === '/coffee-chats' ? 'text-blue-400 font-bold' : 'text-white/80'}`}
            >
              커피챗
            </li>
            {/* 💡 이 부분을 추가하세요 */}
            <li 
              onClick={() => navigate('/announcements')} 
              className={`hover:text-blue-300 transition cursor-pointer ${location.pathname === '/announcements' ? 'text-blue-400 font-bold' : 'text-white/80'}`}
            >
              공지사항
            </li>
          </ul>
        </div>

        {/* 오른쪽 영역: 인증 및 알림 버튼 */}
        <div className="auth-buttons flex items-center gap-4">
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
                <div className="absolute right-24 top-10 w-80 bg-white text-gray-800 rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-500">실시간 알림</span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={handleDeleteAll}
                        className="text-[10px] text-gray-400 hover:text-red-500 font-semibold bg-transparent border-0 cursor-pointer hover:underline"
                      >
                        전체 삭제
                      </button>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400">새로운 알림이 없습니다.</div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          onClick={() => handleNotificationClick(notif.id)}
                          className={`group relative px-4 py-3 text-xs border-b border-gray-50 transition cursor-pointer hover:bg-gray-50 ${!notif.is_read ? 'bg-blue-50/60 font-semibold' : 'opacity-60'}`}
                        >
                          <p className="m-0 text-gray-700 pr-6">{notif.message}</p>
                          <span className="text-[10px] text-gray-400 block mt-1">방금 전</span>

                          <button
                            onClick={(e) => handleDeleteNotification(e, notif.id)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all bg-transparent border-0 cursor-pointer"
                            title="삭제"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
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