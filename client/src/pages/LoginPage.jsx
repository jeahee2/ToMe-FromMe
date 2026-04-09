import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1];
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18 } },
};
const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 1.2, ease } },
};

export default function LoginPage() {
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
        navigate('/hello');
      } else {
        alert(data.message);
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    }
  }

  return (
    <motion.div
      className="page-center"
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      variants={container}
    >
      <motion.h1 className="main-title" variants={item}>
        <span className="to">To.Me</span>
        <span className="semicolon"> ; </span>
        <span className="from">From.Me</span>
      </motion.h1>

      <motion.div className="form-container" variants={container}>
        <motion.input
          variants={item}
          className="input-field"
          type="text"
          placeholder="아이디를 입력하세요"
          maxLength={20}
          value={userid}
          onChange={e => setUserid(e.target.value)}
        />
        <motion.input
          variants={item}
          className="input-field"
          type="password"
          placeholder="비밀번호를 입력하세요"
          maxLength={20}
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />
        <motion.button variants={item} className="submit-btn" onClick={handleLogin}>
          로그인
        </motion.button>
      </motion.div>

      <motion.button variants={item} className="back-link" onClick={() => navigate('/')}>
        ← 돌아가기
      </motion.button>
    </motion.div>
  );
}
