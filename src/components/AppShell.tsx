import React, { useState } from 'react';
import { useEduTrack } from '../context/EduTrackContext.tsx';
import { BRAND_LOGO_URL, STUDENT_AVATAR_URL } from '../data/previewSeed.ts';
import type { ScreenId } from '../types/edutrack.ts';

const SCREEN_TITLES: Record<ScreenId, string> = {
  login: 'Authentication',
  dashboard: 'Dashboard',
  assignments: 'Assignment Hub',
  submission: 'Submission & AI Rubric',
  calendar: 'Academic Calendar',
  'ai-assistant': 'Tutor AI',
  'my-documents': 'My Documents',
  announcements: 'Announcements',
  'ai-study-planner': 'AI Study Planner',
  'academic-management': 'Academic Management',
  gradebook: 'Gradebook Analytics',
  'assignment-publisher': 'Assignment Publisher',
  'announcements-manager': 'Announcements Manager',
  'account-settings': 'Account Settings',
  'support-chatbot': 'Student Support Chat',
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    activeScreen,
    setActiveScreen,
    userProfile,
    darkMode,
    toggleDarkMode,
    handleSignOut,
    announcements,
    assignments,
    toast,
  } = useEduTrack();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const isFaculty = userProfile.role === 'faculty' || userProfile.role === 'staff';

  const urgentCount = assignments.filter(
    (a) => a.priority === 'Urgent' && a.status !== 'graded' && a.status !== 'submitted'
  ).length;
  const unreadNotifCount = Math.max(1, urgentCount + Math.min(2, announcements.length));

  const navigate = (screen: ScreenId) => {
    setActiveScreen(screen);
    setDrawerOpen(false);
    setNotifOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const desktopNavItems: Array<[ScreenId, string]> = [
    ['dashboard', 'Dashboard'],
    ['assignments', 'Assignments'],
    ['calendar', 'Calendar'],
    ['ai-assistant', 'Tutor AI'],
    ['ai-study-planner', 'Study Planner'],
    ['support-chatbot', 'Support'],
    ...(isFaculty ? ([['academic-management', 'Faculty']] as Array<[ScreenId, string]>) : []),
  ];

  if (activeScreen === 'login') {
    return (
      <div className="min-h-screen bg-surface text-on-surface flex flex-col">
        {children}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-full bg-inverse-surface text-inverse-on-surface text-xs font-semibold shadow-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">
              {toast.tone === 'error' ? 'error' : toast.tone === 'success' ? 'check_circle' : 'info'}
            </span>
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col relative">
      {/* Top Header */}
      <header className="fixed top-0 inset-x-0 z-40 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/20">
        <div className="max-w-6xl mx-auto h-16 px-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('dashboard')}
            className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer"
          >
            <img
              alt="EduTrack AI Logo"
              src={BRAND_LOGO_URL}
              referrerPolicy="no-referrer"
              className="h-8 w-8 object-contain flex-shrink-0 rounded-md"
            />
            <div className="flex flex-col truncate">
              <span className="text-base font-bold text-on-surface tracking-tight leading-none whitespace-nowrap">
                EduTrack AI
              </span>
              <span className="text-[11px] font-semibold text-on-surface-variant truncate mt-0.5">
                {SCREEN_TITLES[activeScreen]}
              </span>
            </div>
          </button>

          {/* Desktop Quick Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {desktopNavItems.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeScreen === id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Header Controls */}
          <div className="flex items-center gap-1 flex-shrink-0 relative">
            <button
              aria-label="Notifications"
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-on-primary text-[10px] leading-tight rounded-full flex items-center justify-center font-bold">
                {unreadNotifCount}
              </span>
            </button>
            <button
              aria-label="Toggle Theme"
              type="button"
              onClick={toggleDarkMode}
              className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                {darkMode ? 'dark_mode' : 'light_mode'}
              </span>
            </button>
            <button
              aria-label="Open Navigation Drawer"
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1 pl-1 pr-1.5 py-1 rounded-full hover:bg-surface-container transition-colors ml-0.5"
            >
              <img
                alt={userProfile.displayName}
                src={userProfile.avatarUrl || STUDENT_AVATAR_URL}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover shadow-sm"
              />
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                keyboard_arrow_down
              </span>
            </button>

            {/* Notification Popover */}
            {notifOpen && (
              <div className="absolute right-0 top-14 w-80 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/30 p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <span className="text-sm font-bold text-on-surface">Academic Alerts</span>
                  <button
                    type="button"
                    onClick={() => navigate('announcements')}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    View all
                  </button>
                </div>
                <div className="divide-y divide-outline-variant/20 mt-1 max-h-72 overflow-y-auto">
                  {assignments
                    .filter((a) => a.status !== 'graded' && a.status !== 'submitted')
                    .slice(0, 2)
                    .map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => {
                          setNotifOpen(false);
                          setActiveScreen('assignments');
                        }}
                        className="w-full text-left py-2.5 px-1.5 hover:bg-surface-container-low rounded-lg transition-colors"
                      >
                        <p className="text-xs font-semibold text-primary">{a.course} · {a.dueLabel}</p>
                        <p className="text-xs text-on-surface font-medium truncate mt-0.5">{a.title}</p>
                      </button>
                    ))}
                  {announcements.slice(0, 2).map((ann) => (
                    <button
                      key={ann.id}
                      type="button"
                      onClick={() => navigate('announcements')}
                      className="w-full text-left py-2.5 px-1.5 hover:bg-surface-container-low rounded-lg transition-colors"
                    >
                      <p className="text-xs font-semibold text-secondary">{ann.author}</p>
                      <p className="text-xs text-on-surface font-medium truncate mt-0.5">{ann.title}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Slide-over Navigation Drawer */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-[86%] max-w-sm bg-surface-container-lowest shadow-2xl transition-transform duration-300 ease-out flex flex-col overflow-hidden ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between bg-surface/60 backdrop-blur-md border-b border-outline-variant/20">
          <div className="flex items-center gap-2">
            <img
              alt="EduTrack AI Logo"
              src={BRAND_LOGO_URL}
              referrerPolicy="no-referrer"
              className="h-6 w-6 object-contain rounded"
            />
            <span className="text-base font-bold text-on-surface">EduTrack Navigation</span>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="w-11 h-11 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
          {/* Profile Summary */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low">
            <img
              alt={userProfile.displayName}
              src={userProfile.avatarUrl || STUDENT_AVATAR_URL}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-on-surface truncate">{userProfile.displayName}</p>
              <p className="text-xs font-medium text-secondary truncate">
                {userProfile.department} · {userProfile.standing}
              </p>
            </div>
          </div>

          {/* Student Hub Links */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-outline px-2 mb-1">
              Student Hub
            </p>
            <div className="space-y-0.5">
              {(
                [
                  ['dashboard', 'space_dashboard', 'Dashboard'],
                  ['assignments', 'assignment_turned_in', 'Assignments'],
                  ['calendar', 'calendar_month', 'Academic Calendar'],
                  ['announcements', 'campaign', 'Announcements'],
                  ['ai-assistant', 'auto_awesome', 'AI Academic Assistant'],
                  ['my-documents', 'folder_shared', 'My Documents'],
                  ['ai-study-planner', 'tune', 'AI Study Planner'],
                  ['support-chatbot', 'support_agent', 'Student Support Chat'],
                ] as Array<[ScreenId, string, string]>
              ).map(([id, icon, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => navigate(id)}
                  className={`w-full flex items-center gap-3 px-2.5 h-11 rounded-lg text-sm font-semibold transition-colors ${
                    activeScreen === id
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Faculty & Operations (Faculty/Staff Login Only) */}
          {isFaculty && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-outline px-2 mb-1">
                Faculty &amp; Operations
              </p>
              <div className="space-y-0.5">
                {(
                  [
                    ['academic-management', 'school', 'Academic Management'],
                    ['gradebook', 'bar_chart', 'Gradebook Analytics'],
                    ['assignment-publisher', 'post_add', 'Assignment Publisher'],
                    ['announcements-manager', 'broadcast_on_personal', 'Announcements Manager'],
                  ] as Array<[ScreenId, string, string]>
                ).map(([id, icon, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => navigate(id)}
                    className={`w-full flex items-center gap-3 px-2.5 h-11 rounded-lg text-sm font-semibold transition-colors ${
                      activeScreen === id
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Account & System */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-outline px-2 mb-1">
              Account & System
            </p>
            <div className="space-y-0.5">
              <button
                type="button"
                onClick={() => navigate('account-settings')}
                className={`w-full flex items-center gap-3 px-2.5 h-11 rounded-lg text-sm font-semibold transition-colors ${
                  activeScreen === 'account-settings'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                <span>Account Settings</span>
              </button>

              <div className="flex items-center justify-between px-2.5 h-11 text-on-surface-variant text-sm font-semibold">
                <span className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[20px]">dark_mode</span>
                  <span>Dark Theme</span>
                </span>
                <button
                  type="button"
                  aria-label="Toggle Dark Theme"
                  onClick={toggleDarkMode}
                  className={`w-11 h-6 rounded-full relative p-0.5 transition-colors ${
                    darkMode ? 'bg-primary' : 'bg-surface-container-highest'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-surface-container-lowest block shadow-sm transition-transform ${
                      darkMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-2.5 h-11 rounded-lg text-error hover:bg-error-container/30 text-sm font-semibold mt-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">logout</span>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full pt-16 pb-24 lg:pb-10">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6">{children}</div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface/95 backdrop-blur-xl border-t border-outline-variant/20 shadow-[0_-1px_12px_rgba(56,42,39,0.06)]">
        <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
          {(
            [
              ['dashboard', 'space_dashboard', 'Dashboard'],
              ['assignments', 'fact_check', 'Tasks'],
              ['calendar', 'calendar_today', 'Calendar'],
              ['ai-assistant', 'smart_toy', 'Tutor AI'],
              ['support-chatbot', 'support_agent', 'Support'],
            ] as Array<[ScreenId, string, string]>
          ).map(([id, icon, label]) => {
            const active = activeScreen === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => navigate(id)}
                className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 rounded-lg transition-colors ${
                  active ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[22px] ${
                    active ? 'material-symbols-filled' : ''
                  }`}
                >
                  {icon}
                </span>
                <span className="text-[11px] font-semibold">{label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 rounded-lg text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">menu</span>
            <span className="text-[11px] font-semibold">Menu</span>
          </button>
        </div>
      </nav>

      {/* Global Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2.5 rounded-full bg-inverse-surface text-inverse-on-surface text-xs font-semibold shadow-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">
            {toast.tone === 'error' ? 'error' : toast.tone === 'success' ? 'check_circle' : 'info'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
