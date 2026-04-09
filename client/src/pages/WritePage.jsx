import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1];
const container = { hidden: {}, show: { transition: { staggerChildren: 0.18 } } };
const item = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 1.2, ease } } };

function defaultOpenDate() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0];
}
function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export default function WritePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(location.state?.mode || 'text');
  const [text, setText] = useState('');

  // 영상 상태
  const [stage, setStage] = useState('idle');
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);
  const [videoUrl, setVideoUrl] = useState('');

  const [showRetryConfirm, setShowRetryConfirm] = useState(false);

  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [openDate, setOpenDate] = useState(defaultOpenDate());
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    fetch('/get-user-info').then(r => r.json()).then(d => {
      if (d.email) setEmail(d.email);
      if (d.name) setName(d.name);
    }).catch(() => {});
  }, []);

  useEffect(() => { return () => { streamRef.current?.getTracks().forEach(t => t.stop()); }; }, []);

  useEffect(() => {
    if (stage !== 'counting') return;
    if (countdown === 0) { startRecording(); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, countdown]);

  useEffect(() => {
    if (stage !== 'recording') return;
    if (timeLeft === 0) { stopRecording(); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, timeLeft]);

  async function prepareCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setStage('counting');
      setCountdown(3);
      setVideoUrl('');
    } catch { alert('카메라 권한을 허용해주세요.'); }
  }

  function startRecording() {
    chunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: 'video/webm;codecs=vp8,opus' });
    mr.ondataavailable = e => { if (e.data?.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = handleUpload;
    mr.start(1000);
    recorderRef.current = mr;
    setStage('recording');
    setTimeLeft(30);
  }

  function stopRecording() {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setStage('uploading');
  }

  async function handleUpload() {
    try {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const res = await fetch('/get-upload-url');
      if (!res.ok) throw new Error();
      const { uploadUrl, publicUrl } = await res.json();
      const put = await fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': 'video/webm' } });
      if (!put.ok) throw new Error();
      setVideoUrl(publicUrl);
      setStage('done');
    } catch {
      alert('업로드 실패. 다시 시도해주세요.');
      setStage('idle');
    }
  }

  function retryVideo() {
    setVideoUrl('');
    setStage('idle');
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function handleModeSwitch(m) {
    setMode(m);
    if (m === 'text' && streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setStage('idle');
    }
  }

  function handleFromMe() {
    if (mode === 'text' && !text.trim()) return alert('내용을 작성해주세요!');
    if (mode === 'video' && !videoUrl) return alert('먼저 영상을 촬영해주세요!');
    setShowModal(true);
  }

  async function handleSave() {
    if (!openDate) return alert('개봉일을 선택해주세요!');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('이메일 형식이 올바르지 않습니다.');
    setSaving(true);
    try {
      const body = mode === 'text'
        ? { type: 'text', content: text, openDate, email }
        : { type: 'video', videoUrl, openDate, email };
      const res = await fetch('/write-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        navigate('/done', { state: { openDate, name } });
      } else {
        alert(data.message || '오류가 발생했습니다.');
        if (res.status === 401) navigate('/login');
      }
    } catch { alert('서버 연결 오류'); }
    finally { setSaving(false); }
  }

  return (
    <motion.div
      style={{ position: 'relative', width: '100%', height: '100vh', zIndex: 1 }}
      initial="hidden" animate="show"
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      variants={container}
    >
      {/* 상단 로고 */}
      <motion.div className="top-title"
        variants={{ hidden: { opacity: 0, y: -20 }, show: { opacity: 1, y: 0, transition: { duration: 1.4, ease } } }}
      >
        <span className="to">To.Me</span><span className="semicolon">;</span><span className="from">From.Me</span>
      </motion.div>

      {/* 돌아가기 */}
      <motion.button
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 1, delay: 0.4 } } }}
        onClick={() => navigate('/hello')}
        className="back-link"
      >
        ← 돌아가기
      </motion.button>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', paddingTop: 60 }}>

        {/* 제목 + 모드 토글 한 줄 */}
        <motion.div variants={item} style={{ width: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 42, fontWeight: 400, color: 'rgba(245,245,245,0.7)', textShadow: '0 0 20px rgba(255,255,255,0.4)' }}>
            To. me
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['text', 'video'].map(m => (
              <button key={m} onClick={() => handleModeSwitch(m)} style={{
                padding: '7px 20px', borderRadius: 50, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer',
                border: '1px solid', transition: 'all 0.25s',
                borderColor: mode === m ? 'rgba(255,220,160,0.5)' : 'rgba(255,255,255,0.2)',
                background: mode === m ? 'rgba(72,56,41,0.75)' : 'rgba(255,255,255,0.06)',
                color: mode === m ? '#ffeacd' : 'rgba(255,252,223,0.5)',
                boxShadow: mode === m ? '0 0 10px rgba(255,220,160,0.15)' : 'none',
              }}>
                {m === 'text' ? '✉ 텍스트' : '🎥 영상'}
              </button>
            ))}
          </div>
        </motion.div>

        {/* 텍스트 모드 */}
        <AnimatePresence mode="wait">
          {mode === 'text' ? (
            <motion.div key="text"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
              onClick={() => document.getElementById('textInput')?.focus()}
              style={{
                width: 1000, height: 480, marginBottom: 32,
                background: 'rgba(140,130,115,0.25)', border: '1.5px solid rgba(255,255,255,0.3)',
                borderRadius: 28, backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', cursor: 'text',
              }}
            >
              {!text && (
                <span style={{ color: 'rgba(255,252,223,0.5)', fontSize: 26, fontWeight: 300, position: 'absolute', pointerEvents: 'none', userSelect: 'none' }}>
                  내년의 나에게 하고 싶은 말을 적어주세요
                </span>
              )}
              <textarea id="textInput" value={text} onChange={e => setText(e.target.value)}
                style={{ width: '100%', height: '100%', background: 'transparent', border: 'none', outline: 'none', padding: 50, color: '#fffcdf', fontSize: 26, fontWeight: 300, resize: 'none', fontFamily: 'inherit', lineHeight: 1.7 }}
              />
            </motion.div>
          ) : (
            /* ── 영상 모드 (카메라 UI) ── */
            <motion.div key="video"
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease }}
              style={{ width: 1000, marginBottom: 32 }}
            >
              <div style={{
                width: '100%', height: 480, background: '#0a0a0a',
                borderRadius: 28, overflow: 'hidden', position: 'relative',
              }}>
                {/* 영상 완료 시 재생 / 그 외 카메라 */}
                {stage === 'done' ? (
                  <motion.video key={videoUrl} src={videoUrl} controls playsInline
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <video ref={videoRef} autoPlay muted playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: stage === 'idle' ? 0 : 1, transition: 'opacity 0.4s' }}
                  />
                )}

                {/* 뷰파인더 코너 브라켓 */}
                {stage !== 'done' && ['tl','tr','bl','br'].map(pos => (
                  <div key={pos} style={{
                    position: 'absolute',
                    width: 24, height: 24,
                    top: pos.startsWith('t') ? 20 : 'auto',
                    bottom: pos.startsWith('b') ? 20 : 'auto',
                    left: pos.endsWith('l') ? 20 : 'auto',
                    right: pos.endsWith('r') ? 20 : 'auto',
                    borderTop: pos.startsWith('t') ? '2px solid rgba(255,255,255,0.5)' : 'none',
                    borderBottom: pos.startsWith('b') ? '2px solid rgba(255,255,255,0.5)' : 'none',
                    borderLeft: pos.endsWith('l') ? '2px solid rgba(255,255,255,0.5)' : 'none',
                    borderRight: pos.endsWith('r') ? '2px solid rgba(255,255,255,0.5)' : 'none',
                  }} />
                ))}

                {/* REC 표시 */}
                {stage === 'recording' && (
                  <div style={{ position: 'absolute', top: 20, left: 52, display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(0,0,0,0.55)', padding: '5px 12px', borderRadius: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff3333', animation: 'recPulse 1.2s infinite' }} />
                    <span style={{ color: '#ff3333', fontSize: 13, fontWeight: 700, letterSpacing: 2 }}>REC</span>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginLeft: 4 }}>
                      {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                    </span>
                  </div>
                )}

                {/* 카운트다운 */}
                {stage === 'counting' && (
                  <AnimatePresence mode="wait">
                    <motion.div key={countdown}
                      initial={{ scale: 1.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 140, fontWeight: 700, color: 'white', textShadow: '0 0 40px rgba(255,255,255,0.4)' }}
                    >
                      {countdown}
                    </motion.div>
                  </AnimatePresence>
                )}

                {/* 업로드 중 */}
                {stage === 'uploading' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', color: '#fffcdf', fontSize: 18 }}>
                    업로드 중...
                  </motion.div>
                )}

                {/* 셔터 / 중지 버튼 */}
                {stage === 'idle' && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, letterSpacing: 2 }}>CAMERA</span>
                    <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} onClick={prepareCamera}
                      style={{ width: 76, height: 76, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'rgba(255,255,255,0.88)' }} />
                    </motion.div>
                  </div>
                )}

                {stage === 'recording' && (
                  <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)' }}>
                    <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} onClick={stopRecording}
                      style={{ width: 76, height: 76, borderRadius: '50%', border: '3px solid rgba(255,80,80,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: '#ff3333' }} />
                    </motion.div>
                  </div>
                )}

                {/* 다시 촬영 버튼 (하단 중앙, 셔터 자리) */}
                {stage === 'done' && !showRetryConfirm && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} onClick={() => setShowRetryConfirm(true)}
                      style={{ width: 76, height: 76, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}>
                      <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'rgba(255,255,255,0.88)' }} />
                    </motion.div>
                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, letterSpacing: 1 }}>다시 촬영</span>
                  </motion.div>
                )}

                {/* 다시 촬영 확인 오버레이 */}
                <AnimatePresence>
                  {showRetryConfirm && (
                    <motion.div
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, borderRadius: 28 }}>
                      <span style={{ color: '#fffcdf', fontSize: 22, fontWeight: 300 }}>다시 촬영하시겠습니까?</span>
                      <div style={{ display: 'flex', gap: 14 }}>
                        <motion.button whileHover={{ background: 'rgba(255,255,255,0.14)' }}
                          onClick={() => setShowRetryConfirm(false)}
                          style={{ width: 130, height: 50, borderRadius: 50, fontSize: 17, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.08)', color: '#f2efe8', transition: 'all 0.2s' }}>
                          아니요
                        </motion.button>
                        <motion.button whileHover={{ translateY: -2 }}
                          onClick={() => { setShowRetryConfirm(false); retryVideo(); }}
                          style={{ width: 130, height: 50, borderRadius: 50, fontSize: 17, fontFamily: 'inherit', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg,#e7cfa1,#cfa874)', color: '#2b1e10', transition: 'all 0.2s' }}>
                          예
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* From.Me 버튼 */}
        <motion.button variants={item} whileHover={{ translateY: -2 }} onClick={handleFromMe}
          style={{ width: 300, height: 70, background: 'rgba(72,56,41,0.7)', border: 'none', borderRadius: 50, color: '#ffeacd', fontSize: 30, fontWeight: 400, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 0 12px 2px rgba(255,252,223,0.15)' }}>
          From.Me
        </motion.button>
      </div>

      {/* ── 저장 모달 ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }}
              transition={{ duration: 0.4, ease }}
              style={{ background: 'rgba(30,40,55,0.95)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 28, padding: '48px 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, minWidth: 480 }}
            >
              <div style={{ fontSize: 36, fontWeight: 400, color: '#e9dcc6', textShadow: '0 0 12px rgba(255,252,223,.3)' }}>
                편지를 저장하시겠습니까?
              </div>

              {/* 개봉일 */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ color: 'rgba(255,252,223,0.5)', fontSize: 13, paddingLeft: 4 }}>📅 개봉일</label>
                <input type="date" min={tomorrow()} value={openDate} onChange={e => setOpenDate(e.target.value)} style={inputStyle} />
              </div>

              {/* 이메일 */}
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ color: 'rgba(255,252,223,0.5)', fontSize: 13, paddingLeft: 4 }}>✉ 발송 이메일 <span style={{ color: 'rgba(255,252,223,0.3)' }}>(개봉일에 자동 발송)</span></label>
                <input type="email" placeholder="이메일 주소" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
              </div>

              {/* 버튼 */}
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <motion.button whileHover={{ background: 'rgba(255,255,255,0.14)' }}
                  onClick={() => { setShowModal(false); navigate('/hello'); }}
                  style={{ width: 180, height: 58, borderRadius: 50, fontSize: 22, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.07)', color: '#f2efe8', backdropFilter: 'blur(6px)', transition: 'all 0.3s' }}>
                  아니요
                </motion.button>
                <motion.button whileHover={{ translateY: -2, boxShadow: '0 0 24px rgba(231,207,161,.7)' }}
                  onClick={handleSave} disabled={saving}
                  style={{ width: 180, height: 58, borderRadius: 50, fontSize: 22, fontFamily: 'inherit', cursor: 'pointer', border: 'none', background: 'linear-gradient(135deg, #e7cfa1, #cfa874)', color: '#2b1e10', boxShadow: '0 0 16px rgba(231,207,161,.4)', transition: 'all 0.3s', opacity: saving ? 0.6 : 1 }}>
                  {saving ? '저장 중...' : '저장'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const inputStyle = {
  padding: '12px 18px', borderRadius: 14, width: '100%',
  border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.07)',
  color: '#fffcdf', fontSize: 16, fontFamily: 'inherit', outline: 'none',
  backdropFilter: 'blur(6px)', colorScheme: 'dark',
  transition: 'border-color 0.2s',
};
