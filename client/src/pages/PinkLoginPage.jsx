import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PinkStars from '../components/PinkStars.jsx';

const ease = [0.22, 1, 0.36, 1];
const container = { hidden: {}, show: { transition: { staggerChildren: 0.18 } } };
const item = { hidden: { opacity: 0, y: 40 }, show: { opacity: 1, y: 0, transition: { duration: 1.2, ease } } };

export default function PinkLoginPage() {
  const navigate = useNavigate();
  const [userid, setUserid] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin() {
    if (!userid || !password) return alert('아이디와 비밀번호를 입력해주세요.');
    try {
      const res = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid, password }),
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/pink-letters');
      } else {
        alert(data.message);
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10, background: 'linear-gradient(to bottom,#f6b1b1 0%,#f7bfae 30%,#f8caa7 55%,#f6d3a0 75%,#f3d8a3 100%)', overflow: 'hidden' }}>
      <PinkStars />

      <motion.div
        initial="hidden" animate="show"
        exit={{ opacity: 0, transition: { duration: 0.3 } }}
        variants={container}
        style={{
          position: 'relative', zIndex: 1, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 48,
        }}
      >

      {/* 타이틀 */}
      <motion.h1 variants={item} style={{ position: 'relative', zIndex: 2, fontSize: 80, fontWeight: 300, textAlign: 'center', lineHeight: 1, margin: 0 }}>
        <span style={{ color: '#fff', filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.4))' }}>To.Me</span>
        <span style={{ color: 'rgba(255,255,255,0.6)', margin: '0 15px' }}> ; </span>
        <span style={{ color: '#8d6e63', filter: 'drop-shadow(0 0 8px rgba(141,110,99,0.3))' }}>From.Me</span>
      </motion.h1>

      {/* 폼 */}
      <motion.div variants={container} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: 480, padding: '0 20px' }}>
        <motion.input
          variants={item}
          type="text"
          placeholder="아이디를 입력하세요"
          maxLength={20}
          value={userid}
          onChange={e => setUserid(e.target.value)}
          style={inputStyle}
        />
        <motion.input
          variants={item}
          type="password"
          placeholder="비밀번호를 입력하세요"
          maxLength={20}
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={inputStyle}
        />
        <motion.button
          variants={item}
          onClick={handleLogin}
          style={btnStyle}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(102,43,44,0.8)'}
          onMouseLeave={e => e.currentTarget.style.background = btnStyle.background}
        >
          편지 읽기
        </motion.button>
      </motion.div>

      {/* 돌아가기 */}
      <motion.button
        variants={item}
        onClick={() => navigate('/')}
        style={{
          position: 'fixed', bottom: 36, left: 44, zIndex: 2,
          padding: '10px 28px', borderRadius: 50, fontSize: 15,
          fontFamily: 'inherit', cursor: 'pointer',
          border: '1px solid rgba(102,43,44,0.25)',
          background: 'rgba(255,255,255,0.25)',
          color: 'rgba(102,43,44,0.7)',
          backdropFilter: 'blur(8px)',
          transition: 'all 0.25s',
        }}
        whileHover={{ background: 'rgba(255,255,255,0.38)', color: 'rgba(102,43,44,0.95)' }}
      >
        ← 돌아가기
      </motion.button>
      </motion.div>
    </div>
  );
}

const inputStyle = {
  padding: '18px 36px', fontSize: 18, fontFamily: 'inherit',
  background: 'rgba(255,255,255,0.55)',
  border: '1px solid rgba(102,43,44,0.2)',
  borderRadius: 52, color: '#4a2c2c',
  textAlign: 'center', outline: 'none', width: '100%',
  boxSizing: 'border-box',
  transition: 'all 0.3s',
};

const btnStyle = {
  padding: '18px 0', fontSize: 20, fontFamily: 'inherit',
  background: 'rgba(102,43,44,0.55)',
  border: 'none', borderRadius: 52,
  color: '#fff', cursor: 'pointer',
  marginTop: 8, width: '100%',
  transition: 'all 0.3s',
  boxShadow: '0 4px 20px rgba(102,43,44,0.2)',
};
