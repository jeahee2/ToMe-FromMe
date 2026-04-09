import express from "express";
import session from "express-session";
import prisma from "./prisma/client.js";
import path from "path";
import bcrypt from "bcrypt";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import nodemailer from "nodemailer";
import cron from "node-cron";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.VITE_R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.VITE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.VITE_R2_SECRET_ACCESS_KEY,
  },
});

// 이메일 전송 설정 (Gmail SMTP)
const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// 개봉일이 된 편지 이메일 발송
async function sendDueLetters() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  try {
    const letters = await prisma.letter.findMany({
      where: {
        sentAt: null,                // 아직 미발송
        openDate: { lte: todayEnd }, // 오늘 이전이거나 오늘
      },
      include: { author: true },
    });

    for (const letter of letters) {
      const email = letter.author.email;
      if (!email) continue; // 이메일 없으면 건너뜀

      const isVideo = letter.type === "video";
      const html = isVideo
        ? buildVideoEmail(letter.author.name, letter.videoUrl, letter.openDate)
        : buildTextEmail(letter.author.name, letter.content, letter.openDate);
      const text = isVideo
        ? `안녕, ${letter.author.name}.\n과거의 네가 보낸 영상 편지야.\n\n영상 보기: ${letter.videoUrl}`
        : `안녕, ${letter.author.name}.\n과거의 네가 보낸 편지야.\n\n${letter.content}`;

      try {
        await mailer.sendMail({
          from: `"To.Me ; From.Me" <${process.env.GMAIL_USER}>`,
          replyTo: process.env.GMAIL_USER,
          to: email,
          subject: "과거의 내가 보낸 편지가 도착했어요",
          text,
          html,
        });

        await prisma.letter.update({
          where: { id: letter.id },
          data: { sentAt: new Date() },
        });

        console.log(`✉ 발송 완료: ${email} (편지 #${letter.id})`);
      } catch (err) {
        console.error(`✉ 발송 실패: ${email}`, err.message);
      }
    }
  } catch (err) {
    console.error("sendDueLetters 오류:", err);
  }
}

function buildTextEmail(name, content, openDate) {
  return `
  <div style="max-width:600px;margin:0 auto;background:#151f2e;color:#f0ebe0;font-family:sans-serif;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#2a3a4d,#3d4b5a);padding:40px;text-align:center">
      <div style="font-size:28px;font-weight:300;color:#cd9a63">To.Me<span style="color:#fff;margin:0 8px">;</span><span style="color:#f0ebe0">From.Me</span></div>
      <div style="margin-top:8px;color:rgba(255,252,223,0.6);font-size:14px">${new Date(openDate).toLocaleDateString("ko-KR")} 개봉</div>
    </div>
    <div style="padding:40px">
      <p style="font-size:18px;color:#e9dcc6;margin-bottom:24px">안녕, <strong>${name}</strong>.<br>과거의 네가 보낸 편지야.</p>
      <div style="background:rgba(140,130,115,0.2);border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:28px;font-size:16px;line-height:1.8;color:#fffcdf;white-space:pre-wrap">${content}</div>
    </div>
    <div style="padding:20px 40px 40px;text-align:center;color:rgba(255,252,223,0.4);font-size:12px">To.Me ; From.Me</div>
  </div>`;
}

function buildVideoEmail(name, videoUrl, openDate) {
  return `
  <div style="max-width:600px;margin:0 auto;background:#151f2e;color:#f0ebe0;font-family:sans-serif;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#2a3a4d,#3d4b5a);padding:40px;text-align:center">
      <div style="font-size:28px;font-weight:300;color:#cd9a63">To.Me<span style="color:#fff;margin:0 8px">;</span><span style="color:#f0ebe0">From.Me</span></div>
      <div style="margin-top:8px;color:rgba(255,252,223,0.6);font-size:14px">${new Date(openDate).toLocaleDateString("ko-KR")} 개봉</div>
    </div>
    <div style="padding:40px;text-align:center">
      <p style="font-size:18px;color:#e9dcc6;margin-bottom:28px">안녕, <strong>${name}</strong>.<br>과거의 네가 보낸 영상 편지야.</p>
      <a href="${videoUrl}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#e7cfa1,#cfa874);color:#2b1e10;border-radius:50px;text-decoration:none;font-size:18px;font-weight:600">▶ 영상 보기</a>
      <p style="margin-top:20px;color:rgba(255,252,223,0.4);font-size:12px">버튼이 작동하지 않으면: ${videoUrl}</p>
    </div>
    <div style="padding:20px 40px 40px;text-align:center;color:rgba(255,252,223,0.4);font-size:12px">To.Me ; From.Me</div>
  </div>`;
}

// 매일 오전 9시에 발송 체크 (한국 시간)
cron.schedule("0 9 * * *", () => {
  console.log("📬 개봉일 편지 체크 중...");
  sendDueLetters();
}, { timezone: "Asia/Seoul" });

// 서버 시작 시 한 번 체크 (혹시 놓친 편지 발송)
sendDueLetters();

// ─────────────────────────────────────────
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.resolve("client/dist")));

app.use(session({
  secret: "my-secret-key-1234",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60, secure: false }
}));

// DB 연결 테스트
app.get("/db-test", async (req, res) => {
  try { await prisma.$connect(); res.send("DB 연결 성공"); }
  catch (err) { res.status(500).send("DB 연결 실패"); }
});

// 1. 아이디 중복 확인
app.post("/check-username", async (req, res) => {
  const { userid } = req.body;
  const engNumRegex = /^[a-zA-Z0-9]+$/;
  if (!userid) return res.status(400).json({ available: false, message: "아이디를 입력해주세요." });
  if (userid.length > 20) return res.status(400).json({ available: false, message: "아이디는 20자를 넘을 수 없습니다." });
  if (!engNumRegex.test(userid)) return res.status(400).json({ available: false, message: "영어와 숫자만 가능합니다." });
  try {
    const existing = await prisma.member.findUnique({ where: { userid } });
    if (existing) return res.status(400).json({ available: false, message: "이미 사용 중인 아이디입니다." });
    res.status(200).json({ available: true, message: "사용 가능한 아이디입니다." });
  } catch { res.status(500).json({ message: "서버 오류" }); }
});

// 2. 회원가입 (email 추가)
app.post("/register", async (req, res) => {
  const { name, userid, password, email } = req.body;
  if (!name || !userid || !password) return res.status(400).json({ message: "모든 값을 입력해주세요." });
  if (name.length > 10) return res.status(400).json({ message: "이름은 10자를 넘을 수 없습니다." });
  if (userid.length > 20) return res.status(400).json({ message: "아이디는 20자를 넘을 수 없습니다." });
  if (password.length > 20) return res.status(400).json({ message: "비밀번호는 20자를 넘을 수 없습니다." });
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.member.create({ data: { name, userid, password: hashedPassword, email: email || null } });
    res.status(201).json({ message: "회원가입 성공!" });
  } catch { res.status(400).json({ message: "회원가입 실패" }); }
});

// 3. 로그인
app.post("/login", async (req, res) => {
  const { userid, password } = req.body;
  if (!userid || !password) return res.status(400).json({ message: "아이디와 비밀번호를 입력해주세요." });
  try {
    const member = await prisma.member.findUnique({ where: { userid } });
    if (!member) return res.status(400).json({ message: "존재하지 않는 아이디입니다." });
    const isMatch = await bcrypt.compare(password, member.password);
    if (!isMatch) return res.status(400).json({ message: "비밀번호가 틀렸습니다." });
    req.session.user = { id: member.id, userid: member.userid, name: member.name, email: member.email || "" };
    req.session.save(() => {
      res.status(200).json({ message: "로그인 성공", name: member.name });
    });
  } catch { res.status(500).json({ message: "에러 발생" }); }
});

// 4. 유저 정보 (이름 + 이메일)
app.get("/get-user-info", (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: "로그인 필요" });
  res.json({ name: req.session.user.name, email: req.session.user.email || "" });
});

// 5. 로그아웃
app.get("/logout", (req, res) => {
  req.session.destroy(() => { res.clearCookie("connect.sid"); res.redirect("/"); });
});

// 6. 영상 업로드 presigned URL
app.get("/get-upload-url", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: "로그인이 필요합니다." });
  const fileName = `video_${req.session.user.id}_${Date.now()}.webm`;
  const command = new PutObjectCommand({ Bucket: process.env.VITE_R2_BUCKET_NAME, Key: fileName, ContentType: "video/webm" });
  try {
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
    res.json({ uploadUrl, publicUrl: `${process.env.VITE_R2_PUBLIC_URL}/${fileName}` });
  } catch (err) { console.error(err); res.status(500).json({ message: "URL 발급 실패" }); }
});

// 7. 편지 저장 (날짜 + 이메일 포함)
app.post("/write-letter", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: "로그인이 필요합니다." });
  const { type = "text", content, videoUrl, openDate, email } = req.body;
  const authorId = req.session.user.id;
  if (type === "text" && !content) return res.status(400).json({ message: "내용을 입력해주세요." });
  if (type === "video" && !videoUrl) return res.status(400).json({ message: "영상을 녹화해주세요." });
  if (!openDate) return res.status(400).json({ message: "개봉일을 선택해주세요." });

  try {
    // 이메일 주소 업데이트 (입력한 경우)
    if (email) {
      await prisma.member.update({ where: { id: authorId }, data: { email } });
      req.session.user.email = email;
    }

    await prisma.letter.create({
      data: { type, content: content || null, videoUrl: videoUrl || null, openDate: new Date(openDate), authorId }
    });
    res.status(201).json({ message: "편지 저장 성공!" });
  } catch (err) {
    console.error("편지 저장 에러:", err);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 8. 내 편지 목록
app.get("/my-letters", async (req, res) => {
  if (!req.session.user) return res.status(401).json({ message: "로그인 필요" });
  try {
    const letters = await prisma.letter.findMany({
      where: { authorId: req.session.user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, content: true, videoUrl: true, openDate: true, createdAt: true },
    });
    res.json(letters);
  } catch { res.status(500).json({ message: "서버 오류" }); }
});

// SPA 라우팅
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.resolve("client/dist/index.html"));
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
