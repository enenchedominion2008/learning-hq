import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';
import type {EmailNotificationRecord} from '../src/types/learning.ts';

const WORKSHOP_IMAGE_REL_PATH =
  'public/assets/aistudio/Cheerful_Coding_Workshop_Selfie_714295be.webp';
const WORKSHOP_CID = 'learninghq_workshop_selfie';

function escapeHtml(raw: string): string {
  return raw
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export interface EmailSendResult {
  deliveryStatus: EmailNotificationRecord['deliveryStatus'];
  deliveryNote: string;
}

interface MailAttachment {
  filename: string;
  path: string;
  cid: string;
}

function getSmtpConfig(): {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
} | null {
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();
  const rawHost = (process.env.SMTP_HOST || '').trim();
  const isGmailUser = /@(gmail|googlemail)\.com$/i.test(user);
  const host = rawHost || (isGmailUser ? 'smtp.gmail.com' : '');
  const port = Number(process.env.SMTP_PORT) || (host === 'smtp.gmail.com' && !rawHost ? 465 : 587);
  const from =
    (process.env.SMTP_FROM || '').trim() ||
    (user ? `Learning HQ <${user}>` : 'Learning HQ <no-reply@learninghq.local>');

  if (!host || !user || !pass) {
    return null;
  }
  return {host, port, user, pass, from};
}

async function dispatchEmail(params: {
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments?: MailAttachment[];
}): Promise<EmailSendResult> {
  const cfg = getSmtpConfig();
  if (!cfg) {
    return {
      deliveryStatus: 'queued_smtp_unconfigured',
      deliveryNote:
        'Configure SMTP_HOST, SMTP_USER, and SMTP_PASS in Settings > Secrets to deliver emails directly to the recipient inbox.',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.port === 465,
      auth: {
        user: cfg.user,
        pass: cfg.pass,
      },
    });

    await transporter.sendMail({
      from: cfg.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments: params.attachments,
    });

    return {
      deliveryStatus: 'sent',
      deliveryNote: `Email sent to ${params.to}`,
    };
  } catch (err) {
    return {
      deliveryStatus: 'failed',
      deliveryNote:
        err instanceof Error
          ? `SMTP delivery failed (${err.message}).`
          : 'SMTP delivery failed.',
    };
  }
}

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
  username: string;
}): Promise<{subject: string; message: string; result: EmailSendResult}> {
  const displayUsername = params.username.trim() || params.name.trim();
  const safeUsername = escapeHtml(displayUsername);
  const safeName = escapeHtml(params.name);

  const workshopAbsPath = path.resolve(process.cwd(), WORKSHOP_IMAGE_REL_PATH);
  const hasWorkshopImage = fs.existsSync(workshopAbsPath);

  const subject = `Welcome to Learning HQ, ${displayUsername} — Start From Scratch Across 50 Languages`;

  const message =
    `Hello ${displayUsername},\n\n` +
    `Welcome to Learning HQ, ${params.name}! We are thrilled to have you join our engineering and coding community.\n\n` +
    `Your account is now active and every step you take—chosen language, lesson drafts, verified drills, Arena solutions, and XP—is automatically saved so you can pick up right where you left off anytime.\n\n` +
    `Here is what you can explore right away:\n` +
    `• Start Truly From Scratch: Every language begins at Lesson 01 with what the language is and your first "Hello, World!" program, then builds step by step through comments, variables, data types, arithmetic, decisions, loops, functions, and collections.\n` +
    `• 10 Free Beginner Lessons Across 50 Languages: Explore Python, JavaScript, HTML, CSS, C, C++, C#, Java, SQL, PL/SQL, ABAP, SAS, Rust, Go, Swift, Kotlin, Zig, Ladder Logic, and 32 more tracks (500 open beginner lessons total).\n` +
    `• Guided Drills & Timer-Free Coding Arena: Confirm when you are ready before any drill timer starts, then test your understanding in the Coding Arena without timer pressure.\n` +
    `• Socratic AI Study Guide: Ask questions inside any lesson or Arena challenge to understand concepts deeply without spoiling answers.\n` +
    `• Daily Streak Award Badges: Stay consistent to unlock award badges at 2 days, 1 week, 2 weeks, 3 weeks, 1 month, and 2 months.\n\n` +
    `Whenever you are ready to unlock advanced lessons (Lessons 11–14+) and Mastery Arena challenges, click "Register as Member" (₦5,000/month or ₦60,000/year via Moniepoint 7062449465 · Enenche Dominion).\n\n` +
    `Happy coding,\n` +
    `The Learning HQ Team`;

  const imageBlockHtml = hasWorkshopImage
    ? `
      <div style="margin: 18px 0 22px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <img
          src="cid:${WORKSHOP_CID}"
          alt="Learners smiling together with laptops during a Learning HQ coding workshop"
          style="display: block; width: 100%; max-width: 560px; height: auto;"
        />
      </div>
    `
    : '';

  const html = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #0f172a; line-height: 1.65; max-width: 580px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px;">
      <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #2563eb;">
        Learning HQ · Student Welcome
      </p>
      <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: #0f172a;">
        Hello ${safeUsername},
      </h2>
      ${imageBlockHtml}
      <p style="margin: 0 0 14px; font-size: 15px; color: #334155;">
        Welcome to <strong>Learning HQ</strong>, ${safeName}! Your free student workspace is live, and all your progress—chosen language, code drafts, drill checks, Arena submissions, and XP—is saved automatically to your account.
      </p>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 18px; margin: 18px 0;">
        <p style="margin: 0 0 10px; font-size: 13px; font-weight: 700; color: #0f172a;">
          Your From-Scratch Roadmap Across 50 Languages &amp; Web Technologies
        </p>
        <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #334155;">
          <li style="margin-bottom: 6px;"><strong>True Basics First:</strong> Every track opens with <em>"Hello, World!"</em>, comments, variables, data types, arithmetic, decisions, loops, and functions.</li>
          <li style="margin-bottom: 6px;"><strong>10 Free Lessons Per Track:</strong> Access 500 beginner lessons across Python, HTML, CSS, JavaScript, SQL, PL/SQL, ABAP, SAS, Ladder Logic, Rust, and 40 more languages.</li>
          <li style="margin-bottom: 6px;"><strong>Guided Drills &amp; Timer-Free Arena:</strong> Review each briefing before starting drills, and solve Arena challenges at your own pace.</li>
          <li style="margin-bottom: 6px;"><strong>AI Study Guide &amp; Streak Badges:</strong> Get guided hints without answer spoilers and unlock streak awards at 2 days, 1 week, 2 weeks, and beyond.</li>
        </ul>
      </div>
      <p style="margin: 0 0 14px; font-size: 13px; color: #475569;">
        When you are ready for intermediate and mastery tracks (Lessons 11–14+), click <strong>Register as Member</strong> inside your workspace (₦5,000/month or ₦60,000/year via Moniepoint <code>7062449465</code> · Enenche Dominion).
      </p>
      <p style="margin: 18px 0 0; font-size: 13px; color: #64748b;">
        Happy coding,<br />
        <strong style="color: #0f172a;">The Learning HQ Team</strong>
      </p>
    </div>
  `;

  const attachments: MailAttachment[] = hasWorkshopImage
    ? [
        {
          filename: 'learning-hq-workshop.webp',
          path: workshopAbsPath,
          cid: WORKSHOP_CID,
        },
      ]
    : [];

  const result = await dispatchEmail({
    to: params.to,
    subject,
    text: message,
    html,
    attachments,
  });
  return {subject, message, result};
}

export async function sendMembershipApprovedEmail(params: {
  to: string;
  name: string;
  plan: 'monthly' | 'yearly';
  amountNaira: number;
  referenceNote: string;
}): Promise<{subject: string; message: string; result: EmailSendResult}> {
  const safeName = escapeHtml(params.name);
  const safeRef = escapeHtml(params.referenceNote);
  const planLabel = params.plan === 'yearly' ? 'Yearly Membership' : 'Monthly Membership';
  const formattedAmount = `₦${params.amountNaira.toLocaleString()}`;

  const subject = 'Learning HQ Membership Approved — Full Access Unlocked';
  const message =
    `Hello ${params.name},\n\n` +
    `Great news! Your Moniepoint transfer of ${formattedAmount} (${planLabel}, Ref: ${params.referenceNote}) has been approved.\n\n` +
    `All intermediate and advanced lessons (Lessons 11–14+) and Mastery Arena challenges across all 50 languages and technologies are now unlocked on your account.\n\n` +
    `Log in to Learning HQ anytime to continue your track.\n\n` +
    `— Learning HQ Administration`;

  const html = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #0f172a; line-height: 1.6; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 14px;">
      <h2 style="color: #059669; margin-top: 0;">Membership Approved, ${safeName}!</h2>
      <p>Your Moniepoint transfer of <strong>${escapeHtml(formattedAmount)}</strong> for the <strong>${escapeHtml(planLabel)}</strong> (Reference: <code>${safeRef}</code>) has been verified and approved.</p>
      <p>All advanced lessons and Mastery Coding Arena challenges across all <strong>50 programming &amp; web languages</strong> are now unlocked on your account.</p>
      <p style="color: #475569; font-size: 13px; margin-bottom: 0;">— Learning HQ Administration</p>
    </div>
  `;

  const result = await dispatchEmail({to: params.to, subject, text: message, html});
  return {subject, message, result};
}

export async function sendPasswordResetOtpEmail(params: {
  to: string;
  name: string;
  username: string;
  otp: string;
  expiresMinutes: number;
}): Promise<{subject: string; message: string; result: EmailSendResult}> {
  const displayName = params.username.trim() || params.name.trim() || 'Student';
  const safeDisplay = escapeHtml(displayName);
  const safeOtp = escapeHtml(params.otp);

  const subject = `${params.otp} is your Learning HQ password reset OTP`;
  const message =
    `Hello ${displayName},\n\n` +
    `We received a request to reset your Learning HQ account password.\n\n` +
    `Copy this 6-digit OTP code to verify your email before changing your password:\n\n` +
    `    ${params.otp}\n\n` +
    `This code expires in ${params.expiresMinutes} minutes. If you did not request a password reset, you can safely ignore this email.\n\n` +
    `— Learning HQ Security`;

  const html = `
    <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #0f172a; line-height: 1.65; max-width: 540px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px;">
      <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #2563eb;">
        Learning HQ · Password Reset Verification
      </p>
      <h2 style="margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #0f172a;">
        Hello ${safeDisplay},
      </h2>
      <p style="margin: 0 0 16px; font-size: 14px; color: #334155;">
        Copy the 6-digit verification OTP below and paste it into Learning HQ to verify your email address before setting a new password:
      </p>
      <div style="margin: 18px 0; padding: 16px; text-align: center; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px;">
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 30px; font-weight: 700; letter-spacing: 0.22em; color: #0f172a;">
          ${safeOtp}
        </span>
      </div>
      <p style="margin: 0 0 8px; font-size: 13px; color: #475569;">
        This OTP expires in <strong>${params.expiresMinutes} minutes</strong> and can only be used once.
      </p>
      <p style="margin: 14px 0 0; font-size: 12px; color: #64748b;">
        If you did not ask to reset your password, you can safely ignore this email.
      </p>
    </div>
  `;

  const result = await dispatchEmail({to: params.to, subject, text: message, html});
  return {subject, message, result};
}

