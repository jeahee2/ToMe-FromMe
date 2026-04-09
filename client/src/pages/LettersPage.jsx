import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDate, daysUntil } from '../utils/dates.js';

const ease = [0.22, 1, 0.36, 1];

export default function LettersPage() {
  const navigate = useNavigate();
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');

  useEffect(() => {
    fetch('/get-user-info').then(r => r.json()).then(d => { if (d.name) setName(d.name); }).catch(() => {});
    fetch('/my-letters')
      .then(r => { if (r.status === 401) { navigate('/login'); return null; } return r.json(); })
      .then(data => { if (data) setLetters(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const unlockedCount = letters.filter(l => new Date(l.openDate) <= now).length;
  const lockedCount = letters.length - unlockedCount;

  function openLetter(letter) {
    navigate('/view-letter', { state: { letter, name, returnTo: '/letters' } });
  }

  return (
    <motion.div
      style={{ position: 'relative', width: '100%', height: '100vh', zIndex: 1 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      transition={{ duration: 0.5, ease }}
    >
      {/* 상단 로고 */}
      <motion.div className="top-title"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease }}
      >
        <span className="to">To.Me</span><span className="semicolon">;</span><span className="from">From.Me</span>
      </motion.div>

      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 96 }}>

        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease }}
          style={{ width: '100%', maxWidth: 760, padding: '0 20px', marginBottom: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'rgba(255,252,223,0.4)', fontSize: 12, letterSpacing: 2, marginBottom: 6 }}>MY LETTERS</div>
              <h2 style={{ color: '#e9dcc6', fontSize: 28, fontWeight: 300, margin: 0, filter: 'drop-shadow(0 0 8px rgba(255,252,223,0.2))' }}>나의 편지</h2>
            </div>
            {!loading && letters.length > 0 && (
              <div style={{ display: 'flex', gap: 14, paddingBottom: 4 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#81c784', fontSize: 20, fontWeight: 300 }}>{unlockedCount}</div>
                  <div style={{ color: 'rgba(255,252,223,0.3)', fontSize: 11 }}>개봉됨</div>
                </div>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255,252,223,0.5)', fontSize: 20, fontWeight: 300 }}>{lockedCount}</div>
                  <div style={{ color: 'rgba(255,252,223,0.3)', fontSize: 11 }}>잠김</div>
                </div>
              </div>
            )}
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', marginTop: 16 }} />
        </motion.div>

        {/* 본문 */}
        {loading ? (
          <div style={{ color: 'rgba(255,252,223,0.35)', fontSize: 14, marginTop: 80, letterSpacing: 1 }}>불러오는 중...</div>
        ) : letters.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginTop: 80 }}
          >
            <div style={{ color: 'rgba(255,252,223,0.35)', fontSize: 16 }}>아직 작성한 편지가 없어요</div>
            <motion.button whileHover={{ translateY: -2 }} onClick={() => navigate('/write')}
              style={{ padding: '12px 32px', borderRadius: 50, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer', border: 'none', background: 'rgba(72,56,41,0.7)', color: '#ffeacd', boxShadow: '0 0 12px rgba(255,252,223,0.1)' }}>
              첫 편지 쓰기
            </motion.button>
          </motion.div>
        ) : (
          <div className="letters-scroll" style={{
            flex: 1, minHeight: 0, width: '100%', maxWidth: 760,
            overflowY: 'auto', paddingBottom: 70, paddingLeft: 20, paddingRight: 20,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {letters.map((letter, i) => {
              const unlocked = new Date(letter.openDate) <= now;
              const days = daysUntil(letter.openDate);

              return (
                <motion.div
                  key={letter.id}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.06, ease }}
                  onClick={() => unlocked && openLetter(letter)}
                  whileHover={unlocked ? { borderColor: 'rgba(205,154,99,0.55)', background: 'rgba(140,130,115,0.28)' } : {}}
                  style={{
                    background: unlocked ? 'rgba(140,130,115,0.2)' : 'rgba(50,50,50,0.2)',
                    border: `1px solid ${unlocked ? 'rgba(205,154,99,0.22)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 18, padding: '18px 22px',
                    cursor: unlocked ? 'pointer' : 'default',
                    backdropFilter: 'blur(12px)',
                    transition: 'box-shadow 0.3s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                        background: unlocked ? 'rgba(205,154,99,0.18)' : 'rgba(255,255,255,0.06)',
                        border: `1px solid ${unlocked ? 'rgba(205,154,99,0.25)' : 'rgba(255,255,255,0.1)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                      }}>
                        {unlocked ? (letter.type === 'video' ? '🎥' : '✉') : '🔒'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ color: unlocked ? '#e9dcc6' : 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                            {formatDate(letter.createdAt)} 작성
                          </span>
                          <span style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 20,
                            background: letter.type === 'video' ? 'rgba(100,150,255,0.15)' : 'rgba(205,154,99,0.15)',
                            color: letter.type === 'video' ? 'rgba(150,180,255,0.7)' : 'rgba(205,154,99,0.7)',
                            border: `1px solid ${letter.type === 'video' ? 'rgba(100,150,255,0.2)' : 'rgba(205,154,99,0.2)'}`,
                          }}>
                            {letter.type === 'video' ? '영상' : '텍스트'}
                          </span>
                        </div>
                        <div style={{ fontSize: 12 }}>
                          {unlocked
                            ? <span style={{ color: '#81c784' }}>✓ {formatDate(letter.openDate)} 개봉</span>
                            : <span style={{ color: 'rgba(255,252,223,0.28)' }}>{formatDate(letter.openDate)} 개봉 예정</span>
                          }
                        </div>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {unlocked ? (
                        <span style={{ color: 'rgba(255,252,223,0.4)', fontSize: 14 }}>▶</span>
                      ) : (
                        <div style={{ padding: '4px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,252,223,0.35)', fontSize: 12 }}>
                          D-{days}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <motion.button className="back-link"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        onClick={() => navigate('/hello')}
      >
        ← 돌아가기
      </motion.button>
    </motion.div>
  );
}
