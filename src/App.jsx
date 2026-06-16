import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// 공통 레이아웃 컴포넌트
import Header from './components/Header';
import Footer from './components/Footer';
import MainContent from './components/MainContent';
import ChatBot from './components/ChatBot';

// 인증 및 계정 관련 페이지
import Login from './Login';
import SignUpPage from './pages/SignUpPages';
import ProfileSetup from './pages/ProfileSetup';
import ProfileEdit from './pages/ProfileEdit';
import ProfileImageUpload from './components/ProfileImageUpload';
import KakaoCallback from './components/KakaoCallback';

// 호스트(멘토) 및 예약 관련 페이지
import Mentors from './pages/Mentors';
import MentorApply from './pages/MentorApply';
import MentorRegistration from './pages/MentorRegistration';
import MentorDashboard from './pages/MentorDashboard';
import BookingFlow from './pages/BookingFlow';
import BookingHistory from './pages/BookingHistory';

// 커피챗 대화방 및 리뷰/신고 관련 페이지
import CoffeeChats from './pages/CoffeeChats';
import CoffeeChatDetail from './pages/CoffeeChatDetail';
import CoffeeChatRoom from './pages/CoffeeChatRoom';
import CoffeeChatReview from './pages/CoffeeChatReview';
import CoffeeChatReport from './pages/CoffeeChatReport';

// 공지사항 및 고객센터 페이지
import Announcements from './pages/Announcements';
import WriteAnnouncement from './pages/WriteAnnouncement';
import CustomerCenter from './pages/CustomerCenter'; 

// 글로벌 스타일
import './App.css';
import './styles/index.css';

function ChatBotWrapper() {
  const location = useLocation();
  const isCoffeeChatRoom = location.pathname.startsWith('/coffee-chat/');
  if (isCoffeeChatRoom) return null;
  return <ChatBot />;
}

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userName, setUserName] = useState(localStorage.getItem('userName') || "회원");
  
  const [redirectToProfile, setRedirectToProfile] = useState(false);
  const [redirectToHome, setRedirectToHome] = useState(false);
  const [profileQueryParams, setProfileQueryParams] = useState("");

  // 소셜 로그인 세션 및 토큰 파싱
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const nameParam = params.get('name'); 
    const idParam = params.get('id');

    if (token) {
      localStorage.setItem('token', token);
      
      let decodedName = "로그인 유저";
      if (nameParam) {
        decodedName = decodeURIComponent(nameParam);
        localStorage.setItem('userName', decodedName);
      }
      if (idParam) localStorage.setItem('userId', idParam);

      setIsLoggedIn(true);
      setUserName(decodedName);

      if (idParam) {
        const emailParam = params.get('email');
        setProfileQueryParams(`?token=${token}&name=${nameParam}&email=${emailParam}&id=${idParam}`);
        setRedirectToProfile(true);
      } else {
        setRedirectToHome(true);
      }
      
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // 리다이렉트 컴포넌트 마운트 직후 안전하게 상태를 클리어해주는 훅 (안티패턴 해결)
  useEffect(() => {
    if (redirectToProfile) setRedirectToProfile(false);
    if (redirectToHome) setRedirectToHome(false);
  }, [redirectToProfile, redirectToHome]);

  return (
    <Router>
      <Header 
        isLoggedIn={isLoggedIn} 
        setIsLoggedIn={setIsLoggedIn} 
        userName={userName} 
      />
      
      {/* 안전한 조건부 리다이렉션 제어 */}
      {redirectToProfile && <Navigate to={`/profile-setup${profileQueryParams}`} replace />}
      {redirectToHome && <Navigate to="/" replace />}

      <Routes>
        {/* 메인 및 인증 */}
        <Route path="/" element={<MainContent />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login/kakao/callback" element={<KakaoCallback />} />
        
        {/* 프로필 및 계정 설정 */}
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/profile-image-upload" element={<ProfileImageUpload />} />
        
        {/* 호스트(멘토) 찾기 및 신청/등록 */}
        <Route path="/mentors" element={<Mentors />} />
        <Route path="/mentors/apply/:id" element={<MentorApply />} />
        <Route path="/mentor-registration" element={<MentorRegistration />} />
        <Route path="/dashboard" element={<MentorDashboard />} />
        
        {/* 예약 및 구매 이력 */}
        <Route path="/booking/:mentorId" element={<BookingFlow />} />
        <Route path="/booking-history" element={<BookingHistory />} />
        
        {/* 커피챗 대화 및 사후 관리 */}
        <Route path="/coffee-chats" element={<CoffeeChats />} />
        <Route path="/coffee-chat-detail/:id" element={<CoffeeChatDetail />} />
        <Route path="/coffee-chat/:chatId" element={<CoffeeChatRoom />} />
        <Route path="/coffee-chat-review/:chatId" element={<CoffeeChatReview />} />
        <Route path="/coffee-chat-report/:chatId" element={<CoffeeChatReport />} />
        
        {/* 게시판 및 고객 소통 단지 */}
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/announcements/write" element={<WriteAnnouncement />} />
        <Route path="/customer-center" element={<CustomerCenter />} />
      </Routes>
      
      <ChatBotWrapper />
      <Footer />
    </Router>
  );
};

export default App;