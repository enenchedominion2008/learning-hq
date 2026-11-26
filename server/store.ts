import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {STREAK_BADGES} from '../src/data/badges.ts';
import type {
  LessonItem,
  MembershipTier,
  PaymentRequest,
  PublicUser,
  UserRole,
} from '../src/types/learning.ts';

export interface StoredUser extends PublicUser {
  passwordHash: string;
}

export interface StoreState {
  users: StoredUser[];
  paymentRequests: PaymentRequest[];
  lessonLockOverrides: Record<string, boolean>;
  customLessons: Record<string, LessonItem[]>;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'learning-hq.json');

const LEGACY_DEMO_USER_IDS = new Set([
  'usr_ada_01',
  'usr_zainab_02',
  'usr_tunde_03',
]);
const LEGACY_DEMO_PAYMENT_IDS = new Set(['pay_req_01']);

const SESSION_SECRET =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16
    ? process.env.SESSION_SECRET
    : crypto.randomBytes(32).toString('hex');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) {
    return false;
  }
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) {
    return false;
  }
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== storedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(derived, storedBuf);
}

export interface TokenPayload {
  sid: string;
  sub: string;
  role: UserRole;
  exp: number;
}

export function signToken(userId: string, role: UserRole): string {
  const payload: TokenPayload = {
    sid: crypto.randomBytes(8).toString('hex'),
    sub: userId,
    role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const dotIdx = token.indexOf('.');
  if (dotIdx <= 0) {
    return null;
  }
  const encoded = token.slice(0, dotIdx);
  const sig = token.slice(dotIdx + 1);
  const expectedSig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encoded)
    .digest('base64url');

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as TokenPayload;
    if (!parsed.sub || !parsed.role || typeof parsed.exp !== 'number') {
      return null;
    }
    if (Date.now() > parsed.exp) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function toPublicUser(user: StoredUser): PublicUser {
  const {passwordHash: _removed, ...rest} = user;
  return rest;
}

function createEmptyStore(): StoreState {
  return {
    users: [],
    paymentRequests: [],
    lessonLockOverrides: {},
    customLessons: {},
  };
}

export function readStore(): StoreState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {recursive: true});
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial = createEmptyStore();
    writeStore(initial);
    return initial;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as StoreState;
    const rawUsers = Array.isArray(parsed.users) ? parsed.users : [];
    const rawRequests = Array.isArray(parsed.paymentRequests)
      ? parsed.paymentRequests
      : [];

    // Strip any previously seeded demo records so dashboard reflects strictly live accounts
    const cleanUsers = rawUsers
      .filter((u) => !LEGACY_DEMO_USER_IDS.has(u.id))
      .map((u) => ({
        ...u,
        preferredLanguageId:
          typeof u.preferredLanguageId === 'string' ? u.preferredLanguageId : null,
        savedCodeDrafts:
          u.savedCodeDrafts && typeof u.savedCodeDrafts === 'object'
            ? u.savedCodeDrafts
            : {},
        savedDrillAnswers:
          u.savedDrillAnswers && typeof u.savedDrillAnswers === 'object'
            ? u.savedDrillAnswers
            : {},
        streakDays: typeof u.streakDays === 'number' ? u.streakDays : 1,
        longestStreakDays:
          typeof u.longestStreakDays === 'number' ? u.longestStreakDays : 1,
        lastActiveDate:
          typeof u.lastActiveDate === 'string' ? u.lastActiveDate : null,
        earnedBadgeIds: Array.isArray(u.earnedBadgeIds) ? u.earnedBadgeIds : [],
        unseenBadgeIds: Array.isArray(u.unseenBadgeIds) ? u.unseenBadgeIds : [],
        notifications: Array.isArray(u.notifications) ? u.notifications : [],
      }));
    const cleanRequests = rawRequests.filter(
      (r) => !LEGACY_DEMO_PAYMENT_IDS.has(r.id)
    );

    const state: StoreState = {
      users: cleanUsers,
      paymentRequests: cleanRequests,
      lessonLockOverrides:
        parsed.lessonLockOverrides && typeof parsed.lessonLockOverrides === 'object'
          ? parsed.lessonLockOverrides
          : {},
      customLessons:
        parsed.customLessons && typeof parsed.customLessons === 'object'
          ? parsed.customLessons
          : {},
    };

    if (
      cleanUsers.length !== rawUsers.length ||
      cleanRequests.length !== rawRequests.length
    ) {
      writeStore(state);
    }

    return state;
  } catch {
    const fallback = createEmptyStore();
    writeStore(fallback);
    return fallback;
  }
}

export function writeStore(state: StoreState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, {recursive: true});
  }
  const tmpFile = `${DATA_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tmpFile, DATA_FILE);
}

export function getAdminCredentials(): {username: string; passwordHash: string} {
  const username = (process.env.ADMIN_USERNAME || 'admin').trim() || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin';
  return {
    username,
    passwordHash: hashPassword(password),
  };
}

export function computeMonthlyRevenueEstimate(users: StoredUser[]): number {
  return users.reduce((sum, u) => {
    if (u.membershipStatus === 'monthly') return sum + 5000;
    if (u.membershipStatus === 'yearly') return sum + 5000;
    return sum;
  }, 0);
}

export function normalizeTier(tier: unknown): MembershipTier | null {
  if (tier === 'free' || tier === 'monthly' || tier === 'yearly') {
    return tier;
  }
  return null;
}

export function getUtcDayString(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function diffUtcDays(fromDay: string, toDay: string): number {
  const fromMs = Date.parse(`${fromDay}T00:00:00Z`);
  const toMs = Date.parse(`${toDay}T00:00:00Z`);
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) return 999;
  return Math.round((toMs - fromMs) / (1000 * 60 * 60 * 24));
}

export function updateUserStreak(user: StoredUser, todayDay = getUtcDayString()): string[] {
  const earned = new Set(user.earnedBadgeIds ?? []);
  const unseen = new Set(user.unseenBadgeIds ?? []);
  const newlyUnlocked: string[] = [];

  if (!user.lastActiveDate) {
    user.streakDays = Math.max(1, user.streakDays || 1);
  } else {
    const gap = diffUtcDays(user.lastActiveDate, todayDay);
    if (gap === 0) {
      user.streakDays = Math.max(1, user.streakDays || 1);
    } else if (gap === 1) {
      user.streakDays = Math.max(1, user.streakDays || 1) + 1;
    } else if (gap > 1) {
      user.streakDays = 1;
    }
  }

  user.lastActiveDate = todayDay;
  user.longestStreakDays = Math.max(user.longestStreakDays || 1, user.streakDays);

  for (const badge of STREAK_BADGES) {
    if (user.streakDays >= badge.requiredDays && !earned.has(badge.id)) {
      earned.add(badge.id);
      unseen.add(badge.id);
      newlyUnlocked.push(badge.id);
    }
  }

  user.earnedBadgeIds = Array.from(earned);
  user.unseenBadgeIds = Array.from(unseen);
  return newlyUnlocked;
}
