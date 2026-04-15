# To.Me ; From.Me

미래의 나에게 편지를 보내는 타임캡슐 서비스입니다.  
텍스트 · 그림 · 영상 · 영상통화 형식으로 편지를 작성하고, 지정한 날짜에 이메일로 자동 발송됩니다.

---

## 주요 기능

- 회원가입 / 로그인 (세션 기반 인증)
- **텍스트 편지** — 글자별 페이드인 애니메이션, 사진 첨부(카메라 촬영), 서명
- **그림 편지** — 캔버스 드로잉, 컬러 팔레트, Ctrl+Z 실행 취소
- **영상 편지** — 영상 녹화 후 업로드
- **영상통화** — 개봉 시 과거↔현재 분할화면, 실시간 카메라 녹화, 대화 주제 프롬프트 버블, 통화 후 두 영상 이메일 발송
- 타인에게 편지 보내기 (수신자 이름/이메일 지정)
- 개봉일 지정 — 당일 즉시 발송 또는 예약 발송 (KST 기준)
- 개봉일에 이메일 자동 발송 (nodemailer + node-cron)
- 영상/이미지 클라우드 업로드 (Cloudflare R2)
- 편지 목록 조회 및 삭제
- 핑크 테마 편지 읽기 (별도 PIN 로그인)

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Backend | Node.js, Express |
| Database | PostgreSQL + Prisma ORM |
| Storage | Cloudflare R2 (AWS S3 호환) |
| Auth | express-session, bcrypt |
| Email | nodemailer (Gmail SMTP) |
| Frontend | React 18, Vite |
| UI | Framer Motion, CSS |

---

## 시작하기

### 1. 패키지 설치

```bash
npm install
cd client && npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 아래 항목을 채워주세요.

```env
DATABASE_URL=postgresql://...

# 이메일
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Cloudflare R2
VITE_R2_BUCKET_NAME=...
VITE_R2_PUBLIC_URL=https://...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...

# 편지 읽기 PIN
LETTER_PIN=1234
```

### 3. DB 마이그레이션

```bash
npx prisma migrate dev
```

### 4. 프론트엔드 빌드

```bash
cd client && npm run build
```

### 5. 서버 실행

```bash
npm start
```

---

## 프로젝트 구조

```
ToMe-FromMe/
├── app.js                  # 서버 진입점 (Express + API + 이메일 스케줄러)
├── prisma/
│   └── schema.prisma       # DB 스키마
├── client/
│   ├── src/
│   │   ├── pages/          # React 페이지 컴포넌트
│   │   ├── components/     # 공통 컴포넌트 (Stars 등)
│   │   └── utils/          # 날짜 유틸
│   └── dist/               # 빌드 결과물
└── .env                    # 환경 변수 (git 제외)
```
