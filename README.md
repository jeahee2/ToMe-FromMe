# ToMe-FromMe

미래의 나에게 편지를 보내는 타임캡슐 서비스입니다.  
텍스트 또는 영상 편지를 작성하고, 지정한 날짜에 이메일로 전송됩니다.

---

## 주요 기능

- 회원가입 / 로그인
- 텍스트 & 영상 편지 작성
- 개봉일 지정 (타임캡슐 방식)
- 개봉일에 이메일 자동 발송 (nodemailer + node-cron)
- 영상 파일 클라우드 업로드 (AWS S3 / Cloudflare R2)

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Backend | Node.js, Express |
| Database | PostgreSQL + Prisma ORM |
| Storage | AWS S3 / Cloudflare R2 |
| Auth | express-session, bcrypt |
| Email | nodemailer |
| Frontend | HTML/CSS/JS, React (Vite) |

---

## 시작하기

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 아래 항목을 채워주세요.

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=your_secret

# 이메일
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# S3 / R2
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
S3_BUCKET_NAME=...
```

### 3. DB 마이그레이션

```bash
npx prisma migrate dev
```

### 4. 서버 실행

```bash
npm start
```

---

## 프로젝트 구조

```
ToMe-FromMe/
├── app.js              # 서버 진입점
├── routes/             # API 라우터
├── public/             # 정적 HTML/CSS/JS
├── client/             # React 프론트엔드 (Vite)
├── prisma/
│   └── schema.prisma   # DB 스키마
└── .env                # 환경 변수 (git 제외)
```
