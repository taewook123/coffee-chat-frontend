import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import MentorList from './components/MentorList';
import Login from './Login';
import './App.css';
import Footer from './components/Footer';
import Mentors from './pages/Mentors';
import ProfileEdit from './pages/ProfileEdit';
import './styles/index.css';
import MentorApply from './pages/MentorApply';
import BookingFlow from './pages/BookingFlow';
import MentorDashboard from './pages/MentorDashboard';
import CoffeeChats from './pages/CoffeeChats';
import SignUpPage from './pages/SignUpPages';
import ProfileSetup from './pages/ProfileSetup';
import KakaoCallback from './components/KakaoCallback';
import MentorRegistration from './pages/MentorRegistration';
import MainContent from './components/MainContent';
import BookingHistory from './pages/BookingHistory';
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [userName, setUserName] = useState(localStorage.getItem('userName') || "회원");
  
  const [redirectToProfile, setRedirectToProfile] = useState(false);
  const [redirectToHome, setRedirectToHome] = useState(false);
  const [profileQueryParams, setProfileQueryParams] = useState("");

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

  return (
    <Router>
      <Header 
        isLoggedIn={isLoggedIn} 
        setIsLoggedIn={setIsLoggedIn} 
        userName={userName} 
      />
      
      {redirectToProfile && (
        <Navigate 
          to={`/profile-setup${profileQueryParams}`} 
          replace 
          state={(() => { setRedirectToProfile(false); return {}; })()} 
        />
      )}
      {redirectToHome && (
        <Navigate 
          to="/" 
          replace 
          state={(() => { setRedirectToHome(false); return {}; })()} 
        />
      )}

      <Routes>
        <Route path="/" element={<MainContent />} />
        <Route path="/login" element={<Login />} />
        <Route path="/mentors" element={<Mentors />} />
        <Route path="/mentors/apply/:id" element={<MentorApply />} />
        <Route path="/profile/edit" element={<ProfileEdit />} />
        <Route path="/booking/:mentorId" element={<BookingFlow />} />
        <Route path="/dashboard" element={<MentorDashboard />} />
        <Route path="/coffee-chats" element={<CoffeeChats />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/login/kakao/callback" element={<KakaoCallback />} />
        <Route path="/mentor-registration" element={<MentorRegistration />} />
        <Route path="/booking-history" element={<BookingHistory />} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;