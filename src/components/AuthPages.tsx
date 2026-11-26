import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Shield,
  UserPlus,
} from 'lucide-react';
import {motion} from 'motion/react';
import {useState} from 'react';
import type {PublicUser} from '../types/learning';
import {ThemeToggle} from './ThemeToggle';

interface AuthPagesProps {
  mode: 'signup' | 'login';
  isDark: boolean;
  onToggleDark: () => void;
  onSwitchMode: (mode: 'signup' | 'login') => void;
  onBackToAbout: () => void;
  onAuthSuccess: (token: string, user: PublicUser) => void;
}

export function AuthPages({
  mode,
  isDark,
  onToggleDark,
  onSwitchMode,
  onBackToAbout,
  onAuthSuccess,
}: AuthPagesProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'otp' | 'reset'>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [accountNotFoundForReset, setAccountNotFoundForReset] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name, email, password}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not create account.');
        return;
      }
      onAuthSuccess(data.token, data.user);
    } catch {
      setError('Network error while creating your account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          asAdmin: isAdminLogin,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials.');
        return;
      }
      onAuthSuccess(data.token, data.user);
    } catch {
      setError('Network error while signing in.');
    } finally {
      setSubmitting(false);
    }
  };

  const openForgotPassword = () => {
    setError(null);
    setNotice(null);
    setIsAdminLogin(false);
    setIsForgotPassword(true);
    setForgotStep('request');
    setResetEmail(identifier.includes('@') ? identifier.trim() : '');
    setOtpCode('');
    setResetToken('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPassword(false);
    setAccountNotFoundForReset(false);
  };

  const closeForgotPassword = (keepNotice = false) => {
    setIsForgotPassword(false);
    setForgotStep('request');
    setOtpCode('');
    setResetToken('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPassword(false);
    setAccountNotFoundForReset(false);
    setError(null);
    if (!keepNotice) {
      setNotice(null);
    }
  };

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setNotice(null);
    setAccountNotFoundForReset(false);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password/request', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email: resetEmail.trim()}),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 404 || data.code === 'ACCOUNT_NOT_FOUND') {
          setAccountNotFoundForReset(true);
        }
        setError(data.error || 'Could not send OTP to your email.');
        return;
      }
      setForgotStep('otp');
      setNotice(
        data.message ||
          'Go to your email inbox, copy the 6-digit OTP we sent, and enter it below to verify your email.'
      );
    } catch {
      setError('Network error while sending the OTP email.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email: resetEmail.trim(),
          otp: otpCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid or expired OTP.');
        return;
      }
      setResetToken(data.resetToken);
      setForgotStep('reset');
      setNotice('Email verified! Enter your new password below.');
    } catch {
      setError('Network error while verifying your OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match. Please enter the same password twice.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email: resetEmail.trim(),
          resetToken,
          newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not change your password.');
        return;
      }
      setIdentifier(resetEmail.trim());
      setPassword('');
      setNotice(
        data.message || 'Password updated! You can now log in with your new password.'
      );
      closeForgotPassword(true);
    } catch {
      setError('Network error while saving your new password.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAdminMode = () => {
    const next = !isAdminLogin;
    setIsAdminLogin(next);
    setIsForgotPassword(false);
    setError(null);
    setNotice(null);
    setShowPassword(false);
    if (next) {
      setIdentifier('admin');
      setPassword('');
    } else {
      setIdentifier('');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fb] text-slate-900 dark:bg-[#080c14] dark:text-slate-100 flex flex-col transition-colors">
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0b101b]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <button
            type="button"
            onClick={onBackToAbout}
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            Learning HQ
          </button>

          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle isDark={isDark} onToggle={onToggleDark} />
            <button
              type="button"
              onClick={onBackToAbout}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to About
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.div
          key={`${mode}-${isAdminLogin}-${isForgotPassword}-${forgotStep}`}
          initial={{opacity: 0, y: 12}}
          animate={{opacity: 1, y: 0}}
          transition={{duration: 0.25, ease: [0.16, 1, 0.3, 1]}}
          className="studio-surface w-full max-w-md rounded-2xl border p-8"
        >
          {mode === 'signup' ? (
            <>
              <div className="flex items-center gap-2.5 text-blue-600 dark:text-blue-400">
                <UserPlus className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Free Student Account
                </span>
              </div>
              <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Sign up for free
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                Unlock the first 10 from-scratch lessons, exercises, drills, and starter arenas
                across all 50 programming &amp; web languages.
              </p>

              <form onSubmit={handleSignup} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="signup-name"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Full Name
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Amaka Nwosu"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Email Address
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Password
                  </label>
                  <div className="relative mt-1.5">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 4 characters"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 pl-3.5 pr-20 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      {showPassword ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          <span>Show</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting ? 'Creating account...' : 'Create Free Account'}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-5 flex flex-col gap-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setNotice(null);
                    setIsAdminLogin(false);
                    setIsForgotPassword(false);
                    setShowPassword(false);
                    onSwitchMode('login');
                  }}
                  className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Already have an account? Log in
                </button>
              </div>
            </>
          ) : isForgotPassword ? (
            <>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <KeyRound className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Password Recovery · Step{' '}
                  {forgotStep === 'request' ? '1 of 3' : forgotStep === 'otp' ? '2 of 3' : '3 of 3'}
                </span>
              </div>

              <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {forgotStep === 'request'
                  ? 'Forgot your password?'
                  : forgotStep === 'otp'
                    ? 'Verify your email with OTP'
                    : 'Set a new password'}
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                {forgotStep === 'request'
                  ? 'Enter your account email address and we will send a 6-digit OTP to verify your email.'
                  : forgotStep === 'otp'
                    ? `Go to your email (${resetEmail}), copy the 6-digit OTP we sent you, and paste it below before changing your password.`
                    : `Your email (${resetEmail}) is verified. Choose a new password below.`}
              </p>

              {notice && (
                <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/50 px-3.5 py-3 text-xs font-medium text-blue-800 dark:text-blue-200">
                  {forgotStep === 'reset' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  ) : (
                    <Mail className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 mt-0.5" />
                  )}
                  <span>{notice}</span>
                </div>
              )}

              {forgotStep === 'request' && (
                <form onSubmit={handleRequestOtp} className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Registered Email Address
                    </label>
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        if (accountNotFoundForReset) {
                          setAccountNotFoundForReset(false);
                          setError(null);
                        }
                      }}
                      placeholder="you@example.com"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                    />
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300 space-y-2"
                    >
                      <p>{error}</p>
                      {accountNotFoundForReset && (
                        <button
                          type="button"
                          onClick={() => {
                            setEmail(resetEmail.trim());
                            closeForgotPassword(false);
                            onSwitchMode('signup');
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          Create Free Account
                        </button>
                      )}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {submitting ? 'Sending OTP...' : 'Send OTP to Email'}
                  </button>
                </form>
              )}

              {forgotStep === 'otp' && (
                <form onSubmit={handleVerifyOtp} className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="forgot-otp"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      6-Digit OTP From Your Email
                    </label>
                    <input
                      id="forgot-otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      required
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-center font-mono text-lg font-bold tracking-[0.3em] text-slate-900 dark:text-slate-100 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                    />
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300"
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || otpCode.length !== 6}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {submitting ? 'Verifying OTP...' : 'Verify Email & Continue'}
                  </button>

                  <div className="flex items-center justify-between text-xs">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleRequestOtp()}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 cursor-pointer"
                    >
                      Resend OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep('request');
                        setOtpCode('');
                        setError(null);
                        setNotice(null);
                      }}
                      className="font-medium text-slate-600 dark:text-slate-300 hover:underline cursor-pointer"
                    >
                      Change email
                    </button>
                  </div>
                </form>
              )}

              {forgotStep === 'reset' && (
                <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
                  <div>
                    <label
                      htmlFor="reset-new-password"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      New Password
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        id="reset-new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        minLength={4}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 4 characters"
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 pl-3.5 pr-20 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {showNewPassword ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5" />
                            <span>Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            <span>Show</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reset-confirm-password"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Confirm New Password
                    </label>
                    <input
                      id="reset-confirm-password"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                    />
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300"
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    {submitting ? 'Saving password...' : 'Change Password'}
                  </button>
                </form>
              )}

              <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-5 text-center">
                <button
                  type="button"
                  onClick={() => closeForgotPassword(false)}
                  className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Back to Log in
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  {isAdminLogin ? (
                    <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <Lock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  )}
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {isAdminLogin ? 'Administrator Sign In' : 'Student Sign In'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={toggleAdminMode}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isAdminLogin
                      ? 'border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700'
                      : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-950'
                  }`}
                >
                  {isAdminLogin ? 'Student Log in' : 'Login as Admin'}
                </button>
              </div>

              <h1 className="mt-4 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isAdminLogin ? 'Admin Dashboard Login' : 'Log in to Learning HQ'}
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                {isAdminLogin
                  ? 'Sign in with your administrator username and password to manage members, payments, and curriculum.'
                  : 'Resume your lessons, drills, and coding arena tracks.'}
              </p>

              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="login-identifier"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    {isAdminLogin ? 'Admin Username' : 'Email or Username'}
                  </label>
                  <input
                    id="login-identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={isAdminLogin ? 'admin' : 'you@example.com'}
                    className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
                    >
                      Password
                    </label>
                    {!isAdminLogin && (
                      <button
                        type="button"
                        onClick={openForgotPassword}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative mt-1.5">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isAdminLogin ? 'admin' : 'Enter your password'}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 py-2.5 pl-3.5 pr-20 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      {showPassword ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          <span>Hide</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          <span>Show</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {notice && (
                  <p className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    {notice}
                  </p>
                )}

                {error && (
                  <p
                    role="alert"
                    className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300"
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-slate-900 dark:bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:hover:bg-blue-500 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {submitting
                    ? 'Signing in...'
                    : isAdminLogin
                      ? 'Sign in to Admin Dashboard'
                      : 'Log in'}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-5 flex flex-col gap-3 text-center">
                {!isAdminLogin && (
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setShowPassword(false);
                      onSwitchMode('signup');
                    }}
                    className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                  >
                    Don&apos;t have an account? Sign up for free
                  </button>
                )}
                {isAdminLogin && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Default administrator credentials: username{' '}
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      admin
                    </span>
                    , password{' '}
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      admin
                    </span>
                    .
                  </p>
                )}
              </div>
            </>
          )}
        </motion.div>
      </main>
    </div>
  );
}
