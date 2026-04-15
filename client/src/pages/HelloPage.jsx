import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1];
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.25 } },
};
const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 1.2, ease } },
};

const questions = [
  '내년의 나에게 꼭 지키고 싶은 약속 하나는?',
  '지금의 나에게 해주고 싶은 가장 고마운 말은?',
  '지금 이 시기를 한 단어로 남긴다면?',
  '지금의 나에게 가장 필요한 문장은?',
  '미래의 나에게 해주고 싶은 말은?',
  '그동안 가장 많이 달라진 건 무엇일까?',
  '지금의 내가 응원해주고 싶은 말은?',
  '미래의 내가 과거의 나에게 남기고 싶은 말은?',
  '미래의 나는 어떻게 변하였을까?',
  '미래에 나에게 부탁하고 싶은 것은?',
];

export default function HelloPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [qIdx, setQIdx] = useState(0);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');

  useEffect(() => {
    fetch('/get-user-info')
      .then(r => { if (r.status === 401) { navigate('/login'); return null; } return r.json(); })
      .then(d => {
        if (!d) return;
        if (d.name) setName(d.name);
        if (d.email !== undefined) setEmail(d.email);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setInterval(() => setQIdx(i => (i + 1) % questions.length), 4000);
    return () => clearInterval(t);
  }, []);

  function openEmailModal() {
    setNewEmail(email || '');
    setEmailMsg('');
    setShowEmailModal(true);
  }

  async function handleEmailSave() {
    if (!newEmail.trim()) { setEmailMsg('이메일을 입력해주세요.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) { setEmailMsg('이메일 형식이 올바르지 않습니다.'); return; }
    setEmailSaving(true);
    setEmailMsg('');
    try {
      const res = await fetch('/update-email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setEmail(newEmail);
        setEmailMsg('저장되었습니다!');
        setTimeout(() => setShowEmailModal(false), 900);
      } else {
        setEmailMsg(data.message || '오류가 발생했습니다.');
      }
    } catch { setEmailMsg('서버 연결 오류'); }
    finally { setEmailSaving(false); }
  }

  return (
    <motion.div
      style={{ position: 'relative', height: '100vh', zIndex: 1 }}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      variants={container}
    >
      {/* 상단 로고 */}
      <motion.div
        className="top-title"
        variants={{
          hidden: { opacity: 0, y: -20 },
          show: { opacity: 1, y: 0, transition: { duration: 1.4, ease } },
        }}
      >
        <span className="to">To.Me</span>
        <span className="semicolon">;</span>
        <span className="from">From.Me</span>
      </motion.div>

      {/* 우측 상단 버튼 그룹 */}
      <motion.div
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 1, delay: 0.5 } } }}
        style={{ position: 'absolute', top: 36, right: 44, display: 'flex', gap: 10, zIndex: 20 }}
      >
        <motion.button
          onClick={() => navigate('/letters')}
          whileHover={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,252,223,0.9)' }}
          style={navBtnStyle}
        >
          나의 편지 ✉
        </motion.button>
        <motion.button
          onClick={openEmailModal}
          whileHover={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,252,223,0.9)' }}
          style={navBtnStyle}
        >
          {email ? '✉ 이메일 변경' : '✉ 이메일 등록'}
        </motion.button>
        <motion.button
          onClick={() => window.location.href = '/logout'}
          whileHover={{ background: 'rgba(255,80,80,0.15)', color: 'rgba(255,180,180,0.9)', borderColor: 'rgba(255,80,80,0.3)' }}
          style={navBtnStyle}
        >
          로그아웃
        </motion.button>
      </motion.div>

      {/* 본문 */}
      <div
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingLeft: 150,
        }}
      >
        <motion.div
          variants={item}
          style={{
            fontSize: 64,
            fontWeight: 400,
            color: '#fff',
            lineHeight: 1.2,
            marginBottom: 8,
            filter: 'drop-shadow(0 0 8px rgba(255,252,223,0.3))',
          }}
        >
          반가워요.{' '}
          <span style={{ color: '#E6C395' }}>{name || 'Guest'}</span>님
        </motion.div>

        {/* 질문 fade 전환 */}
        <div style={{ height: 80, marginBottom: 80, overflow: 'hidden', position: 'relative' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={qIdx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.65, ease }}
              style={{
                fontSize: 48,
                fontWeight: 300,
                background: 'linear-gradient(to right, #f5f0ea, #d8cabb)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1.4,
              }}
            >
              {questions[qIdx]}
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          variants={item}
          style={{
            width: 400,
            height: 1,
            background: 'rgba(255,255,255,0.3)',
            marginBottom: 80,
          }}
        />

        <motion.button
          variants={item}
          onClick={() => navigate('/write')}
          whileHover={{ translateY: -3, boxShadow: '0 8px 32px rgba(0,0,0,0.24), 0 0 20px rgba(205,154,99,0.18)' }}
          style={{
            width: 440,
            padding: '20px 0',
            fontSize: 28,
            fontFamily: 'inherit',
            fontWeight: 400,
            background: 'linear-gradient(160deg, rgba(90,70,52,0.88) 0%, rgba(58,46,35,0.88) 100%)',
            border: '1px solid rgba(205,154,99,0.22)',
            borderRadius: 60,
            color: '#FFEACD',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.07)',
            letterSpacing: '2px',
            transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
          }}
        >
          To. me
        </motion.button>
      </div>

      {/* 이메일 변경 모달 */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
            onClick={e => { if (e.target === e.currentTarget) setShowEmailModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.35, ease }}
              style={{ background: 'rgba(30,40,55,0.97)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 28, padding: '48px 52px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22, minWidth: 420 }}
            >
              <div style={{ fontSize: 28, fontWeight: 400, color: '#e9dcc6' }}>이메일 변경</div>
              <div style={{ color: 'rgba(255,252,223,0.4)', fontSize: 13, textAlign: 'center', lineHeight: 1.7 }}>
                편지 개봉일에 자동으로 발송되는<br />이메일 주소를 변경합니다.
              </div>
              <input
                type="email"
                placeholder="새 이메일 주소"
                value={newEmail}
                onChange={e => { setNewEmail(e.target.value); setEmailMsg(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleEmailSave(); }}
                autoFocus
                style={modalInputStyle}
              />
              {emailMsg && (
                <div style={{ fontSize: 13, color: emailMsg === '저장되었습니다!' ? '#81c784' : 'rgba(255,130,130,0.85)', marginTop: -8 }}>
                  {emailMsg}
                </div>
              )}
              <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                <motion.button whileHover={{ background: 'rgba(255,255,255,0.12)' }}
                  onClick={() => setShowEmailModal(false)}
                  style={{ width: 150, height: 50, borderRadius: 50, fontSize: 18, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.07)', color: '#f2efe8', transition: 'all 0.25s' }}>
                  취소
                </motion.button>
                <motion.button whileHover={{ translateY: -2 }}
                  onClick={handleEmailSave} disabled={emailSaving}
                  style={{ width: 150, height: 50, borderRadius: 50, fontSize: 18, fontFamily: 'inherit', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg,#e7cfa1,#cfa874)', color: '#2b1e10', transition: 'all 0.25s', opacity: emailSaving ? 0.6 : 1 }}>
                  {emailSaving ? '저장 중...' : '저장'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const navBtnStyle = {
  padding: '8px 20px', borderRadius: 50, fontSize: 13,
  fontFamily: 'inherit', cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,252,223,0.55)',
  backdropFilter: 'blur(8px)',
  transition: 'all 0.25s',
};

const modalInputStyle = {
  padding: '13px 20px', borderRadius: 14, width: '100%',
  border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)',
  color: '#fffcdf', fontSize: 16, fontFamily: 'inherit', outline: 'none',
  backdropFilter: 'blur(6px)', colorScheme: 'dark', transition: 'border-color 0.2s',
};
