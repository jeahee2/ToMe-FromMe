import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Stars from './components/Stars.jsx';
import PinkStars from './components/PinkStars.jsx';
import IndexPage from './pages/IndexPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import HelloPage from './pages/HelloPage.jsx';
import WritePage from './pages/WritePage.jsx';
import DonePage from './pages/DonePage.jsx';
import LettersPage from './pages/LettersPage.jsx';
import PinkLoginPage from './pages/PinkLoginPage.jsx';
import PinkLetterViewPage from './pages/PinkLetterViewPage.jsx';
import LetterViewPage from './pages/LetterViewPage.jsx';

const PINK_ROUTES = ['/letters', '/view-letter', '/pink-letters', '/letter-login'];

const DARK_GRADIENT = `linear-gradient(to bottom,
  #0d1520 0%, #151f2e 15%, #1e2d3f 30%, #2a3a4d 45%,
  #3d4b5a 58%, #5a5a5a 68%, #766652 78%,
  #9a8568 86%, #b89a73 93%, #d4b08a 100%)`;

const PINK_GRADIENT = `linear-gradient(to bottom,
  #f6b1b1 0%, #f7bfae 30%, #f8caa7 60%, #f3d8a3 100%)`;

// 두 배경 레이어를 겹쳐서 opacity 교차 페이드
function BackgroundLayers() {
  const location = useLocation();
  const isPink = PINK_ROUTES.some(r => location.pathname.startsWith(r));
  const ease = [0.22, 1, 0.36, 1];

  return (
    <>
      {/* 다크 레이어 */}
      <motion.div
        animate={{ opacity: isPink ? 0 : 1 }}
        transition={{ duration: 1.6, ease }}
        style={{
          position: 'fixed', inset: 0, zIndex: 0,
          background: DARK_GRADIENT,
          pointerEvents: 'none',
        }}
      />
      {/* 핑크 레이어 */}
      <motion.div
        animate={{ opacity: isPink ? 1 : 0 }}
        transition={{ duration: 1.6, ease }}
        style={{
          position: 'fixed', inset: 0, zIndex: 0,
          background: PINK_GRADIENT,
          pointerEvents: 'none',
        }}
      />
      {/* 별: 다크 */}
      <motion.div
        animate={{ opacity: isPink ? 0 : 1 }}
        transition={{ duration: 1.2, ease }}
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      >
        <Stars />
      </motion.div>
      {/* 별: 핑크 */}
      <motion.div
        animate={{ opacity: isPink ? 1 : 0 }}
        transition={{ duration: 1.2, ease }}
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      >
        <PinkStars />
      </motion.div>
    </>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="sync">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<IndexPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/hello" element={<HelloPage />} />
        <Route path="/write" element={<WritePage />} />
        <Route path="/done" element={<DonePage />} />
        <Route path="/letters" element={<LettersPage />} />
        <Route path="/letter-login" element={<PinkLoginPage />} />
        <Route path="/pink-letters" element={<PinkLetterViewPage />} />
        <Route path="/view-letter" element={<LetterViewPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <BackgroundLayers />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
