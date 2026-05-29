import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(localStorage.getItem('userName') || '');

  const handleUpdate = (e) => {
    e.preventDefault();
    // 실제로는 여기서 백엔드 API(PATCH /users/me 등)를 호출해야 합니다.
    localStorage.setItem('userName', nickname);
    alert('회원 정보가 성공적으로 수정되었습니다.');
    navigate('/');
  };

  return (
    <div className="profile-edit-container" style={{ padding: '100px 20px', textAlign: 'center' }}>
      <h2>회원 정보 수정</h2>
      <form onSubmit={handleUpdate} style={{ maxWidth: '400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px' }}>닉네임</label>
          <input 
            type="text" 
            value={nickname} 
            onChange={(e) => setNickname(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
        </div>
        <button type="submit" className="login-button" style={{ width: '100%' }}>
          수정 완료
        </button>
      </form>
    </div>
  );
};

export default ProfileEdit;