import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, daysSince } from '../utils/dates.js';

const ease = [0.22, 1, 0.36, 1];

const btnStyle = {
  padding: '14px 52px', borderRadius: 50,
  border: '1px solid rgba(205,154,99,0.28)',
  background: 'linear-gradient(160deg, rgba(90,70,52,0.88) 0%, rgba(58,46,35,0.88) 100%)',
  color: '#ffeacd', fontSize: 17, fontFamily: 'inherit', cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.07)',
  backdropFilter: 'blur(10px)', whiteSpace: 'nowrap',
  transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
};

const backBtnStyle = {
  position: 'absolute', top: 28, left: 36, zIndex: 10,
  padding: '8px 22px', borderRadius: 50, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.06)',
  color: 'rgba(255,252,223,0.6)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.25s',
};

export default function LetterViewPage() {
  const navigate = useNavigate();
  const { letter, name, returnTo } = useLocation().state || {};
  const [phase, setPhase] = useState('envelope');

  if (!letter) { navigate(-1); return null; }

  const d = daysSince(letter.openDate);
  const dChars = ['D', '+', ...String(d).split('')];

  return (
    <motion.div
      style={{ position: 'relative', width: '100%', height: '100vh', zIndex: 1 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      <AnimatePresence mode="sync">

        {/* ── 봉투 화면 ── */}
        {phase === 'envelope' && (
          <motion.div key="envelope" style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}>

            {/* 로고 */}
            <motion.div className="top-title"
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease }}>
              <span className="to">To.Me</span>
              <span className="semicolon">;</span>
              <span className="from">From.Me</span>
            </motion.div>

            {/* 돌아가기 */}
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              onClick={() => navigate(returnTo || -1)}
              style={backBtnStyle}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,252,223,0.95)'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,252,223,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              ← 목록
            </motion.button>

            {/* 편지지 */}
            <div style={{ position: 'relative', width: '100%', height: '100%', padding: '80px 60px 100px' }}>

              {/* 보내는 사람 */}
              <motion.div
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.15, ease }}
                style={{ position: 'absolute', top: 140, left: 60 }}>
                <div style={{ fontSize: 14, letterSpacing: 2, color: 'rgba(255,252,223,0.4)', marginBottom: 10 }}>보내는 사람</div>
                <div style={{ fontSize: 26, color: '#e9dcc6', fontWeight: 300, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.5))' }}>
                  {formatDate(letter.createdAt)}의 {name}
                </div>
              </motion.div>

              {/* 구분선 */}
              <div style={{ position: 'absolute', top: '50%', left: 60, right: 100, height: 1, background: 'rgba(255,255,255,0.15)' }} />

              {/* 받는 사람 */}
              <motion.div
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.25, ease }}
                style={{ position: 'absolute', bottom: 130, right: 120, textAlign: 'right' }}>
                <div style={{ fontSize: 14, letterSpacing: 2, color: 'rgba(255,252,223,0.4)', marginBottom: 10 }}>받는 사람</div>
                <div style={{ fontSize: 26, color: '#e9dcc6', fontWeight: 300, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.5))' }}>
                  {formatDate(letter.openDate)}의 {name} 귀하
                </div>
              </motion.div>

              {/* D+ 사이드바 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease }}
                style={{
                  position: 'absolute', right: 0, top: 0, width: 90, height: '100%',
                  background: 'linear-gradient(to bottom, rgba(205,154,99,0.5), rgba(13,25,40,0.9))',
                  borderTopLeftRadius: 40, borderBottomLeftRadius: 40,
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(205,154,99,0.15)', borderRight: 'none',
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center', gap: 14,
                }}>
                {dChars.map((ch, i) => (
                  <div key={i} style={{ fontSize: 30, fontWeight: 700, color: 'rgba(255,252,223,0.85)', lineHeight: 1 }}>{ch}</div>
                ))}
              </motion.div>

              {/* 열기 버튼 */}
              <motion.button
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease }}
                onClick={() => setPhase('content')}
                whileHover={{ translateY: -2 }}
                style={{ ...btnStyle, position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)' }}>
                {letter.type === 'video' ? '영상 열기' : '편지 읽기'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── 내용 화면 ── */}
        {phase === 'content' && (
          <motion.div key="content" style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}>

            {/* 로고 */}
            <motion.div className="top-title"
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease }}>
              <span className="to">To.Me</span>
              <span className="semicolon">;</span>
              <span className="from">From.Me</span>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              onClick={() => setPhase('envelope')}
              style={backBtnStyle}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,252,223,0.95)'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,252,223,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              ← 봉투로
            </motion.button>

            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 60px', gap: 32 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease }}
                style={{ width: '100%', maxWidth: 900 }}>
                {letter.type === 'text' ? (
                  <div className="letters-scroll" style={{
                    width: '100%', minHeight: 460, maxHeight: '62vh',
                    background: 'rgba(255,252,235,0.07)',
                    border: '1px solid rgba(205,154,99,0.28)',
                    borderRadius: 24, backdropFilter: 'blur(16px)',
                    padding: '50px 60px', overflowY: 'auto',
                    boxShadow: '0 4px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
                  }}>
                    <p style={{ color: '#e9dcc6', fontSize: 22, fontWeight: 300, lineHeight: 2, whiteSpace: 'pre-wrap', margin: 0 }}>
                      {letter.content}
                    </p>
                  </div>
                ) : (
                  <div style={{ width: '100%', borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 40px rgba(0,0,0,0.4)' }}>
                    <video src={letter.videoUrl} controls playsInline style={{ width: '100%', maxHeight: '62vh', display: 'block' }} />
                  </div>
                )}
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35, ease }}
                onClick={() => setPhase('done')}
                whileHover={{ translateY: -2 }}
                style={btnStyle}>
                확인 완료
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── 완료 화면 ── */}
        {phase === 'done' && (
          <motion.div key="done" style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}>

            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.9, ease }}
                style={{ fontSize: 28, fontWeight: 300, color: '#e9dcc6', filter: 'drop-shadow(0 0 8px rgba(255,252,223,0.2))' }}>
                다음은 어떻게 할까요?
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.18, ease }}
                style={{ display: 'flex', gap: 18 }}>
                <motion.button
                  whileHover={{ translateY: -2 }}
                  onClick={() => navigate('/write')}
                  style={{
                    ...btnStyle,
                    background: 'rgba(255,252,235,0.07)',
                    border: '1px solid rgba(205,154,99,0.28)',
                    color: 'rgba(255,252,223,0.88)',
                  }}>
                  편지 쓰기
                </motion.button>
                <motion.button
                  whileHover={{ translateY: -2 }}
                  onClick={() => navigate('/')}
                  style={btnStyle}>
                  마무리
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
