import React from 'react';

const Footer = () => {
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.info}>
          <h3 style={styles.logo}>커피챗(CoffeeChat)</h3>
          <p>현직자와의 가벼운 대화로 시작하는 커리어의 시작</p>
        </div>
        <div style={styles.links}>
          <p>© 2026 CoffeeChat. All rights reserved.</p>
          <p></p>
        </div>
      </div>
    </footer>
  );
};

const styles = {
  footer: {
    backgroundColor: '#333',
    color: '#fff',
    padding: '40px 0',
    marginTop: 'auto', // 페이지 하단에 붙이기 위해 추가
    width: '100%',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 20px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  logo: {
    margin: '0 0 10px 0',
    fontSize: '1rem',
  },
  info: {
    textAlign: 'left',
  },
  links: {
    textAlign: 'right',
    fontSize: '0.9rem',
    color: '#ccc',
  },
};

export default Footer;