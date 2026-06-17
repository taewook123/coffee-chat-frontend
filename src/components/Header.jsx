import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, X } from 'lucide-react'; 
import axios from 'axios';

const Header = ({ isLoggedIn, setIsLoggedIn, userName }) => {
  const navigate = useNavigate();
  const location = useLocation(); 
  const notifRef = useRef(null); // 바깥 클릭 감지용 Ref
  
  const [currentName, setCurrentName] = useState('회원');
  const [isMentor, setIsMentor] = useState(false); 
  const [isAdmin, setIsAdmin] = useState(false); // 🔥 1. 관리자 권한 상태 추가
  const [notifications, setNotifications] = useState([]); 
  const [isOpen, setIsOpen] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://48.211.169.52:8000';

  // [실시간 계산] 상태를 따로 두지 않고 알림 배열에서 미읽음 여부를 실시간으로 유도합니다.
  const hasUnread = notifications.some(notif => !notif.is_read);

  // 상대 시간 포맷팅 헬퍼 함수
  const formatRelativeTime = (dateString) => {
    if (!dateString) return '방금 전';
    try {
      const now = new Date();
      const past = new Date(dateString);
      const diffMs = now - past;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return '방금 전';
      if (diffMins < 60) return `${diffMins}분 전`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}시간 전`;
      
      return past.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    } catch (e) {
      return '방금 전';
    }
  };

  // 사용자 정보 바인딩 및 동기화 (권한 체크 포함)
  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    
    if (userName) {
      setCurrentName(userName); 
    } else if (savedName) {
      setCurrentName(savedName);
    } else {
      setCurrentName('회원'); 
    }

    if (isLoggedIn) {
      const rawUserId = localStorage.getItem('userId') || localStorage.getItem('id') || localStorage.getItem('user_id');
      const cleanUserId = rawUserId ? parseInt(rawUserId.toString().replace(/[^0-9]/g, ''), 10) : null;

      if (cleanUserId) {
        axios.get(`${BACKEND_URL}/api/user/${cleanUserId}`)
          .then(res => {
            if (res.data) {
              if (res.data.name) {
                setCurrentName(res.data.name);
                localStorage.setItem('userName', res.data.name);
              }
              setIsMentor(res.data.is_mentor || false);
              
              // 🔥 2. Announcements 페이지와 동일하게 role이 ADMIN / admin 인지 확인
              setIsAdmin(res.data.role === 'ADMIN' || res.data.role === 'admin');
            }
          })
          .catch(error => {
            console.error("❌ 내 정보 불러오기 실패:", error);
            setCurrentName(userName || localStorage.getItem('userName') || '회원');
          });
      }
    } else {
      setCurrentName('회원');
      setIsMentor(false);
      setIsAdmin(false); // 🔥 로그아웃 상태면 관리자 권한도 false
    }
  }, [isLoggedIn, userName, location.pathname]); 

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
        }
      } catch (error) {
        console.error("❌ 알림을 가져오는데 실패했습니다:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); 
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // 알림 바깥 영역 클릭 시 모달 닫기 로직
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // 알림 읽음 처리 및 이동
  const handleNotificationClick = async (notif) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/notifications/${notif.id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) console.warn(`읽음 처리 서버 응답 에러: ${response.status}`);
      else setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    } catch (error) { console.error("알림 읽음 처리 통신 실패:", error); }

    const targetBookingId = notif.bookingId || notif.booking_id;
    const msg = notif.message || ""; 

    if (notif.type === 'BOOKING_REQUEST' || msg.includes('신청') || msg.includes('요청')) {
      navigate('/dashboard', { state: { activeTab: 'history', subTab: 'received', bookingId: targetBookingId } });
      setIsOpen(false); 
    } else if (notif.type === 'BOOKING_CONFIRMED' || msg.includes('확정')) {
      navigate('/dashboard', { state: { activeTab: 'history', subTab: 'requested', bookingId: targetBookingId } });
      setIsOpen(false); 
    } 
  };

  const handleDeleteNotification = async (e, id) => { 
    e.stopPropagation(); 
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/api/notifications/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    } catch (error) { console.error("❌ 알림 영구 삭제 에러:", error); }
  };

  const handleDeleteAll = async (e) => { 
    e.stopPropagation(); setNotifications([]);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/api/notifications/all`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    } catch (error) { console.error("❌ 알림 전체 삭제 에러:", error); }
  };

  const handleLogout = () => { 
    // 1. 스토리지 비우기
    localStorage.clear(); 
    
    // 2. 존재하는 State들만 초기화 (setHasUnread는 삭제!)
    setIsLoggedIn(false); 
    setIsMentor(false);
    setNotifications([]); 
    setIsOpen(false);
    
    // 3. 알림 띄우고 강제 새로고침하며 메인으로 이동
    alert("로그아웃 되었습니다."); 
    window.location.href = '/'; 
  };

  return (
    <nav className="sticky top-0 z-50 bg-white text-gray-800 shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        <div className="flex items-center gap-10">
          <div className="flex items-center cursor-pointer select-none" onClick={() => navigate('/')}>
            {/* 💡 엑스박스 뜨는 이미지 대신, 로고와 똑같이 생긴 텍스트를 적용했습니다! */}
            <span className="text-3xl font-black text-[#1A73E8] tracking-tighter lowercase">
              teatimes
            </span>
          </div>

          <ul className="flex items-center gap-6 list-none m-0 p-0 text-sm font-medium">
            <li 
              onClick={() => navigate('/mentors')} 
              className={`hover:text-[#1A73E8] transition cursor-pointer ${location.pathname === '/mentors' ? 'text-[#1A73E8] font-bold' : 'text-gray-600'}`}
            >
              호스트 찾기
            </li>
            <li 
              onClick={() => navigate('/coffee-chats')} 
              className={`hover:text-[#1A73E8] transition cursor-pointer ${location.pathname === '/coffee-chats' ? 'text-[#1A73E8] font-bold' : 'text-gray-600'}`}
            >
              티타임
            </li>
            <li 
              onClick={() => navigate('/announcements')} 
              className={`hover:text-[#1A73E8] transition cursor-pointer ${location.pathname === '/announcements' ? 'text-[#1A73E8] font-bold' : 'text-gray-600'}`}
            >
              공지사항
            </li>
            <li 
              onClick={() => navigate('/customer-center')} 
              className={`hover:text-blue-300 transition cursor-pointer ${location.pathname === '/customer-center' ? 'text-blue-400 font-bold' : 'text-gray-600'}`}
            >
              고객센터
            </li>
            
            {/* 🔥 3. 관리자(isAdmin)일 때만 헤더에 '고객센터 관리' 메뉴 노출 */}
            {isAdmin && (
              <li 
                onClick={() => navigate('/admin/support')} 
                className={`text-red-400 hover:text-red-300 font-bold transition cursor-pointer ${location.pathname === '/admin/support' ? 'underline' : ''}`}
              >
                고객센터 관리
              </li>
            )}
          </ul>
        </div>

        <div className="auth-buttons flex items-center gap-4">
          {(!isLoggedIn || !isMentor) && (
            <button 
              className="bg-transparent border border-gray-300 hover:border-[#1A73E8] hover:text-[#1A73E8] text-gray-700 px-4 py-2 rounded-full text-xs font-bold transition cursor-pointer mr-2" 
              onClick={() => navigate('/mentor-registration')}
            >
              호스트 등록하기
            </button>
          )}
          
          {isLoggedIn ? (
            <div className="flex items-center gap-4 relative">
              <div className="relative cursor-pointer mr-1" onClick={() => setIsOpen(!isOpen)}>
                <Bell className="w-6 h-6 text-gray-600 hover:text-[#1A73E8] transition" />
                {hasUnread && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                )}
              </div>

              {isOpen && (
                <div className="absolute right-24 top-10 w-80 bg-white text-gray-800 rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-50 flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-500">실시간 알림</span>
                    {notifications.length > 0 && (
                      <button onClick={handleDeleteAll} className="text-[10px] text-gray-400 hover:text-red-500 font-semibold bg-transparent border-0 cursor-pointer hover:underline">
                        전체 삭제
                      </button>
                    )}
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400">새로운 알림이 없습니다.</div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} onClick={() => handleNotificationClick(notif)} className={`group relative px-4 py-3 text-xs border-b border-gray-50 transition cursor-pointer hover:bg-blue-50/50 ${!notif.is_read ? 'bg-blue-50/30 font-semibold' : 'opacity-70'}`}>
                          <p className="m-0 text-gray-700 pr-6">{notif.message}</p>
                          <span className="text-[10px] text-gray-400 block mt-1">방금 전</span>
                          <button onClick={(e) => handleDeleteNotification(e, notif.id)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all bg-transparent border-0 cursor-pointer" title="삭제">
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
                className="cursor-pointer text-sm font-bold text-gray-800 hover:text-[#1A73E8] transition"
                title="마이 대시보드로 이동"
              >
                {currentName}님
              </span>
              <button 
                type="button"
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-full text-xs font-bold transition border-0 cursor-pointer"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => navigate('/login')}
              className="bg-[#1A73E8] hover:bg-blue-700 px-6 py-2 rounded-full text-xs font-bold text-white transition border-0 cursor-pointer"
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