import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDate, daysUntil } from '../utils/dates.js';

const ease = [0.22, 1, 0.36, 1];

const C = {
  text:    '#3e1c1c',
  sub:     '#8c5555',
  hint:    '#c09090',
  border:  'rgba(190,120,120,0.22)',
  borderL: 'rgba(190,120,120,0.12)',
  cardOn:  'rgba(255,255,255,0.6)',
  cardOff: 'rgba(255,255,255,0.28)',
  btnBg:   'rgba(255,255,255,0.4)',
  btnText: '#5a2828',
};

function typeBadge(type) {
  if (type === 'call') return { bg: 'rgba(30,110,60,0.12)', color: '#2d7a4a', border: 'rgba(30,110,60,0.2)' };
  if (type === 'video') return { bg: 'rgba(55,80,170,0.1)', color: '#4a6ab5', border: 'rgba(55,80,170,0.18)' };
  if (type === 'draw') return { bg: 'rgba(170,85,25,0.1)', color: '#a05a28', border: 'rgba(170,85,25,0.18)' };
  return { bg: 'rgba(110,45,45,0.1)', color: '#7a3535', border: 'rgba(110,45,45,0.18)' };
}
function typeLabel(type) {
  if (type === 'call') return '영상통화';
  if (type === 'video') return '영상';
  if (type === 'draw') return '그림';
  return '텍스트';
}
function typeIcon(letter, unlocked) {
  if (!unlocked) return '🔒';
  if (letter.type === 'call') return '📱';
  if (letter.type === 'video') return '🎥';
  if (letter.type === 'draw') return '🎨';
  return '✉';
}

export default function PinkLetterViewPage() {
  const navigate = useNavigate();
  const [letters, setLetters] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState('');

  async function triggerSend() {
    setSending(true);
    setSendMsg('');
    try {
      await fetch('/trigger-send', { method: 'POST' });
      setSendMsg('이메일 발송 완료!');
      setTimeout(() => setSendMsg(''), 3000);
    } catch { setSendMsg('발송 실패'); }
    finally { setSending(false); }
  }

  useEffect(() => {
    fetch('/get-user-info').then(r => r.json()).then(d => { if (d.name) setName(d.name); }).catch(() => {});
    fetch('/my-letters')
      .then(r => { if (r.status === 401) { navigate('/letter-login'); return null; } return r.json(); })
      .then(data => { if (data) setLetters(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date();

  return (
    <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.sub, fontSize: 17 }}>불러오는 중 …</div>
        ) : letters.length === 0 ? (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
            <div style={{ color: C.text, fontSize: 22, fontWeight: 300 }}>아직 개봉된 편지가 없어요</div>
            <div style={{ color: C.hint, fontSize: 16, fontWeight: 300 }}>개봉일이 되면 이곳에서 읽을 수 있어요</div>
            <motion.button whileHover={{ translateY: -2 }} onClick={() => navigate(-1)}
              style={{ marginTop: 12, padding: '12px 32px', borderRadius: 50, fontSize: 16, fontFamily: 'inherit', cursor: 'pointer', border: `1px solid ${C.border}`, background: C.btnBg, color: C.btnText, backdropFilter: 'blur(20px)', transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)' }}>
              나가기
            </motion.button>
          </div>
        ) : (
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 88 }}>

            {/* 로고 */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease }}
              style={{ fontSize: 26, fontWeight: 300, marginBottom: 32, letterSpacing: 1 }}>
              <span style={{ color: '#fff', filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.5))' }}>To.Me</span>
              <span style={{ color: 'rgba(255,255,255,0.45)', margin: '0 10px' }}>;</span>
              <span style={{ color: '#a07060' }}>From.Me</span>
            </motion.div>

            {/* 라벨 + 이메일 버튼 */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{ color: C.hint, fontSize: 11, letterSpacing: 4 }}>MY LETTERS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <motion.button onClick={triggerSend} disabled={sending}
                  whileHover={{ translateY: -1, boxShadow: '0 6px 24px rgba(150,80,80,0.12)' }}
                  style={{ padding: '10px 24px', borderRadius: 50, fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', border: `1px solid ${C.border}`, background: C.btnBg, color: C.btnText, backdropFilter: 'blur(20px)', transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)', opacity: sending ? 0.5 : 1 }}>
                  {sending ? '발송 중 …' : '✉ 이메일 지금 받기'}
                </motion.button>
                {sendMsg && <span style={{ fontSize: 14, color: C.sub }}>{sendMsg}</span>}
              </div>
            </motion.div>

            {/* 편지 목록 */}
            <div className="letters-scroll" style={{ flex: 1, minHeight: 0, width: '100%', maxWidth: 680, overflowY: 'auto', paddingBottom: 88, paddingLeft: 24, paddingRight: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {letters.map((letter, i) => {
                const unlocked = new Date(letter.openDate) <= now;
                const badge = typeBadge(letter.type);
                return (
                  <motion.div key={letter.id}
                    initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.07, ease }}
                    onClick={() => unlocked && navigate('/view-letter', { state: { letter, name, returnTo: '/pink-letters' } })}
                    whileHover={unlocked ? { translateY: -2, boxShadow: '0 8px 36px rgba(150,80,80,0.14)' } : {}}
                    style={{
                      background: unlocked ? C.cardOn : C.cardOff,
                      border: `1px solid ${unlocked ? C.border : C.borderL}`,
                      borderRadius: 22, padding: '22px 28px',
                      cursor: unlocked ? 'pointer' : 'default',
                      backdropFilter: 'blur(28px)',
                      boxShadow: unlocked ? '0 4px 24px rgba(180,100,100,0.08)' : '0 2px 12px rgba(180,100,100,0.04)',
                      transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                        {/* 아이콘 */}
                        <div style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0, background: unlocked ? 'rgba(180,100,100,0.1)' : 'rgba(180,100,100,0.06)', border: `1px solid ${unlocked ? 'rgba(180,100,100,0.18)' : 'rgba(180,100,100,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, backdropFilter: 'blur(8px)' }}>
                          {typeIcon(letter, unlocked)}
                        </div>
                        {/* 정보 */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={{ color: unlocked ? C.text : C.sub, fontSize: 17, fontWeight: 300 }}>{formatDate(letter.createdAt)} 작성</span>
                            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                              {typeLabel(letter.type)}
                            </span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 300, color: unlocked ? '#3a7a50' : C.hint }}>
                            {unlocked ? `✓ ${formatDate(letter.openDate)} 개봉` : `${formatDate(letter.openDate)} 개봉 예정`}
                          </div>
                        </div>
                      </div>
                      {/* 우측 */}
                      {unlocked
                        ? <span style={{ color: C.sub, fontSize: 16, padding: '4px 8px' }}>▶</span>
                        : <div style={{ padding: '5px 16px', borderRadius: 20, background: 'rgba(180,100,100,0.08)', border: `1px solid ${C.borderL}`, color: C.sub, fontSize: 13, fontWeight: 300 }}>D-{daysUntil(letter.openDate)}</div>
                      }
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* 나가기 */}
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              onClick={() => navigate(-1)}
              whileHover={{ translateY: -1, boxShadow: '0 6px 24px rgba(150,80,80,0.12)' }}
              style={{ position: 'absolute', bottom: 36, left: 44, padding: '11px 28px', borderRadius: 50, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer', border: `1px solid ${C.border}`, background: C.btnBg, color: C.btnText, backdropFilter: 'blur(20px)', transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)' }}>
              ← 나가기
            </motion.button>
          </div>
        )}
      </div>
  );
}
