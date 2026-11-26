import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import {GoogleGenAI, ThinkingLevel} from '@google/genai';
import express from 'express';
import type {NextFunction, Request, Response} from 'express';
import {
  sendMembershipApprovedEmail,
  sendPasswordResetOtpEmail,
  sendWelcomeEmail,
} from './server/mailer.ts';
import {
  computeMonthlyRevenueEstimate,
  getAdminCredentials,
  getUtcDayString,
  hashPassword,
  normalizeTier,
  readStore,
  signToken,
  toPublicUser,
  updateUserStreak,
  verifyPassword,
  verifyToken,
  writeStore,
  type TokenPayload,
} from './server/store.ts';
import type {LessonItem, PublicUser} from './src/types/learning.ts';

interface AuthedRequest extends Request {
  auth?: TokenPayload;
}

const app = express();
app.use(express.json({limit: '1mb'}));

const adminConfig = getAdminCredentials();

const ADMIN_PUBLIC_PROFILE: PublicUser = {
  id: 'admin_root',
  name: 'Learning HQ Administrator',
  email: 'admin@learninghq.local',
  username: adminConfig.username,
  role: 'admin',
  membershipStatus: 'yearly',
  membershipApprovedAt: new Date(0).toISOString(),
  preferredLanguageId: 'python',
  completedLessons: [],
  completedDrills: [],
  completedArena: [],
  savedCodeDrafts: {},
  savedDrillAnswers: {},
  xp: 0,
  streakDays: 0,
  longestStreakDays: 0,
  lastActiveDate: null,
  earnedBadgeIds: [],
  unseenBadgeIds: [],
  notifications: [],
  createdAt: new Date(0).toISOString(),
  lastLoginAt: null,
};

// Live active sessions map: sessionId -> { userId, role, lastSeenAt }
const SESSION_TTL_MS = 1000 * 60 * 30;
const activeSessions = new Map<
  string,
  {userId: string; role: 'student' | 'admin'; lastSeenAt: number}
>();

function pruneStaleSessions(): void {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [sid, info] of activeSessions.entries()) {
    if (info.lastSeenAt < cutoff) {
      activeSessions.delete(sid);
    }
  }
}

function registerSessionFromToken(token: string): void {
  const payload = verifyToken(token);
  if (payload?.sid) {
    activeSessions.set(payload.sid, {
      userId: payload.sub,
      role: payload.role,
      lastSeenAt: Date.now(),
    });
  }
}

function getOnlineStudentIds(): string[] {
  pruneStaleSessions();
  const ids = new Set<string>();
  for (const info of activeSessions.values()) {
    if (info.role === 'student') {
      ids.add(info.userId);
    }
  }
  return Array.from(ids);
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') return null;
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (!token) {
    res.status(401).json({error: 'Authentication required'});
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({error: 'Session expired or invalid'});
    return;
  }
  if (payload.sid) {
    activeSessions.set(payload.sid, {
      userId: payload.sub,
      role: payload.role,
      lastSeenAt: Date.now(),
    });
  }
  req.auth = payload;
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.auth?.role !== 'admin') {
      res.status(403).json({error: 'Administrator privileges required'});
      return;
    }
    next();
  });
}

app.post('/api/auth/signup', async (req: Request, res: Response) => {
  const {name, email, password} = req.body ?? {};
  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    res.status(400).json({error: 'Name, email, and password are required.'});
    return;
  }

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (trimmedName.length < 2 || trimmedName.length > 80) {
    res.status(400).json({error: 'Name must be between 2 and 80 characters.'});
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    res.status(400).json({error: 'Please provide a valid email address.'});
    return;
  }
  if (password.length < 4 || password.length > 128) {
    res.status(400).json({error: 'Password must be at least 4 characters.'});
    return;
  }

  const store = readStore();
  if (
    trimmedEmail === adminConfig.username.toLowerCase() ||
    store.users.some((u) => u.email.toLowerCase() === trimmedEmail)
  ) {
    res.status(409).json({error: 'An account with this email already exists.'});
    return;
  }

  const now = new Date().toISOString();
  const todayDay = getUtcDayString();
  const usernameBase = trimmedEmail
    .split('@')[0]
    .replace(/[^a-z0-9_]/gi, '')
    .slice(0, 24);

  const username = usernameBase || 'learner';

  const welcomeEmail = await sendWelcomeEmail({
    to: trimmedEmail,
    name: trimmedName,
    username,
  });

  const newUser = {
    id: `usr_${crypto.randomBytes(6).toString('hex')}`,
    name: trimmedName,
    email: trimmedEmail,
    username,
    passwordHash: hashPassword(password),
    role: 'student' as const,
    membershipStatus: 'free' as const,
    membershipApprovedAt: null,
    preferredLanguageId: null,
    completedLessons: [],
    completedDrills: [],
    completedArena: [],
    savedCodeDrafts: {},
    savedDrillAnswers: {},
    xp: 0,
    streakDays: 1,
    longestStreakDays: 1,
    lastActiveDate: todayDay,
    earnedBadgeIds: [],
    unseenBadgeIds: [],
    notifications: [],
    createdAt: now,
    lastLoginAt: now,
  };

  store.users.unshift(newUser);
  writeStore(store);

  const token = signToken(newUser.id, newUser.role);
  registerSessionFromToken(token);
  res.status(201).json({
    token,
    user: toPublicUser(newUser),
    emailStatus: welcomeEmail.result,
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const {identifier, password, asAdmin} = req.body ?? {};
  if (typeof identifier !== 'string' || typeof password !== 'string') {
    res.status(400).json({error: 'Username/email and password are required.'});
    return;
  }

  const normalized = identifier.trim().toLowerCase();

  if (
    asAdmin === true ||
    normalized === adminConfig.username.toLowerCase()
  ) {
    const isAdminUser = normalized === adminConfig.username.toLowerCase();
    const isAdminPass = verifyPassword(password, adminConfig.passwordHash);
    if (!isAdminUser || !isAdminPass) {
      res.status(401).json({error: 'Invalid administrator credentials.'});
      return;
    }
    const token = signToken(ADMIN_PUBLIC_PROFILE.id, 'admin');
    registerSessionFromToken(token);
    res.json({token, user: ADMIN_PUBLIC_PROFILE});
    return;
  }

  const store = readStore();
  const user = store.users.find(
    (u) =>
      u.email.toLowerCase() === normalized ||
      u.username.toLowerCase() === normalized
  );
  if (!user || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({error: 'Invalid email or password.'});
    return;
  }

  user.lastLoginAt = new Date().toISOString();
  updateUserStreak(user);
  writeStore(store);

  const token = signToken(user.id, user.role);
  registerSessionFromToken(token);
  res.json({token, user: toPublicUser(user)});
});

app.post('/api/auth/logout', requireAuth, (req: AuthedRequest, res: Response) => {
  if (req.auth?.sid) {
    activeSessions.delete(req.auth.sid);
  }
  res.json({ok: true});
});

interface PasswordResetChallenge {
  userId: string;
  otpHash: string | null;
  expiresAt: number;
  attempts: number;
  resendAllowedAt: number;
  resetTokenHash: string | null;
  resetExpiresAt: number;
}

const OTP_TTL_MS = 1000 * 60 * 10;
const OTP_RESEND_COOLDOWN_MS = 1000 * 30;
const OTP_MAX_ATTEMPTS = 5;
const passwordResetChallenges = new Map<string, PasswordResetChallenge>();

function sha256Hex(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function safeHexEqual(aHex: string, bHex: string): boolean {
  const aBuf = Buffer.from(aHex, 'hex');
  const bBuf = Buffer.from(bHex, 'hex');
  if (aBuf.length === 0 || aBuf.length !== bBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function pruneExpiredResetChallenges(): void {
  const now = Date.now();
  for (const [emailKey, ch] of passwordResetChallenges.entries()) {
    const otpActive = ch.otpHash !== null && now <= ch.expiresAt;
    const resetActive = ch.resetTokenHash !== null && now <= ch.resetExpiresAt;
    if (!otpActive && !resetActive) {
      passwordResetChallenges.delete(emailKey);
    }
  }
}

app.post('/api/auth/forgot-password/request', async (req: Request, res: Response) => {
  const {email} = req.body ?? {};
  if (typeof email !== 'string') {
    res.status(400).json({error: 'Please enter your email address.'});
    return;
  }

  const trimmedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    res.status(400).json({error: 'Please provide a valid email address.'});
    return;
  }

  pruneExpiredResetChallenges();
  const existing = passwordResetChallenges.get(trimmedEmail);
  if (existing && Date.now() < existing.resendAllowedAt) {
    const waitSec = Math.ceil((existing.resendAllowedAt - Date.now()) / 1000);
    res.status(429).json({
      error: `Please wait ${waitSec}s before requesting another OTP code.`,
    });
    return;
  }

  const store = readStore();
  const user = store.users.find((u) => u.email.toLowerCase() === trimmedEmail);

  if (!user) {
    res.status(404).json({
      error:
        'No Learning HQ account was found with that email address. Please sign up for free first.',
      code: 'ACCOUNT_NOT_FOUND',
    });
    return;
  }

  const otp = crypto.randomInt(100000, 1000000).toString();
  const now = Date.now();
  passwordResetChallenges.set(trimmedEmail, {
    userId: user.id,
    otpHash: sha256Hex(otp),
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    resendAllowedAt: now + OTP_RESEND_COOLDOWN_MS,
    resetTokenHash: null,
    resetExpiresAt: 0,
  });

  const sent = await sendPasswordResetOtpEmail({
    to: user.email,
    name: user.name,
    username: user.username,
    otp,
    expiresMinutes: 10,
  });

  if (sent.result.deliveryStatus === 'queued_smtp_unconfigured') {
    passwordResetChallenges.delete(trimmedEmail);
    res.status(503).json({
      error:
        'Email sending is not configured yet. Add SMTP_USER and SMTP_PASS in Settings > Secrets so OTP codes can be delivered to your email.',
    });
    return;
  }

  if (sent.result.deliveryStatus === 'failed') {
    passwordResetChallenges.delete(trimmedEmail);
    res.status(502).json({
      error: sent.result.deliveryNote || 'Could not send OTP email right now.',
    });
    return;
  }

  res.json({
    ok: true,
    message:
      'We sent a 6-digit OTP to your email. Go to your email inbox, copy the OTP code, and enter it below to verify your email.',
  });
});

app.post('/api/auth/forgot-password/verify-otp', (req: Request, res: Response) => {
  const {email, otp} = req.body ?? {};
  if (typeof email !== 'string' || typeof otp !== 'string') {
    res.status(400).json({error: 'Email and 6-digit OTP code are required.'});
    return;
  }

  const trimmedEmail = email.trim().toLowerCase();
  const cleanOtp = otp.replace(/\s+/g, '');
  if (!/^\d{6}$/.test(cleanOtp)) {
    res.status(400).json({error: 'Please enter the 6-digit OTP code from your email.'});
    return;
  }

  pruneExpiredResetChallenges();
  const challenge = passwordResetChallenges.get(trimmedEmail);
  if (!challenge || !challenge.otpHash || Date.now() > challenge.expiresAt) {
    res.status(400).json({
      error: 'This OTP has expired or was not requested. Please request a new OTP.',
    });
    return;
  }

  if (challenge.attempts >= OTP_MAX_ATTEMPTS) {
    passwordResetChallenges.delete(trimmedEmail);
    res.status(429).json({
      error: 'Too many incorrect OTP attempts. Please request a new OTP code.',
    });
    return;
  }

  if (!safeHexEqual(sha256Hex(cleanOtp), challenge.otpHash)) {
    challenge.attempts += 1;
    const remaining = OTP_MAX_ATTEMPTS - challenge.attempts;
    if (remaining <= 0) {
      passwordResetChallenges.delete(trimmedEmail);
      res.status(429).json({
        error: 'Too many incorrect OTP attempts. Please request a new OTP code.',
      });
      return;
    }
    res.status(400).json({
      error: `Invalid OTP code. Check your email and try again (${remaining} attempts left).`,
    });
    return;
  }

  const resetToken = crypto.randomBytes(24).toString('hex');
  challenge.otpHash = null;
  challenge.resetTokenHash = sha256Hex(resetToken);
  challenge.resetExpiresAt = Date.now() + OTP_TTL_MS;

  res.json({
    verified: true,
    resetToken,
    message: 'Email verified. You can now set your new password.',
  });
});

app.post('/api/auth/forgot-password/reset', (req: Request, res: Response) => {
  const {email, resetToken, newPassword} = req.body ?? {};
  if (
    typeof email !== 'string' ||
    typeof resetToken !== 'string' ||
    typeof newPassword !== 'string'
  ) {
    res.status(400).json({error: 'Email, verification token, and new password are required.'});
    return;
  }

  if (newPassword.length < 4 || newPassword.length > 128) {
    res.status(400).json({error: 'New password must be between 4 and 128 characters.'});
    return;
  }

  const trimmedEmail = email.trim().toLowerCase();
  pruneExpiredResetChallenges();
  const challenge = passwordResetChallenges.get(trimmedEmail);
  if (
    !challenge ||
    !challenge.resetTokenHash ||
    Date.now() > challenge.resetExpiresAt ||
    !safeHexEqual(sha256Hex(resetToken), challenge.resetTokenHash)
  ) {
    res.status(400).json({
      error: 'Email verification expired. Please request and verify a new OTP.',
    });
    return;
  }

  const store = readStore();
  const user = store.users.find((u) => u.id === challenge.userId);
  if (!user) {
    passwordResetChallenges.delete(trimmedEmail);
    res.status(404).json({error: 'Account not found.'});
    return;
  }

  user.passwordHash = hashPassword(newPassword);
  writeStore(store);
  passwordResetChallenges.delete(trimmedEmail);

  // Invalidate any active sessions belonging to this user after password change
  for (const [sid, info] of activeSessions.entries()) {
    if (info.userId === user.id) {
      activeSessions.delete(sid);
    }
  }

  res.json({
    ok: true,
    message: 'Your password has been changed. You can now log in with your new password.',
  });
});

app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res: Response) => {
  if (req.auth?.role === 'admin' && req.auth.sub === ADMIN_PUBLIC_PROFILE.id) {
    res.json({user: ADMIN_PUBLIC_PROFILE, latestRequest: null});
    return;
  }

  const store = readStore();
  const user = store.users.find((u) => u.id === req.auth?.sub);
  if (!user) {
    res.status(404).json({error: 'Account not found'});
    return;
  }
  const latestRequest =
    store.paymentRequests.find((r) => r.userId === user.id) ?? null;
  res.json({user: toPublicUser(user), latestRequest});
});

app.get('/api/curriculum/meta', (_req: Request, res: Response) => {
  const store = readStore();
  res.json({
    lessonLockOverrides: store.lessonLockOverrides,
    customLessons: store.customLessons,
  });
});

app.patch('/api/user/preferences', requireAuth, (req: AuthedRequest, res: Response) => {
  const {preferredLanguageId} = req.body ?? {};
  if (
    typeof preferredLanguageId !== 'string' ||
    !/^[a-z0-9-]{1,40}$/.test(preferredLanguageId)
  ) {
    res.status(400).json({error: 'Invalid language selection.'});
    return;
  }

  if (req.auth?.role === 'admin') {
    res.json({user: {...ADMIN_PUBLIC_PROFILE, preferredLanguageId}});
    return;
  }

  const store = readStore();
  const user = store.users.find((u) => u.id === req.auth?.sub);
  if (!user) {
    res.status(404).json({error: 'Account not found.'});
    return;
  }

  user.preferredLanguageId = preferredLanguageId;
  writeStore(store);
  res.json({user: toPublicUser(user)});
});

app.put('/api/progress/draft', requireAuth, (req: AuthedRequest, res: Response) => {
  const {itemId, code} = req.body ?? {};
  if (
    typeof itemId !== 'string' ||
    itemId.length < 2 ||
    itemId.length > 80 ||
    typeof code !== 'string' ||
    code.length > 12000
  ) {
    res.status(400).json({error: 'Invalid draft payload.'});
    return;
  }

  if (req.auth?.role === 'admin') {
    res.json({ok: true});
    return;
  }

  const store = readStore();
  const user = store.users.find((u) => u.id === req.auth?.sub);
  if (!user) {
    res.status(404).json({error: 'Account not found.'});
    return;
  }

  const drafts = user.savedCodeDrafts ?? {};
  drafts[itemId] = code;
  const keys = Object.keys(drafts);
  if (keys.length > 250) {
    delete drafts[keys[0]];
  }
  user.savedCodeDrafts = drafts;
  writeStore(store);
  res.json({user: toPublicUser(user)});
});

app.post('/api/progress/complete', requireAuth, (req: AuthedRequest, res: Response) => {
  const {kind, itemId, code, selectedOption} = req.body ?? {};
  if (
    (kind !== 'lesson' && kind !== 'drill' && kind !== 'arena') ||
    typeof itemId !== 'string' ||
    itemId.length < 2 ||
    itemId.length > 80
  ) {
    res.status(400).json({error: 'Invalid completion payload.'});
    return;
  }

  if (req.auth?.role === 'admin') {
    res.json({user: ADMIN_PUBLIC_PROFILE});
    return;
  }

  const store = readStore();
  const user = store.users.find((u) => u.id === req.auth?.sub);
  if (!user) {
    res.status(404).json({error: 'Account not found.'});
    return;
  }

  let xpGain = 0;
  if (kind === 'lesson' && !user.completedLessons.includes(itemId)) {
    user.completedLessons.push(itemId);
    xpGain = 50;
  } else if (kind === 'drill' && !user.completedDrills.includes(itemId)) {
    user.completedDrills.push(itemId);
    xpGain = 30;
  } else if (kind === 'arena' && !user.completedArena.includes(itemId)) {
    user.completedArena.push(itemId);
    xpGain = 100;
  }
  user.xp += xpGain;

  if (typeof code === 'string' && code.length <= 12000) {
    user.savedCodeDrafts = user.savedCodeDrafts ?? {};
    user.savedCodeDrafts[itemId] = code;
  }
  if (
    kind === 'drill' &&
    typeof selectedOption === 'number' &&
    Number.isInteger(selectedOption) &&
    selectedOption >= 0 &&
    selectedOption < 10
  ) {
    user.savedDrillAnswers = user.savedDrillAnswers ?? {};
    user.savedDrillAnswers[itemId] = selectedOption;
  }

  updateUserStreak(user);

  writeStore(store);
  res.json({user: toPublicUser(user), xpGain});
});

app.post('/api/badges/acknowledge', requireAuth, (req: AuthedRequest, res: Response) => {
  if (req.auth?.role === 'admin') {
    res.json({user: ADMIN_PUBLIC_PROFILE});
    return;
  }

  const store = readStore();
  const user = store.users.find((u) => u.id === req.auth?.sub);
  if (!user) {
    res.status(404).json({error: 'Account not found.'});
    return;
  }

  user.unseenBadgeIds = [];
  writeStore(store);
  res.json({user: toPublicUser(user)});
});

app.post('/api/notifications/read', requireAuth, (req: AuthedRequest, res: Response) => {
  if (req.auth?.role === 'admin') {
    res.json({user: ADMIN_PUBLIC_PROFILE});
    return;
  }

  const store = readStore();
  const user = store.users.find((u) => u.id === req.auth?.sub);
  if (!user) {
    res.status(404).json({error: 'Account not found.'});
    return;
  }

  user.notifications = (user.notifications ?? []).map((n) => ({...n, read: true}));
  writeStore(store);
  res.json({user: toPublicUser(user)});
});

app.post('/api/memberships/request', requireAuth, (req: AuthedRequest, res: Response) => {
  const {plan, senderName, referenceNote} = req.body ?? {};
  if (plan !== 'monthly' && plan !== 'yearly') {
    res.status(400).json({error: 'Plan must be monthly or yearly.'});
    return;
  }
  if (typeof senderName !== 'string' || senderName.trim().length < 2) {
    res.status(400).json({error: 'Please enter the transfer sender name.'});
    return;
  }
  if (typeof referenceNote !== 'string' || referenceNote.trim().length < 3) {
    res.status(400).json({error: 'Please enter your Moniepoint transfer reference.'});
    return;
  }

  const store = readStore();
  const user = store.users.find((u) => u.id === req.auth?.sub);
  if (!user) {
    res.status(404).json({error: 'Student account not found.'});
    return;
  }

  const amountNaira = plan === 'monthly' ? 5000 : 60000;
  const newReq = {
    id: `pay_${crypto.randomBytes(5).toString('hex')}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    plan,
    amountNaira,
    senderName: senderName.trim().slice(0, 80),
    referenceNote: referenceNote.trim().slice(0, 120),
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null,
  };

  store.paymentRequests.unshift(newReq);
  writeStore(store);
  res.status(201).json({request: newReq});
});

// Socratic AI Learning Tutor (Server-side Gemini API)
app.post('/api/tutor/ask', requireAuth, async (req: AuthedRequest, res: Response) => {
  const {languageName, lessonTitle, lessonSummary, exercisePrompt, studentCode, question} =
    req.body ?? {};

  if (typeof question !== 'string' || question.trim().length < 2) {
    res.status(400).json({error: 'Please enter a question for the AI Tutor.'});
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    res.status(503).json({
      error:
        'AI Tutor is not configured yet. Please set GEMINI_API_KEY in Settings > Secrets to enable live tutoring.',
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const systemInstruction = [
      'You are Learning HQ Tutor, a patient, beginner-friendly programming mentor.',
      'Your mission is to help the student UNDERSTAND the concept and reason through their exercise on their own.',
      'STRICT RULE: NEVER write the complete solution code, NEVER give the direct final answer to the exercise, and NEVER reveal the exact expected output string.',
      'If the student asks you to solve the exercise or give the answer, kindly decline to spoil it and instead explain the concept step-by-step and point out what syntax element or logic step they should check next.',
      'Keep explanations clear, structured, concise (under 150 words), and end with one short guiding question.',
    ].join(' ');

    const promptText = [
      `Language: ${typeof languageName === 'string' ? languageName.slice(0, 60) : 'Programming'}`,
      `Lesson: ${typeof lessonTitle === 'string' ? lessonTitle.slice(0, 120) : 'Current Lesson'}`,
      `Topic summary: ${typeof lessonSummary === 'string' ? lessonSummary.slice(0, 300) : ''}`,
      `Exercise goal: ${typeof exercisePrompt === 'string' ? exercisePrompt.slice(0, 300) : ''}`,
      `Student current code:\n${typeof studentCode === 'string' ? studentCode.slice(0, 1500) : '(empty)'}`,
      `Student question: ${question.trim().slice(0, 600)}`,
    ].join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: promptText,
      config: {
        systemInstruction,
        thinkingConfig: {thinkingLevel: ThinkingLevel.LOW},
      },
    });

    const reply = (response.text ?? '').trim();
    if (!reply) {
      res.status(502).json({error: 'AI Tutor returned an empty response. Please try again.'});
      return;
    }

    res.json({reply});
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : 'Unable to reach AI Tutor right now. Please check your GEMINI_API_KEY in Settings > Secrets.';
    res.status(502).json({error: msg});
  }
});

app.get('/api/admin/overview', requireAdmin, (_req: AuthedRequest, res: Response) => {
  const store = readStore();
  const publicUsers = store.users.map(toPublicUser);
  const validUserIds = new Set(store.users.map((u) => u.id));
  const onlineUserIds = getOnlineStudentIds().filter((id) => validUserIds.has(id));
  const activeMembers = store.users.filter(
    (u) => u.membershipStatus === 'monthly' || u.membershipStatus === 'yearly'
  ).length;
  const pendingRequests = store.paymentRequests.filter(
    (r) => r.status === 'pending'
  ).length;
  const totalCompletions = store.users.reduce(
    (acc, u) =>
      acc +
      u.completedLessons.length +
      u.completedDrills.length +
      u.completedArena.length,
    0
  );

  res.json({
    stats: {
      totalStudents: store.users.length,
      loggedInUsers: onlineUserIds.length,
      activeMembers,
      pendingRequests,
      totalCompletions,
      monthlyRevenueEstimateNaira: computeMonthlyRevenueEstimate(store.users),
    },
    onlineUserIds,
    users: publicUsers,
    paymentRequests: store.paymentRequests,
    lessonLockOverrides: store.lessonLockOverrides,
    customLessons: store.customLessons,
  });
});

app.post(
  '/api/admin/memberships/:id/review',
  requireAdmin,
  async (req: AuthedRequest, res: Response) => {
    const requestId = req.params.id;
    const {decision} = req.body ?? {};
    if (decision !== 'approved' && decision !== 'rejected') {
      res.status(400).json({error: 'Decision must be approved or rejected.'});
      return;
    }

    const store = readStore();
    const payReq = store.paymentRequests.find((r) => r.id === requestId);
    if (!payReq) {
      res.status(404).json({error: 'Payment request not found.'});
      return;
    }

    const now = new Date().toISOString();
    payReq.status = decision;
    payReq.reviewedAt = now;
    payReq.reviewedBy = adminConfig.username;

    let emailStatus: {deliveryStatus: string; deliveryNote: string} | null = null;

    if (decision === 'approved') {
      const targetUser = store.users.find((u) => u.id === payReq.userId);
      if (targetUser) {
        targetUser.membershipStatus = payReq.plan;
        targetUser.membershipApprovedAt = now;

        const approvalEmail = await sendMembershipApprovedEmail({
          to: targetUser.email,
          name: targetUser.name,
          plan: payReq.plan,
          amountNaira: payReq.amountNaira,
          referenceNote: payReq.referenceNote,
        });

        emailStatus = approvalEmail.result;
      }
    }

    writeStore(store);
    res.json({paymentRequest: payReq, emailStatus});
  }
);

app.patch(
  '/api/admin/users/:id/membership',
  requireAdmin,
  (req: AuthedRequest, res: Response) => {
    const targetUserId = req.params.id;
    const tier = normalizeTier(req.body?.membershipStatus);
    if (!tier) {
      res.status(400).json({error: 'Invalid membership tier.'});
      return;
    }

    const store = readStore();
    const targetUser = store.users.find((u) => u.id === targetUserId);
    if (!targetUser) {
      res.status(404).json({error: 'Student account not found.'});
      return;
    }

    targetUser.membershipStatus = tier;
    targetUser.membershipApprovedAt =
      tier === 'free' ? null : new Date().toISOString();

    writeStore(store);
    res.json({user: toPublicUser(targetUser)});
  }
);

app.patch('/api/admin/lessons/lock', requireAdmin, (req: AuthedRequest, res: Response) => {
  const {lessonId, isFree} = req.body ?? {};
  if (typeof lessonId !== 'string' || typeof isFree !== 'boolean') {
    res.status(400).json({error: 'lessonId and isFree boolean are required.'});
    return;
  }

  const store = readStore();
  store.lessonLockOverrides[lessonId] = isFree;
  writeStore(store);
  res.json({lessonLockOverrides: store.lessonLockOverrides});
});

app.post('/api/admin/lessons/custom', requireAdmin, (req: AuthedRequest, res: Response) => {
  const {languageId, title, level, isFree, summary, explanation, codeExample, exercisePrompt, expectedOutput} =
    req.body ?? {};
  if (
    typeof languageId !== 'string' ||
    typeof title !== 'string' ||
    title.trim().length < 3 ||
    typeof summary !== 'string' ||
    typeof codeExample !== 'string'
  ) {
    res.status(400).json({error: 'Language, title, summary, and code example are required.'});
    return;
  }

  const store = readStore();
  const existing = store.customLessons[languageId] ?? [];
  const newLesson: LessonItem = {
    id: `${languageId}-custom-${crypto.randomBytes(3).toString('hex')}`,
    index: 15 + existing.length,
    title: title.trim().slice(0, 90),
    level: level === 'Beginner' || level === 'Advanced' ? level : 'Intermediate',
    isFree: Boolean(isFree),
    summary: summary.trim().slice(0, 220),
    explanation: [
      typeof explanation === 'string' && explanation.trim().length > 0
        ? explanation.trim()
        : summary.trim(),
    ],
    codeExample: codeExample.trim(),
    keyTakeaway: 'Custom curriculum module published by Learning HQ Administration.',
    exercise: {
      prompt:
        typeof exercisePrompt === 'string' && exercisePrompt.trim().length > 0
          ? exercisePrompt.trim()
          : `Apply the ${title.trim()} concept in your own implementation below.`,
      starterCode: `// TODO: Write your ${title.trim()} solution here\n`,
      expectedKeywords: [],
      expectedOutput:
        typeof expectedOutput === 'string' && expectedOutput.trim().length > 0
          ? expectedOutput.trim()
          : 'Success',
      hint: 'Review the lesson explanation and syntax structure above.',
    },
    isCustom: true,
  };

  store.customLessons[languageId] = [...existing, newLesson];
  writeStore(store);
  res.status(201).json({lesson: newLesson, customLessons: store.customLessons});
});

async function startServer(): Promise<void> {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Learning HQ server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Learning HQ server:', err);
  process.exit(1);
});
