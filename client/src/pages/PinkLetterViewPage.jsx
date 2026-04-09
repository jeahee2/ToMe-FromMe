import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PinkStars from '../components/PinkStars.jsx';
import { formatDate, daysUntil } from '../utils/dates.js';

const ease = [0.22, 1, 0.36, 1];
const PINK_BG = 'linear-gradient(to bottom,#f6b1b1 0%,#f7bfae 30%,#f8caa7 60%,#f3d8a3 100%)';

export default function PinkLetterViewPage() {
  const navigate = useNavigate();
  const [letters, setLetters] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/get-user-info').then(r => r.json()).then(d => { if (d.name) setName(d.name); }).catch(() => {});
    fetch('/my-letters')
      .then(r => { if (r.status === 401) { navigate('/letter-login'); return null; } return r.json(); })
      .then(data => { if (data) setLetters(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date();

  return (
    <div style={{ position: 'fixed', inset: 0, background: PINK_BG, overflow: 'hidden' }}>
      <PinkStars />
      <div style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%' }}>
        {loading ? (
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(102,43,44,0.5)', fontSize: 15 }}>불러오는 중...</div>
        ) : letters.length === 0 ? (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ color: 'rgba(102,43,44,0.6)', fontSize: 20, fontWeight: 300 }}>아직 개봉된 편지가 없어요</div>
            <div style={{ color: 'rgba(102,43,44,0.35)', fontSize: 14 }}>개봉일이 되면 이곳에서 읽을 수 있어요</div>
            <button onClick={() => navigate('/')} style={{ marginTop: 8, padding: '10px 28px', borderRadius: 50, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid rgba(102,43,44,0.2)', background: 'rgba(255,255,255,0.3)', color: 'rgba(102,43,44,0.6)' }}>나가기</button>
          </div>
        ) : (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 80 }}>
            <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease }}
              style={{ fontSize: 22, fontWeight: 300, marginBottom: 28 }}>
              <span style={{ color: '#fff' }}>To.Me</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', margin: '0 8px' }}>;</span>
              <span style={{ color: '#8d6e63' }}>From.Me</span>
            </motion.div>
            <div style={{ color: 'rgba(102,43,44,0.45)', fontSize: 12, letterSpacing: 2, marginBottom: 20 }}>MY LETTERS</div>

            <div className="letters-scroll" style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 620, overflowY: 'auto', paddingBottom: 80, paddingLeft: 20, paddingRight: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {letters.map((letter, i) => {
                const unlocked = new Date(letter.openDate) <= now;
                return (
                  <motion.div key={letter.id}
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * .07, ease }}
                    onClick={() => unlocked && navigate('/view-letter', { state: { letter, name, returnTo: '/pink-letters' } })}
                    whileHover={unlocked ? { scale: 1.02, boxShadow: '0 4px 20px rgba(102,43,44,0.15)' } : {}}
                    style={{
                      background: unlocked ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)',
                      border: `1px solid ${unlocked ? 'rgba(102,43,44,0.22)' : 'rgba(102,43,44,0.1)'}`,
                      borderRadius: 16, padding: '18px 22px',
                      cursor: unlocked ? 'pointer' : 'default',
                      backdropFilter: 'blur(10px)', transition: 'box-shadow 0.2s',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: unlocked ? 'rgba(102,43,44,0.1)' : 'rgba(102,43,44,0.05)', border: `1px solid ${unlocked ? 'rgba(102,43,44,0.18)' : 'rgba(102,43,44,0.07)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>
                          {unlocked ? (letter.type === 'video' ? '🎥' : '✉') : '🔒'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                            <span style={{ color: unlocked ? 'rgba(102,43,44,0.8)' : 'rgba(102,43,44,0.3)', fontSize: 14 }}>{formatDate(letter.createdAt)} 작성</span>
                            <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: letter.type === 'video' ? 'rgba(80,100,180,0.12)' : 'rgba(102,43,44,0.08)', color: letter.type === 'video' ? 'rgba(80,100,180,0.75)' : 'rgba(102,43,44,0.55)', border: `1px solid ${letter.type === 'video' ? 'rgba(80,100,180,0.18)' : 'rgba(102,43,44,0.12)'}` }}>
                              {letter.type === 'video' ? '영상' : '텍스트'}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: unlocked ? 'rgba(102,43,44,0.45)' : 'rgba(102,43,44,0.22)' }}>
                            {unlocked ? `✓ ${formatDate(letter.openDate)} 개봉` : `${formatDate(letter.openDate)} 개봉 예정`}
                          </div>
                        </div>
                      </div>
                      {unlocked
                        ? <span style={{ color: 'rgba(102,43,44,0.35)', fontSize: 14 }}>▶</span>
                        : <span style={{ padding: '3px 10px', borderRadius: 20, background: 'rgba(102,43,44,0.06)', border: '1px solid rgba(102,43,44,0.1)', color: 'rgba(102,43,44,0.3)', fontSize: 12 }}>D-{daysUntil(letter.openDate)}</span>
                      }
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .5 }}
              onClick={() => navigate('/')}
              style={{ position: 'absolute', bottom: 36, left: 44, padding: '10px 26px', borderRadius: 50, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid rgba(102,43,44,0.2)', background: 'rgba(255,255,255,0.3)', color: 'rgba(102,43,44,0.6)', backdropFilter: 'blur(8px)', transition: 'all .25s' }}>
              ← 나가기
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
}
