import {useCallback, useEffect, useState} from 'react';
import {AboutPage} from './components/AboutPage';
import {AdminDashboard} from './components/AdminDashboard';
import {AuthPages} from './components/AuthPages';
import {LanguageOnboarding} from './components/LanguageOnboarding';
import {LearningWorkspace} from './components/LearningWorkspace';
import {MembershipModal} from './components/MembershipModal';
import type {CurriculumMeta, PaymentRequest, PublicUser} from './types/learning';

type ActiveRoute = 'about' | 'signup' | 'login' | 'workspace' | 'admin';

function getInitialDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const saved = window.localStorage.getItem('learninghq_theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  } catch {
    return false;
  }
}

export default function App() {
  const [route, setRoute] = useState<ActiveRoute>('about');
  const [isDark, setIsDark] = useState<boolean>(getInitialDarkMode);
  const [token, setToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [latestRequest, setLatestRequest] = useState<PaymentRequest | null>(null);
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [curriculumMeta, setCurriculumMeta] = useState<CurriculumMeta>({
    lessonLockOverrides: {},
    customLessons: {},
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      window.localStorage.setItem('learninghq_theme', isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage failures
    }
  }, [isDark]);

  const toggleDarkMode = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  const loadCurriculumMeta = useCallback(async () => {
    try {
      const res = await fetch('/api/curriculum/meta');
      if (res.ok) {
        const data = await res.json();
        setCurriculumMeta({
          lessonLockOverrides: data.lessonLockOverrides ?? {},
          customLessons: data.customLessons ?? {},
        });
      }
    } catch {
      // Keep default curriculum structure
    }
  }, []);

  useEffect(() => {
    loadCurriculumMeta();
  }, [loadCurriculumMeta]);

  const refreshProfile = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: {Authorization: `Bearer ${authToken}`},
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setLatestRequest(data.latestRequest ?? null);
      }
    } catch {
      // Non-fatal
    }
  }, []);

  const handleAuthSuccess = async (newToken: string, user: PublicUser) => {
    setToken(newToken);
    setCurrentUser(user);
    await refreshProfile(newToken);
    if (user.role === 'admin') {
      setRoute('admin');
    } else {
      setRoute('workspace');
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {Authorization: `Bearer ${token}`},
        });
      } catch {
        // Ignore network errors during logout
      }
    }
    setToken(null);
    setCurrentUser(null);
    setLatestRequest(null);
    setMembershipOpen(false);
    setRoute('about');
  };

  const needsLanguageOnboarding =
    route === 'workspace' &&
    Boolean(token && currentUser) &&
    currentUser?.role === 'student' &&
    !currentUser?.preferredLanguageId;

  return (
    <>
      {route === 'about' && (
        <AboutPage
          currentUser={currentUser}
          isDark={isDark}
          onToggleDark={toggleDarkMode}
          onGoToSignup={() => setRoute('signup')}
          onGoToLogin={() => setRoute('login')}
          onGoToWorkspace={() =>
            setRoute(currentUser?.role === 'admin' ? 'admin' : 'workspace')
          }
        />
      )}

      {(route === 'signup' || route === 'login') && (
        <AuthPages
          mode={route}
          isDark={isDark}
          onToggleDark={toggleDarkMode}
          onSwitchMode={(next) => setRoute(next)}
          onBackToAbout={() => setRoute('about')}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      {needsLanguageOnboarding && token && currentUser && (
        <LanguageOnboarding
          token={token}
          user={currentUser}
          isDark={isDark}
          onToggleDark={toggleDarkMode}
          onLanguageChosen={(updated) => setCurrentUser(updated)}
          onLogout={handleLogout}
        />
      )}

      {route === 'workspace' && !needsLanguageOnboarding && token && currentUser && (
        <LearningWorkspace
          token={token}
          user={currentUser}
          latestRequest={latestRequest}
          curriculumMeta={curriculumMeta}
          isDark={isDark}
          onToggleDark={toggleDarkMode}
          onUserUpdated={(updated) => setCurrentUser(updated)}
          onOpenMembership={() => setMembershipOpen(true)}
          onOpenAdminDashboard={() => setRoute('admin')}
          onBackToAbout={() => setRoute('about')}
          onLogout={handleLogout}
        />
      )}

      {route === 'admin' && token && currentUser?.role === 'admin' && (
        <AdminDashboard
          token={token}
          isDark={isDark}
          onToggleDark={toggleDarkMode}
          onOpenStudentWorkspace={() => setRoute('workspace')}
          onCurriculumUpdated={loadCurriculumMeta}
          onLogout={handleLogout}
        />
      )}

      {token && currentUser && (
        <MembershipModal
          isOpen={membershipOpen}
          token={token}
          defaultSenderName={currentUser.name}
          latestRequest={latestRequest}
          onClose={() => setMembershipOpen(false)}
          onSubmitted={(req) => {
            setLatestRequest(req);
            setMembershipOpen(false);
          }}
        />
      )}
    </>
  );
}
