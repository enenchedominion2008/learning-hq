export type UserRole = 'student' | 'admin';

export type MembershipTier = 'free' | 'monthly' | 'yearly';

export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected';

export type LanguageCategory =
  | 'Core & Systems'
  | 'Web & Application'
  | 'Data & Scientific'
  | 'Functional & Scripting';

export interface EmailNotificationRecord {
  id: string;
  kind: 'welcome' | 'membership_approved';
  to: string;
  subject: string;
  message: string;
  imageUrl?: string;
  imageCaption?: string;
  deliveryStatus: 'sent' | 'queued_smtp_unconfigured' | 'failed';
  deliveryNote: string;
  createdAt: string;
  read: boolean;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  membershipStatus: MembershipTier;
  membershipApprovedAt: string | null;
  preferredLanguageId?: string | null;
  completedLessons: string[];
  completedDrills: string[];
  completedArena: string[];
  savedCodeDrafts?: Record<string, string>;
  savedDrillAnswers?: Record<string, number>;
  xp: number;
  streakDays: number;
  longestStreakDays: number;
  lastActiveDate: string | null;
  earnedBadgeIds: string[];
  unseenBadgeIds: string[];
  notifications: EmailNotificationRecord[];
  createdAt: string;
  lastLoginAt?: string | null;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: 'monthly' | 'yearly';
  amountNaira: number;
  senderName: string;
  referenceNote: string;
  status: PaymentRequestStatus;
  createdAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
}

export interface LessonExercise {
  prompt: string;
  starterCode: string;
  expectedKeywords: string[];
  expectedOutput: string;
  hint: string;
}

export interface LessonItem {
  id: string;
  index: number;
  title: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  isFree: boolean;
  summary: string;
  explanation: string[];
  codeExample: string;
  keyTakeaway: string;
  exercise: LessonExercise;
  isCustom?: boolean;
}

export interface DrillItem {
  id: string;
  section: 1 | 2;
  sectionTitle: string;
  title: string;
  type: 'output' | 'fill-blank' | 'debug';
  prompt: string;
  codeSnippet: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ArenaChallenge {
  id: string;
  title: string;
  difficulty: 'Starter' | 'Standard' | 'Mastery';
  isFree: boolean;
  timeLimitMinutes: number;
  description: string;
  requirements: string[];
  starterCode: string;
  sampleInput: string;
  expectedOutput: string;
  validationKeywords: string[];
  jsTestExpression?: string;
}

export interface ProgrammingLanguage {
  rank: number;
  id: string;
  name: string;
  category: LanguageCategory;
  year: number;
  paradigm: string;
  tagline: string;
  fileExt: string;
  lessons: LessonItem[];
  drills: DrillItem[];
  arena: ArenaChallenge[];
}

export interface CurriculumMeta {
  lessonLockOverrides: Record<string, boolean>;
  customLessons: Record<string, LessonItem[]>;
}

export interface AdminOverviewData {
  stats: {
    totalStudents: number;
    loggedInUsers: number;
    activeMembers: number;
    pendingRequests: number;
    totalCompletions: number;
    monthlyRevenueEstimateNaira: number;
  };
  onlineUserIds: string[];
  users: PublicUser[];
  paymentRequests: PaymentRequest[];
  lessonLockOverrides: Record<string, boolean>;
  customLessons: Record<string, LessonItem[]>;
}
