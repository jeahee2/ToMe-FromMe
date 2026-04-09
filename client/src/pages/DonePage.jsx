import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, daysUntil } from '../utils/dates.js';

const ease = [0.22, 1, 0.36, 1];

export default function DonePage() {
  const navigate = useNavigate();
  const { openDate, name } = useLocation().state || {};
  const [phase, setPhase] = useState('circle');

  if (!openDate) { navigate('/hello', { replace: true }); return null; }

  const d = daysUntil(openDate);
  const dChars = ['D', '-', ...String(d).split('')];

  return (
    <motion.div
      style={{ position: 'relative', width: '100%', height: '100vh', zIndex: 1 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      <AnimatePresence mode="sync">

        {/* ── 1단계: 원형 카드 ── */}
        {phase === 'circle' && (
          <motion.div key="circle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
          >
            {/* 로고 */}
            <motion.div
              className="top-title"
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease }}
            >
              <span className="to">To.Me</span>
              <span className="semicolon">;</span>
              <span className="from">From.Me</span>
            </motion.div>

            {/* 카드 */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.15, ease }}
              style={{
                width: 320, padding: '44px 28px', borderRadius: 24,
                backdropFilter: 'blur(16px)',
                background: 'rgba(255,252,235,0.07)',
                border: '1px solid rgba(205,154,99,0.28)',
                boxShadow: '0 4px 40px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.1)',
                marginBottom: 36, textAlign: 'center',
              }}
            >
              {/* 원형 */}
              <div style={{
                width: 148, height: 148, borderRadius: '50%',
                margin: '0 auto 28px', position: 'relative',
                border: '3px solid rgba(205,154,99,0.75)',
                boxShadow: '0 0 24px rgba(205,154,99,0.25)',
              }}>
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  border: '2px dashed rgba(205,154,99,0.4)', margin: 13,
                }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center', width: '100%' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#cd9a63', whiteSpace: 'nowrap', letterSpacing: 0.5 }}>
                    {new Date(openDate).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 5, color: 'rgba(205,154,99,0.75)' }}>도착 예정</div>
                </div>
              </div>

              <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(255,252,223,0.75)', fontWeight: 300 }}>
                이 별은 긴 여행을 마치고 약속한 날<br />다시 떠오를 거예요.
              </p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease }}
              onClick={() => setPhase('letter')}
              whileHover={{ translateY: -2, boxShadow: '0 8px 28px rgba(0,0,0,0.3)' }}
              style={{
                padding: '14px 52px', borderRadius: 50,
                border: '1px solid rgba(205,154,99,0.28)',
                background: 'linear-gradient(160deg, rgba(90,70,52,0.88) 0%, rgba(58,46,35,0.88) 100%)',
                color: '#ffeacd', fontSize: 17, fontFamily: 'inherit', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.07)',
                transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              확인
            </motion.button>
          </motion.div>
        )}

        {/* ── 2단계: 편지지 ── */}
        {phase === 'letter' && (
          <motion.div key="letter"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'absolute', inset: 0 }}
          >
            {/* 로고 */}
            <motion.div
              className="top-title"
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease }}
            >
              <span className="to">To.Me</span>
              <span className="semicolon">;</span>
              <span className="from">From.Me</span>
            </motion.div>

            <div style={{ position: 'relative', width: '100%', height: '100%', padding: '80px 60px 60px' }}>

              {/* 보내는 사람 */}
              <motion.div
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease }}
                style={{ position: 'absolute', top: 140, left: 60 }}
              >
                <div style={{ fontSize: 14, letterSpacing: 2, color: 'rgba(255,252,223,0.4)', marginBottom: 10 }}>보내는 사람</div>
                <div style={{ fontSize: 26, color: '#e9dcc6', fontWeight: 300, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.5))' }}>
                  {formatDate(new Date())}의 {name || '나'}
                </div>
              </motion.div>

              {/* 구분선 */}
              <div style={{ position: 'absolute', top: '50%', left: 60, right: 100, height: 1, background: 'rgba(255,255,255,0.15)' }} />

              {/* 받는 사람 */}
              <motion.div
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease }}
                style={{ position: 'absolute', bottom: 130, right: 120, textAlign: 'right' }}
              >
                <div style={{ fontSize: 14, letterSpacing: 2, color: 'rgba(255,252,223,0.4)', marginBottom: 10 }}>받는 사람</div>
                <div style={{ fontSize: 26, color: '#e9dcc6', fontWeight: 300, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.5))' }}>
                  {formatDate(openDate)}의 {name || '나'} 귀하
                </div>
              </motion.div>

              {/* D-day 사이드바 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease }}
                style={{
                  position: 'absolute', right: 0, top: 0, width: 90, height: '100%',
                  background: 'linear-gradient(to bottom, rgba(205,154,99,0.5), rgba(13,25,40,0.9))',
                  borderTopLeftRadius: 40, borderBottomLeftRadius: 40,
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(205,154,99,0.15)',
                  borderRight: 'none',
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center', gap: 14,
                }}
              >
                {dChars.map((ch, i) => (
                  <div key={i} style={{ fontSize: 30, fontWeight: 700, color: 'rgba(255,252,223,0.85)', lineHeight: 1 }}>{ch}</div>
                ))}
              </motion.div>

              {/* 홈으로 버튼 */}
              <motion.button
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease }}
                onClick={() => navigate('/hello')}
                whileHover={{ translateY: -2 }}
                style={{
                  position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
                  padding: '14px 52px', borderRadius: 50,
                  border: '1px solid rgba(205,154,99,0.28)',
                  background: 'linear-gradient(160deg, rgba(90,70,52,0.88) 0%, rgba(58,46,35,0.88) 100%)',
                  color: '#ffeacd', fontSize: 17, fontFamily: 'inherit', cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(10px)', whiteSpace: 'nowrap',
                  transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                }}
              >
                홈으로
              </motion.button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
