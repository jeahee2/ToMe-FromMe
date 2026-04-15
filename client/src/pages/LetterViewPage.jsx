import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate, daysSince } from '../utils/dates.js';

const ease = [0.22, 1, 0.36, 1];

// ── 영상통화 수신 화면 ──
function CallIncoming({ name, openDate, onAnswer, onDecline }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(i => i + 1), 600);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 20,
        background: 'linear-gradient(to bottom, #0a1a0a 0%, #0d220d 40%, #0a1a0a 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* 수신 링 애니메이션 */}
      <div style={{ position: 'relative', marginBottom: 48 }}>
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: 160, height: 160,
              borderRadius: '50%',
              border: '1px solid rgba(0,220,100,0.3)',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
            transition={{ duration: 2, delay: i * 0.65, repeat: Infinity, ease: 'easeOut' }}
          />
        ))}
        <div style={{
          width: 130, height: 130, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1a3a1a, #0d2a0d)',
          border: '2px solid rgba(0,220,100,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 52, position: 'relative', zIndex: 2,
          boxShadow: '0 0 30px rgba(0,200,80,0.3)',
        }}>
          👤
        </div>
      </div>

      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, letterSpacing: 2, marginBottom: 10 }}>
        영상통화 수신 중
      </div>
      <div style={{ color: '#fff', fontSize: 32, fontWeight: 300, marginBottom: 8 }}>
        {formatDate(openDate)}의 나
      </div>
      <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 15, marginBottom: 60 }}>
        과거의 {name || '나'}
        {['.', '..', '...'][tick % 3]}
      </div>

      {/* 수락 / 거절 버튼 */}
      <div style={{ display: 'flex', gap: 60 }}>
        {/* 거절 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <motion.div
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onDecline}
            style={{ width: 72, height: 72, borderRadius: '50%', background: '#c0392b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 28, boxShadow: '0 4px 20px rgba(192,57,43,0.4)' }}>
            📵
          </motion.div>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>거절</span>
        </div>
        {/* 수락 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <motion.div
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={onAnswer}
            style={{ width: 72, height: 72, borderRadius: '50%', background: '#27ae60', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 28, boxShadow: '0 4px 20px rgba(39,174,96,0.4)', animation: 'callPulse 1.2s infinite' }}>
            📱
          </motion.div>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>수락</span>
        </div>
      </div>
    </motion.div>
  );
}

const CALL_PROMPTS = [
  "요즘 어떻게 지내?", "그때 약속 지켰어?", "많이 달라졌어?",
  "지금 가장 행복한 게 뭐야?", "힘든 일 있어?", "꿈은 아직도 같아?",
  "그때 걱정했던 일은 어떻게 됐어?", "후회하는 거 있어?",
  "지금 뭐가 제일 소중해?", "나한테 하고 싶은 말 있어?",
  "그때보다 행복해?", "지금 어디에 있어?", "사랑하는 사람 생겼어?",
];

// ── 영상통화 통화 화면 ──
function CallActive({ letter, name, onHangup }) {
  const pastVideoRef  = useRef(null);
  const presentVideoRef = useRef(null);
  const streamRef     = useRef(null);
  const recorderRef   = useRef(null);
  const chunksRef     = useRef([]);

  const [elapsed, setElapsed]       = useState(0);
  const [prompts, setPrompts]       = useState([]); // { id, text, x }
  const [phase, setPhase]           = useState('call'); // 'call' | 'confirm'
  const [presentBlob, setPresentBlob] = useState(null);
  const [email, setEmail]           = useState('');
  const [uploading, setUploading]   = useState(false);
  const [sendMsg, setSendMsg]       = useState('');
  const [camOk, setCamOk]           = useState(false);

  // 이메일 미리 채우기
  useEffect(() => {
    fetch('/get-user-info').then(r => r.json()).then(d => { if (d.email) setEmail(d.email); }).catch(() => {});
  }, []);

  // 카메라 + 녹화 시작
  useEffect(() => {
    async function startCam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (presentVideoRef.current) presentVideoRef.current.srcObject = stream;
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus' : 'video/webm';
        const recorder = new MediaRecorder(stream, { mimeType });
        recorderRef.current = recorder;
        chunksRef.current = [];
        recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        recorder.start(500);
        setCamOk(true);
      } catch (err) { console.warn('카메라 접근 실패:', err); }
    }
    startCam();
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  // 과거 영상 자동 재생
  useEffect(() => { pastVideoRef.current?.play(); }, []);

  // 타이머
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // 떠다니는 프롬프트
  useEffect(() => {
    const shuffled = [...CALL_PROMPTS].sort(() => Math.random() - 0.5);
    let idx = 0;
    function show() {
      const id = Date.now() + Math.random();
      const text = shuffled[idx % shuffled.length]; idx++;
      setPrompts(p => [...p, { id, text, x: 8 + Math.random() * 55 }]);
      setTimeout(() => setPrompts(p => p.filter(q => q.id !== id)), 4200);
    }
    show();
    const t = setInterval(show, 5000);
    return () => clearInterval(t);
  }, []);

  async function hangup() {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      await new Promise(resolve => { recorder.onstop = resolve; recorder.stop(); });
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (chunksRef.current.length > 0) {
      setPresentBlob(new Blob(chunksRef.current, { type: 'video/webm' }));
    }
    setPhase('confirm');
  }

  async function handleSend() {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSendMsg('이메일 형식을 확인해주세요'); return;
    }
    setUploading(true); setSendMsg('');
    try {
      let presentVideoUrl = '';
      if (presentBlob) {
        const { uploadUrl, publicUrl } = await fetch('/get-upload-url').then(r => r.json());
        await fetch(uploadUrl, { method: 'PUT', body: presentBlob, headers: { 'Content-Type': 'video/webm' } });
        presentVideoUrl = publicUrl;
      }
      await fetch('/send-call-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pastVideoUrl: letter.videoUrl, presentVideoUrl, openDate: letter.openDate, email }),
      }).then(r => r.json()).then(d => { if (d.message) throw new Error(d.message); });
      setSendMsg('이메일이 발송됐어요!');
      setTimeout(onHangup, 1500);
    } catch (err) {
      setSendMsg(err.message || '발송 실패');
    } finally { setUploading(false); }
  }

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');
  const daysAgo = daysSince(letter.createdAt);

  // ── 이메일 확인 화면 ──
  if (phase === 'confirm') {
    return (
      <motion.div key="confirm"
        style={{ position: 'fixed', inset: 0, zIndex: 20, background: '#0a0a12', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <div style={{ fontSize: 32, fontWeight: 300, color: '#fff' }}>통화가 종료됐어요</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, textAlign: 'center', lineHeight: 1.9 }}>
          과거와 현재의 영상을 함께 이메일로 보내드릴게요.<br/>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>이메일 주소를 꼭 확인해주세요</span>
        </div>
        <input
          value={email} onChange={e => { setEmail(e.target.value); setSendMsg(''); }}
          placeholder="이메일 주소"
          style={{ padding: '14px 24px', borderRadius: 50, width: 360, fontSize: 16, fontFamily: 'inherit', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', outline: 'none', textAlign: 'center' }}
        />
        {sendMsg && (
          <div style={{ fontSize: 14, color: sendMsg.includes('됐') ? '#81c784' : '#ff8a80' }}>{sendMsg}</div>
        )}
        <div style={{ display: 'flex', gap: 16 }}>
          <motion.button whileHover={{ background: 'rgba(255,255,255,0.1)' }} onClick={onHangup}
            style={{ padding: '14px 32px', borderRadius: 50, fontSize: 16, fontFamily: 'inherit', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', transition: 'all 0.2s' }}>
            건너뛰기
          </motion.button>
          <motion.button whileHover={{ translateY: -2 }} onClick={handleSend} disabled={uploading}
            style={{ padding: '14px 40px', borderRadius: 50, fontSize: 16, fontFamily: 'inherit', cursor: uploading ? 'default' : 'pointer', background: 'linear-gradient(135deg,#e7cfa1,#cfa874)', border: 'none', color: '#2b1e10', fontWeight: 600, opacity: uploading ? 0.6 : 1, transition: 'all 0.25s' }}>
            {uploading ? '업로드 중…' : '✉ 이메일로 받기'}
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // ── 통화 화면 ──
  return (
    <motion.div
      style={{ position: 'fixed', inset: 0, zIndex: 20, background: '#000', display: 'flex', flexDirection: 'column' }}
      initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* 상태바 */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, background: 'linear-gradient(to bottom,rgba(0,0,0,0.7),transparent)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#27ae60', boxShadow: '0 0 6px #27ae60' }} />
          <span style={{ color: '#fff', fontSize: 13, fontWeight: 300 }}>영상통화 중</span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{mins}:{secs}</span>
      </div>

      {/* 위: 과거의 나 */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderBottom: '1.5px solid #111' }}>
        <video ref={pastVideoRef} src={letter.videoUrl} playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onEnded={hangup} />
        {/* 이름 태그 */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '6px 16px' }}>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 300 }}>
            {daysAgo}일 전의 {name}
          </span>
        </div>

        {/* 떠다니는 프롬프트 */}
        <AnimatePresence>
          {prompts.map(p => (
            <motion.div key={p.id}
              style={{ position: 'absolute', left: `${p.x}%`, bottom: '22%', zIndex: 20, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)', borderRadius: 20, padding: '9px 18px', fontSize: 13, color: 'rgba(255,252,220,0.9)', whiteSpace: 'nowrap', pointerEvents: 'none', border: '1px solid rgba(255,255,255,0.12)' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: -50 }}
              exit={{ opacity: 0, y: -90, transition: { duration: 0.7 } }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {p.text}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 아래: 현재의 나 */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#0a0a0a' }}>
        {camOk
          ? <video ref={presentVideoRef} autoPlay playsInline muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scaleX(-1)' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>카메라를 허용해주세요</div>
        }
        {/* 이름 태그 */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', borderRadius: 20, padding: '6px 16px' }}>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 300 }}>지금의 {name}</span>
        </div>
        {/* REC 표시 */}
        {camOk && (
          <div style={{ position: 'absolute', top: 14, right: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#e74c3c', animation: 'recPulse 1.2s infinite' }} />
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 1 }}>REC</span>
          </div>
        )}

        {/* 통화 종료 버튼 */}
        <div style={{ position: 'absolute', bottom: 20, right: 20 }}>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={hangup}
            style={{ width: 56, height: 56, borderRadius: '50%', background: '#c0392b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 22, boxShadow: '0 4px 20px rgba(192,57,43,0.6)' }}>
            📵
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LetterViewPage() {
  const navigate = useNavigate();
  const { letter, name, returnTo } = useLocation().state || {};
  const [phase, setPhase] = useState('envelope');

  if (!letter) { navigate('/login', { replace: true }); return null; }

  // call 타입이면 envelope 대신 바로 수신 화면으로
  const isCall = letter.type === 'call';
  const isPink = true;
  const d = daysSince(letter.openDate);
  const dChars = ['D', '+', ...String(d).split('')];

  // 핑크 테마 색상 시스템
  const textMain        = isPink ? '#2e1414'                   : '#e9dcc6';
  const textSub         = isPink ? '#8a5252'                   : 'rgba(255,252,223,0.45)';
  const textHint        = isPink ? '#b07878'                   : 'rgba(255,252,223,0.3)';
  const textBtn         = isPink ? '#5a2828'                   : '#ffeacd';
  const btnBg           = isPink ? 'rgba(255,255,255,0.42)'    : 'linear-gradient(160deg,rgba(90,70,52,0.88) 0%,rgba(58,46,35,0.88) 100%)';
  const btnBorder       = isPink ? '1px solid rgba(180,110,110,0.28)'        : '1px solid rgba(205,154,99,0.28)';
  const backColor       = isPink ? '#7a4545'                   : 'rgba(255,252,223,0.6)';
  const backBg          = isPink ? 'rgba(255,255,255,0.35)'    : 'rgba(255,255,255,0.06)';
  const backBorder      = isPink ? '1px solid rgba(150,80,80,0.25)'          : '1px solid rgba(255,255,255,0.15)';
  const dividerBg       = isPink ? 'rgba(150,80,80,0.18)'      : 'rgba(255,255,255,0.15)';
  const sidebarBg       = isPink ? 'linear-gradient(to bottom,rgba(246,180,180,0.6),rgba(240,175,145,0.75))' : 'linear-gradient(to bottom,rgba(205,154,99,0.5),rgba(13,25,40,0.9))';
  const sidebarBorder   = isPink ? '1px solid rgba(150,80,80,0.18)'          : '1px solid rgba(205,154,99,0.15)';
  const letterBoxBg     = isPink ? 'rgba(255,250,248,0.72)'    : 'rgba(255,252,235,0.07)';
  const letterBoxBorder = isPink ? '1px solid rgba(150,80,80,0.16)'          : '1px solid rgba(205,154,99,0.28)';

  const btnStyle = {
    padding: '14px 56px', borderRadius: 50,
    border: btnBorder, background: btnBg,
    color: textBtn, fontSize: 17, fontFamily: 'inherit', cursor: 'pointer',
    boxShadow: isPink ? '0 4px 24px rgba(180,100,100,0.12)' : '0 4px 20px rgba(0,0,0,0.15)',
    backdropFilter: 'blur(24px)', whiteSpace: 'nowrap',
    transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
    letterSpacing: 0.5,
  };

  const backBtnStyle = {
    position: 'absolute', top: 28, left: 36, zIndex: 10,
    padding: '8px 20px', borderRadius: 50, fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
    border: backBorder, background: backBg, color: backColor,
    backdropFilter: 'blur(10px)', transition: 'all 0.25s',
  };

  return (
    <motion.div
      style={{
        position: 'fixed', inset: 0, zIndex: 10, width: '100%', height: '100vh',
        background: isPink ? 'linear-gradient(to bottom,#f6b1b1 0%,#f7bfae 30%,#f8caa7 55%,#f6d3a0 75%,#f3d8a3 100%)' : undefined,
      }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      <AnimatePresence mode="sync">

        {/* ── call: 수신 화면 ── */}
        {isCall && phase === 'envelope' && (
          <CallIncoming
            key="call-incoming"
            name={name}
            openDate={letter.openDate}
            onAnswer={() => setPhase('content')}
            onDecline={() => navigate(returnTo || -1)}
          />
        )}

        {/* ── call: 통화 화면 ── */}
        {isCall && phase === 'content' && (
          <CallActive
            key="call-active"
            letter={letter}
            name={name}
            onHangup={() => setPhase('done')}
          />
        )}

        {/* ── 일반: 봉투 화면 ── */}
        {!isCall && phase === 'envelope' && (
          <motion.div key="envelope" style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}>

            <motion.div className="top-title"
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease }}>
              {isPink ? (<>
                <span style={{ color: '#fff', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.4))' }}>To.Me</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', margin: '0 10px' }}> ; </span>
                <span style={{ color: '#5a3e33' }}>From.Me</span>
              </>) : (<>
                <span className="to">To.Me</span>
                <span className="semicolon">;</span>
                <span className="from">From.Me</span>
              </>)}
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              onClick={() => navigate(returnTo || -1)}
              style={backBtnStyle}
            >
              ← 목록
            </motion.button>

            <div style={{ position: 'relative', width: '100%', height: '100%', padding: '80px 60px 100px' }}>

              <motion.div
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.15, ease }}
                style={{ position: 'absolute', top: 130, left: 140 }}>
                <div style={{ fontSize: 13, letterSpacing: 4, color: textHint, marginBottom: 12, textTransform: 'uppercase' }}>보내는 사람</div>
                <div style={{ fontSize: 40, color: '#7a4848', fontWeight: 300, letterSpacing: -0.5 }}>
                  {formatDate(letter.createdAt)}의 {name}
                </div>
              </motion.div>

              <div style={{ position: 'absolute', top: '50%', left: 140, right: 140, height: 1, background: dividerBg }} />

              <motion.div
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.25, ease }}
                style={{ position: 'absolute', bottom: 120, right: 170, textAlign: 'right' }}>
                <div style={{ fontSize: 13, letterSpacing: 4, color: textHint, marginBottom: 12, textTransform: 'uppercase' }}>받는 사람</div>
                <div style={{ fontSize: 40, color: '#7a4848', fontWeight: 300, letterSpacing: -0.5 }}>
                  {letter.recipientName
                    ? `${letter.recipientName} 귀하`
                    : `${formatDate(letter.openDate)}의 ${name} 귀하`
                  }
                </div>
              </motion.div>

              {/* D+0 사이드바 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease }}
                style={{
                  position: 'absolute', right: 0, top: 0, width: 96, height: '100%',
                  background: isPink
                    ? 'linear-gradient(to bottom, rgba(252,235,160,0.6) 0%, rgba(246,165,165,0.7) 100%)'
                    : sidebarBg,
                  borderTopLeftRadius: 36, borderBottomLeftRadius: 36,
                  backdropFilter: 'blur(20px)',
                  border: sidebarBorder, borderRight: 'none',
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', alignItems: 'center', gap: 12,
                }}>
                {dChars.map((ch, i) => (
                  <div key={i} style={{ fontSize: 27, fontWeight: 300, color: textSub, lineHeight: 1.1 }}>{ch}</div>
                ))}
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease }}
                onClick={() => setPhase('content')}
                whileHover={{ translateY: -2 }}
                style={{ ...btnStyle, position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)' }}>
                {letter.type === 'video' ? '영상 열기' : letter.type === 'draw' ? '그림 열기' : '편지 읽기'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── 일반: 내용 화면 ── */}
        {!isCall && phase === 'content' && (
          <motion.div key="content" style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}>

            <motion.div className="top-title"
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease }}>
              {isPink ? (<>
                <span style={{ color: '#fff', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.4))' }}>To.Me</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', margin: '0 10px' }}> ; </span>
                <span style={{ color: '#5a3e33' }}>From.Me</span>
              </>) : (<>
                <span className="to">To.Me</span>
                <span className="semicolon">;</span>
                <span className="from">From.Me</span>
              </>)}
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              onClick={() => setPhase('envelope')}
              style={backBtnStyle}
            >
              ← 봉투로
            </motion.button>

            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 60px', gap: 28 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease }}
                style={{ width: '100%', maxWidth: 900 }}>

                {letter.type === 'draw' ? (
                  <div style={{ width: '100%', borderRadius: 24, overflow: 'hidden', boxShadow: '0 4px 40px rgba(0,0,0,0.3)', border: letterBoxBorder }}>
                    <img src={letter.imageUrl} style={{ width: '100%', display: 'block' }} />
                  </div>
                ) : letter.type === 'text' ? (
                  <div className="letters-scroll" style={{
                    width: '100%', minHeight: 320, maxHeight: '58vh',
                    background: letterBoxBg,
                    border: letterBoxBorder,
                    borderRadius: 24, backdropFilter: 'blur(16px)',
                    padding: '44px 56px', overflowY: 'auto',
                    boxShadow: isPink ? '0 6px 40px rgba(120,50,50,0.1)' : '0 4px 40px rgba(0,0,0,0.1)',
                  }}>
                    <p style={{ color: textMain, fontSize: 22, fontWeight: 300, lineHeight: 2.2, whiteSpace: 'pre-wrap', margin: 0, letterSpacing: 0.4 }}>
                      {letter.content}
                    </p>

                    {/* 첨부 이미지 */}
                    {letter.imageUrl && (
                      <div style={{ marginTop: 24 }}>
                        <img
                          src={letter.imageUrl}
                          style={{ maxWidth: '100%', borderRadius: 12, border: `1px solid ${isPink ? 'rgba(102,43,44,0.2)' : 'rgba(255,255,255,0.15)'}` }}
                        />
                      </div>
                    )}

                    {/* 서명 */}
                    {letter.signatureData && (
                      <div style={{ marginTop: 20, textAlign: 'right', paddingTop: 16, borderTop: `1px solid ${isPink ? 'rgba(102,43,44,0.1)' : 'rgba(255,255,255,0.1)'}` }}>
                        <img src={letter.signatureData} style={{ maxHeight: 70, opacity: 0.85 }} />
                      </div>
                    )}
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
                style={{ fontSize: 28, fontWeight: 300, color: textMain }}>
                {isCall ? '통화가 종료됐어요.' : '다음은 어떻게 할까요?'}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.18, ease }}
                style={{ display: 'flex', gap: 18 }}>
                <motion.button
                  whileHover={{ translateY: -2 }}
                  onClick={() => navigate(returnTo || '/letters')}
                  style={{ ...btnStyle, background: backBg, border: backBorder, color: backColor }}>
                  편지 목록
                </motion.button>
                <motion.button
                  whileHover={{ translateY: -2 }}
                  onClick={() => navigate('/write')}
                  style={{ ...btnStyle, background: backBg, border: backBorder, color: backColor }}>
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
