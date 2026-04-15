import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, daysUntil } from '../utils/dates.js';

const ease = [0.22, 1, 0.36, 1];

// 핑크 테마 색상
const C = {
  text:    '#3e1c1c',
  sub:     '#8c5555',
  hint:    '#c09090',
  border:  'rgba(190,120,120,0.22)',
  borderL: 'rgba(190,120,120,0.12)',
  divider: 'rgba(180,110,110,0.18)',
  cardOn:  'rgba(255,255,255,0.6)',
  cardOff: 'rgba(255,255,255,0.28)',
  btnBg:   'rgba(255,255,255,0.4)',
  btnText: '#5a2828',
};

export default function LettersPage() {
  const navigate = useNavigate();
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetch('/get-user-info').then(r => { if (r.status === 401) { navigate('/login'); return null; } return r.json(); }).then(d => { if (d?.name) setName(d.name); }).catch(() => {});
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

  async function deleteLetter(id) {
    try {
      const res = await fetch(`/delete-letter/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLetters(prev => prev.filter(l => l.id !== id));
      } else {
        const data = await res.json();
        alert(data.message || '삭제에 실패했습니다.');
      }
    } catch { alert('서버 연결 오류'); }
    setDeleteConfirm(null);
  }

  function typeLabel(letter) {
    if (letter.type === 'call') return '영상통화';
    if (letter.type === 'video') return '영상';
    if (letter.type === 'draw') return '그림';
    return '텍스트';
  }
  function typeIcon(letter, unlocked) {
    if (!unlocked) return '🔒';
    if (letter.type === 'call') return '📱';
    if (letter.type === 'video') return '🎥';
    if (letter.type === 'draw') return '🎨';
    return '✉';
  }
  function typeBadge(letter) {
    if (letter.type === 'call') return { bg: 'rgba(30,110,60,0.12)', color: '#2d7a4a', border: 'rgba(30,110,60,0.2)' };
    if (letter.type === 'video') return { bg: 'rgba(55,80,170,0.1)', color: '#4a6ab5', border: 'rgba(55,80,170,0.18)' };
    if (letter.type === 'draw') return { bg: 'rgba(170,85,25,0.1)', color: '#a05a28', border: 'rgba(170,85,25,0.18)' };
    return { bg: 'rgba(110,45,45,0.1)', color: '#7a3535', border: 'rgba(110,45,45,0.18)' };
  }

  return (
    <motion.div
      style={{ position: 'relative', width: '100%', height: '100vh', zIndex: 1 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      transition={{ duration: 0.6, ease }}
    >
      {/* 로고 */}
      <motion.div className="top-title"
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease }}
      >
        <span style={{ color: '#fff', filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.5))' }}>To.Me</span>
        <span style={{ color: 'rgba(255,255,255,0.45)', margin: '0 10px' }}>;</span>
        <span style={{ color: '#a07060' }}>From.Me</span>
      </motion.div>

      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 104 }}>

        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease }}
          style={{ width: '100%', maxWidth: 780, padding: '0 24px', marginBottom: 28 }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: C.hint, fontSize: 11, letterSpacing: 4, marginBottom: 10 }}>MY LETTERS</div>
              <h2 style={{ color: C.text, fontSize: 34, fontWeight: 300, margin: 0, letterSpacing: -0.5 }}>나의 편지</h2>
            </div>
            {!loading && letters.length > 0 && (
              <div style={{ display: 'flex', gap: 20, paddingBottom: 6 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#3a7a50', fontSize: 26, fontWeight: 300 }}>{unlockedCount}</div>
                  <div style={{ color: C.hint, fontSize: 11, letterSpacing: 1 }}>개봉됨</div>
                </div>
                <div style={{ width: 1, background: C.divider, margin: '0 2px' }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: C.sub, fontSize: 26, fontWeight: 300 }}>{lockedCount}</div>
                  <div style={{ color: C.hint, fontSize: 11, letterSpacing: 1 }}>잠김</div>
                </div>
              </div>
            )}
          </div>
          <div style={{ height: 1, background: C.divider, marginTop: 18 }} />
        </motion.div>

        {/* 본문 */}
        {loading ? (
          <div style={{ color: C.sub, fontSize: 16, marginTop: 100, letterSpacing: 2 }}>불러오는 중 …</div>
        ) : letters.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, marginTop: 100 }}
          >
            <div style={{ color: C.sub, fontSize: 18, fontWeight: 300 }}>아직 작성한 편지가 없어요</div>
            <div style={{ color: C.hint, fontSize: 14 }}>미래의 나에게 첫 편지를 남겨보세요</div>
            <motion.button whileHover={{ translateY: -2, boxShadow: '0 8px 32px rgba(150,80,80,0.15)' }}
              onClick={() => navigate('/write')}
              style={{ marginTop: 8, padding: '13px 40px', borderRadius: 50, fontSize: 16, fontFamily: 'inherit', cursor: 'pointer', border: `1px solid ${C.border}`, background: C.btnBg, color: C.btnText, backdropFilter: 'blur(20px)', transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)' }}>
              첫 편지 쓰기
            </motion.button>
          </motion.div>
        ) : (
          <div className="letters-scroll" style={{
            flex: 1, minHeight: 0, width: '100%', maxWidth: 780,
            overflowY: 'auto', paddingBottom: 80, paddingLeft: 24, paddingRight: 24,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            {letters.map((letter, i) => {
              const unlocked = new Date(letter.openDate) <= now;
              const days = daysUntil(letter.openDate);
              const badge = typeBadge(letter);

              return (
                <motion.div
                  key={letter.id}
                  initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.07, ease }}
                  whileHover={unlocked ? { translateY: -2, boxShadow: '0 8px 36px rgba(150,80,80,0.14)' } : {}}
                  style={{
                    background: unlocked ? C.cardOn : C.cardOff,
                    border: `1px solid ${unlocked ? C.border : C.borderL}`,
                    borderRadius: 22, padding: '22px 28px',
                    backdropFilter: 'blur(28px)',
                    boxShadow: unlocked ? '0 4px 24px rgba(180,100,100,0.08)' : '0 2px 12px rgba(180,100,100,0.04)',
                    transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 18, cursor: unlocked ? 'pointer' : 'default', flex: 1 }}
                      onClick={() => unlocked && openLetter(letter)}
                    >
                      {/* 아이콘 */}
                      <div style={{
                        width: 52, height: 52, borderRadius: 16, flexShrink: 0,
                        background: unlocked ? 'rgba(180,100,100,0.1)' : 'rgba(180,100,100,0.06)',
                        border: `1px solid ${unlocked ? 'rgba(180,100,100,0.18)' : 'rgba(180,100,100,0.08)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                        backdropFilter: 'blur(8px)',
                      }}>
                        {typeIcon(letter, unlocked)}
                      </div>
                      {/* 정보 */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ color: unlocked ? C.text : C.sub, fontSize: 17, fontWeight: 300 }}>
                            {formatDate(letter.createdAt)} 작성
                          </span>
                          <span style={{
                            fontSize: 12, padding: '3px 10px', borderRadius: 20,
                            background: badge.bg, color: badge.color, border: `1px solid ${badge.border}`,
                          }}>
                            {typeLabel(letter)}
                          </span>
                          {letter.recipientEmail && (
                            <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: 'rgba(140,80,160,0.1)', color: '#9055b0', border: '1px solid rgba(140,80,160,0.18)' }}>
                              → {letter.recipientName || letter.recipientEmail}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 300 }}>
                          {unlocked
                            ? <span style={{ color: '#3a7a50' }}>✓ {formatDate(letter.openDate)} 개봉</span>
                            : <span style={{ color: C.hint }}>{formatDate(letter.openDate)} 개봉 예정</span>
                          }
                        </div>
                      </div>
                    </div>

                    {/* 우측 */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      {unlocked ? (
                        <span style={{ color: C.sub, fontSize: 16, cursor: 'pointer', padding: '4px 8px' }} onClick={() => openLetter(letter)}>▶</span>
                      ) : (
                        <>
                          <div style={{ padding: '5px 14px', borderRadius: 20, background: 'rgba(180,100,100,0.08)', border: `1px solid ${C.borderL}`, color: C.sub, fontSize: 13, fontWeight: 300 }}>
                            D-{days}
                          </div>
                          <motion.button
                            whileHover={{ color: '#c04040', borderColor: 'rgba(192,64,64,0.4)', background: 'rgba(192,64,64,0.08)' }}
                            onClick={() => setDeleteConfirm(letter.id)}
                            style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${C.borderL}`, background: 'none', color: C.hint, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', fontFamily: 'inherit' }}
                          >
                            ×
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* 돌아가기 */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        onClick={() => navigate(-1)}
        whileHover={{ translateY: -1, boxShadow: '0 6px 24px rgba(150,80,80,0.12)' }}
        style={{ position: 'absolute', bottom: 36, left: 44, padding: '11px 28px', borderRadius: 50, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer', border: `1px solid ${C.border}`, background: C.btnBg, color: C.btnText, backdropFilter: 'blur(20px)', transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)' }}
      >
        ← 돌아가기
      </motion.button>

      {/* 삭제 모달 */}
      <AnimatePresence>
        {deleteConfirm !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(200,140,140,0.2)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.35, ease }}
              style={{ background: 'rgba(255,248,246,0.92)', border: `1px solid ${C.border}`, borderRadius: 28, padding: '52px 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, backdropFilter: 'blur(30px)', boxShadow: '0 20px 60px rgba(150,80,80,0.15)' }}
            >
              <div style={{ fontSize: 26, fontWeight: 300, color: C.text }}>편지를 삭제할까요?</div>
              <div style={{ color: C.hint, fontSize: 15, textAlign: 'center', lineHeight: 1.8, fontWeight: 300 }}>
                개봉 전 편지만 삭제할 수 있어요.<br />삭제된 편지는 복구할 수 없습니다.
              </div>
              <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                <motion.button whileHover={{ background: 'rgba(255,255,255,0.7)' }}
                  onClick={() => setDeleteConfirm(null)}
                  style={{ width: 148, height: 52, borderRadius: 50, fontSize: 16, fontFamily: 'inherit', cursor: 'pointer', border: `1px solid ${C.border}`, background: C.btnBg, color: C.btnText, transition: 'all 0.2s', backdropFilter: 'blur(16px)' }}>
                  취소
                </motion.button>
                <motion.button whileHover={{ translateY: -2 }}
                  onClick={() => deleteLetter(deleteConfirm)}
                  style={{ width: 148, height: 52, borderRadius: 50, fontSize: 16, fontFamily: 'inherit', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg,#c05050,#8a2828)', color: '#fff', transition: 'all 0.2s', boxShadow: '0 4px 18px rgba(140,40,40,0.25)' }}>
                  삭제
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
