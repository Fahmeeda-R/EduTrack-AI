import React, { useState } from 'react';
import { useEduTrack } from '../context/EduTrackContext.tsx';
import { BRAND_LOGO_URL } from '../data/previewSeed.ts';
import type { UserRole } from '../types/edutrack.ts';

export const LoginView: React.FC = () => {
  const { enterPreviewMode, showToast } = useEduTrack();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('student');
  const [regDept, setRegDept] = useState('Computer Science');
  const [regYear, setRegYear] = useState('Year 3 (Junior)');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const strengthLevel =
    !regPassword ? 0 : regPassword.length < 6 ? 1 : regPassword.length < 10 ? 2 : 3;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      showToast('Please provide a valid institutional email format.', 'error');
      return;
    }
    enterPreviewMode(role, {
      email,
      displayName:
        role === 'faculty'
          ? 'Prof. Marcus Vance'
          : email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    });
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirm) {
      showToast('Password confirmation does not match.', 'error');
      return;
    }
    enterPreviewMode(regRole, {
      displayName: regName || 'Elena Rostova',
      email: regEmail || 'elena.rostova@university.edu',
      department: regDept,
      standing: regYear,
      role: regRole,
    });
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-md mx-auto w-full">
      {/* Brand Header */}
      <div className="w-full flex flex-col items-center text-center mb-6">
        <div className="w-20 h-20 rounded-xl bg-surface-container flex items-center justify-center p-2 mb-3 shadow-sm overflow-hidden">
          <img
            alt="EduTrack AI Logo"
            src={BRAND_LOGO_URL}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed/50 text-on-secondary-fixed-variant text-[11px] font-semibold mb-1.5 tracking-wider uppercase">
          <span className="material-symbols-outlined text-[14px] material-symbols-filled">
            auto_awesome
          </span>
          Academic Intelligence System
        </div>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">
          EduTrack <span className="text-primary">AI</span>
        </h1>
        <p className="text-xs text-on-surface-variant max-w-[280px] mt-1 leading-snug">
          Your Academics, Organized. Your Learning, Empowered.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/20">
        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-surface-container p-1 rounded-lg mb-4">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`py-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              tab === 'login'
                ? 'text-on-primary bg-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">lock_open</span>
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`py-2.5 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              tab === 'register'
                ? 'text-on-primary bg-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            <span>Register</span>
          </button>
        </div>

        {tab === 'login' ? (
          <div className="flex flex-col gap-4">
            {/* Access Scope */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Access Scope
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-2 px-3 rounded-lg text-left flex items-center gap-2 text-xs font-semibold transition-all ${
                    role === 'student'
                      ? 'bg-secondary-fixed/60 text-on-secondary-fixed-variant'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full inline-block ${
                      role === 'student' ? 'bg-primary' : 'bg-outline-variant'
                    }`}
                  />
                  <span>Student Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('faculty')}
                  className={`py-2 px-3 rounded-lg text-left flex items-center gap-2 text-xs font-semibold transition-all ${
                    role === 'faculty'
                      ? 'bg-secondary-fixed/60 text-on-secondary-fixed-variant'
                      : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full inline-block ${
                      role === 'faculty' ? 'bg-primary' : 'bg-outline-variant'
                    }`}
                  />
                  <span>Faculty / Staff</span>
                </button>
              </div>
            </div>

            {/* Instant Demo Access */}
            <div className="bg-surface-container-low p-2.5 rounded-lg flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-tertiary">bolt</span>
                Instant Access:
              </span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => enterPreviewMode('student')}
                  className="px-2.5 py-1 rounded bg-surface-container-lowest text-primary hover:bg-primary hover:text-on-primary text-[11px] font-semibold transition-colors shadow-sm"
                >
                  Student Demo
                </button>
                <button
                  type="button"
                  onClick={() => enterPreviewMode('faculty')}
                  className="px-2.5 py-1 rounded bg-surface-container-lowest text-tertiary hover:bg-tertiary hover:text-on-tertiary text-[11px] font-semibold transition-colors shadow-sm"
                >
                  Faculty Demo
                </button>
              </div>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label htmlFor="login-email" className="text-xs font-semibold text-on-surface">
                  Institutional Email
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
                    mail
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="netid@university.edu"
                    className="w-full h-11 pl-10 pr-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-xs font-semibold text-on-surface">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      showToast('Reset link dispatched to registered campus email', 'info')
                    }
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[20px] pointer-events-none">
                    lock
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full h-11 pl-10 pr-10 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-sm outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 text-outline hover:text-on-surface p-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-11 mt-1 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <span>Sign In to EduTrack</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </form>
          </div>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface">Full Academic Name</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Elena Rostova"
                className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface">
                Institutional Email (.edu)
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="username@university.edu"
                className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface">Department</label>
                <select
                  value={regDept}
                  onChange={(e) => setRegDept(e.target.value)}
                  className="w-full h-11 px-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm outline-none"
                >
                  <option value="Computer Science">Computer Sci</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Business Administration">Business Adm</option>
                  <option value="Humanities">Humanities</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-on-surface">Standing</label>
                <select
                  value={regYear}
                  onChange={(e) => setRegYear(e.target.value)}
                  className="w-full h-11 px-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm outline-none"
                >
                  <option value="Year 1 (Freshman)">Year 1</option>
                  <option value="Year 2 (Sophomore)">Year 2</option>
                  <option value="Year 3 (Junior)">Year 3</option>
                  <option value="Year 4 (Senior)">Year 4</option>
                  <option value="Graduate / PhD">Graduate</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface">Academic Designation</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                className="w-full h-11 px-2.5 rounded-lg bg-surface-container-low text-on-surface text-sm outline-none"
              >
                <option value="student">Student (Standard Learner Portal)</option>
                <option value="faculty">Faculty Member (Course Manager)</option>
                <option value="staff">Teaching Assistant / Staff</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-on-surface">Create Password</label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-sm outline-none"
              />
              <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden flex gap-1">
                <div
                  className={`h-full flex-1 transition-all ${
                    strengthLevel >= 1
                      ? strengthLevel === 1
                        ? 'bg-error'
                        : strengthLevel === 2
                        ? 'bg-secondary'
                        : 'bg-primary'
                      : 'bg-surface-container-highest'
                  }`}
                />
                <div
                  className={`h-full flex-1 transition-all ${
                    strengthLevel >= 2
                      ? strengthLevel === 2
                        ? 'bg-secondary'
                        : 'bg-primary'
                      : 'bg-surface-container-highest'
                  }`}
                />
                <div
                  className={`h-full flex-1 transition-all ${
                    strengthLevel >= 3 ? 'bg-primary' : 'bg-surface-container-highest'
                  }`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-on-surface">Confirm Password</label>
              <input
                type="password"
                required
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="w-full h-11 px-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline text-sm outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 mt-1 rounded-lg bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <span>Create Academic Account</span>
              <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
            </button>
          </form>
        )}
      </div>

      {/* Support & Helpdesk Quick Access */}
      <div className="w-full mt-4 p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[20px]">support_agent</span>
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-on-surface">Student Support &amp; AI Chat</p>
            <p className="text-[11px] text-on-surface-variant">Fees, courses, admissions, FAQs</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            enterPreviewMode('student');
            // navigate to support-chatbot via window hash
            if (typeof window !== 'undefined') {
              window.location.hash = 'support';
            }
          }}
          className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-bold hover:opacity-90 transition-opacity shadow-xs flex-shrink-0 cursor-pointer"
        >
          Open Support
        </button>
      </div>

      {/* FERPA Compliance Footnote */}
      <div className="mt-5 flex flex-col items-center gap-2 text-center text-on-surface-variant">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant font-mono text-[11px]">
          <span className="material-symbols-outlined text-tertiary text-[16px]">verified</span>
          256-bit SSL Academic Encryption · FERPA Compliant
        </div>
      </div>
    </div>
  );
};
