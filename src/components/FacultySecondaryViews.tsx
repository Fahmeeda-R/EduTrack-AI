import React, { useState } from 'react';
import { useEduTrack } from '../context/EduTrackContext.tsx';

export const GradebookView: React.FC = () => {
  const { assignments, updateAssignment, setActiveScreen, showToast } = useEduTrack();

  const graded = assignments.filter((a) => a.gradeScore != null);
  const avg =
    graded.length > 0
      ? (graded.reduce((sum, a) => sum + (a.gradeScore || 0), 0) / graded.length).toFixed(1)
      : '94.2';

  return (
    <div className="py-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Gradebook Analytics</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Course-weighted GPA telemetry &amp; cohort grade distribution
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveScreen('academic-management')}
          className="px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface"
        >
          Back to Faculty Portal
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
          <p className="text-xs text-on-surface-variant">Weighted Average</p>
          <p className="text-3xl font-bold text-primary mt-1">{avg}%</p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
          <p className="text-xs text-on-surface-variant">Graded Deliverables</p>
          <p className="text-3xl font-bold text-on-surface mt-1">
            {graded.length} / {assignments.length}
          </p>
        </div>
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/20">
          <p className="text-xs text-on-surface-variant">Projected Standing</p>
          <p className="text-3xl font-bold text-secondary mt-1">3.92 GPA</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/25 overflow-hidden">
        <div className="p-4 border-b border-outline-variant/20 font-bold text-sm text-on-surface">
          Coursework Score Ledger
        </div>
        <div className="divide-y divide-outline-variant/15">
          {assignments.map((item) => (
            <div
              key={item.id}
              className="p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-surface-container-low/50"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-on-surface truncate">{item.title}</p>
                <p className="text-xs text-on-surface-variant">
                  {item.course} · Weight {item.weight}% · {item.dueLabel}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-surface-container text-xs font-bold text-on-surface">
                  {item.gradeScore != null ? `${item.gradeScore}% (${item.gradeLetter || 'A'})` : 'Pending'}
                </span>
                {item.gradeScore == null && (
                  <button
                    type="button"
                    onClick={async () => {
                      await updateAssignment(item.id, {
                        status: 'graded',
                        progress: 100,
                        gradeScore: 95,
                        gradeLetter: 'A',
                      });
                      showToast(`Recorded 95% (A) for ${item.course}`, 'success');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold"
                  >
                    Grade 95%
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AssignmentPublisherView: React.FC = () => {
  const { createAssignment, setActiveScreen } = useEduTrack();
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('Operating Systems');
  const [dueDate, setDueDate] = useState('2024-11-05');
  const [priority, setPriority] = useState('High');
  const [weight, setWeight] = useState('15');
  const [guidelines, setGuidelines] = useState('');

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createAssignment({
      title: title.trim(),
      course,
      dueDate,
      dueLabel: dueDate,
      priority,
      weight: Number(weight) || 15,
      status: 'not_started',
      guidelines: guidelines.trim() || 'Follow syllabus grading rubric.',
    });
    setActiveScreen('assignments');
  };

  return (
    <div className="py-5 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Assignment Publisher</h1>
        <p className="text-xs sm:text-sm text-on-surface-variant">
          Create and publish new coursework tasks directly to the student workspace
        </p>
      </div>

      <form
        onSubmit={handlePublish}
        className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/25 shadow-sm space-y-4"
      >
        <div>
          <label className="text-xs font-bold text-on-surface-variant block mb-1">
            Assignment Title
          </label>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Operating Systems: Virtual Memory Page Replacement Simulator"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">Course</label>
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface outline-none"
            >
              {[
                'Operating Systems',
                'Data Structures',
                'Web Technologies',
                'Java',
                'Python',
                'DBMS',
                'English',
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface outline-none"
            >
              {['Urgent', 'High', 'Medium', 'Normal'].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">
              Course Weight (%)
            </label>
            <input
              type="number"
              min={5}
              max={50}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-on-surface-variant block mb-1">
            Lab Guidelines &amp; Deliverables
          </label>
          <textarea
            rows={4}
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
            placeholder="Specify rubric criteria, test coverage targets, and required file formats..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setActiveScreen('academic-management')}
            className="px-4 py-2.5 rounded-xl bg-surface-container text-xs font-semibold text-on-surface"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-90"
          >
            Publish Assignment
          </button>
        </div>
      </form>
    </div>
  );
};

export const AnnouncementsManagerView: React.FC = () => {
  const { publishAnnouncement, announcements, setActiveScreen } = useEduTrack();
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('CS Systems Lab');
  const [category, setCategory] = useState('cs');
  const [body, setBody] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    await publishAnnouncement({
      author: 'Prof. Marcus Vance',
      department,
      category,
      tagLabel:
        category === 'urgent'
          ? 'Urgent Notice'
          : category === 'exams'
          ? 'Exams & Proctors'
          : 'Faculty Update',
      title: title.trim(),
      body: body.trim(),
      isPinned,
      metaText: 'Published from Faculty Operations',
    });
    setTitle('');
    setBody('');
    setActiveScreen('announcements');
  };

  return (
    <div className="py-5 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">
          Announcements Manager
        </h1>
        <p className="text-xs sm:text-sm text-on-surface-variant">
          Broadcast campus bulletins and course alerts to enrolled cohorts ({announcements.length}{' '}
          active)
        </p>
      </div>

      <form
        onSubmit={handleBroadcast}
        className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/25 shadow-sm space-y-4"
      >
        <div>
          <label className="text-xs font-bold text-on-surface-variant block mb-1">
            Bulletin Headline
          </label>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., CS 301 Extended Office Hours Before Midterm"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">
              Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface outline-none"
            >
              <option value="official">Official Campus</option>
              <option value="cs">CS Department</option>
              <option value="exams">Exams &amp; Proctors</option>
              <option value="urgent">Urgent Notice</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-on-surface-variant block mb-1">
            Bulletin Message
          </label>
          <textarea
            required
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write announcement details, room updates, or schedule notes..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary"
          />
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-on-surface cursor-pointer">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="rounded border-outline"
          />
          <span>Pin as high-priority notice at top of student bulletin feed</span>
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setActiveScreen('academic-management')}
            className="px-4 py-2.5 rounded-xl bg-surface-container text-xs font-semibold text-on-surface"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-90"
          >
            Broadcast Bulletin
          </button>
        </div>
      </form>
    </div>
  );
};

export const AccountSettingsView: React.FC = () => {
  const { userProfile, updateProfile, darkMode, toggleDarkMode, handleSignOut } = useEduTrack();
  const [displayName, setDisplayName] = useState(userProfile.displayName);
  const [department, setDepartment] = useState(userProfile.department);
  const [standing, setStanding] = useState(userProfile.standing);

  const isFaculty = userProfile.role === 'faculty' || userProfile.role === 'staff';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      displayName: displayName.trim() || userProfile.displayName,
      department: department.trim() || userProfile.department,
      standing: standing.trim() || userProfile.standing,
    });
  };

  return (
    <div className="py-5 max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Account Settings</h1>
        <p className="text-xs sm:text-sm text-on-surface-variant">
          Manage academic identity, role scope, and workspace theme preferences
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/25 shadow-sm space-y-4"
      >
        <div>
          <label className="text-xs font-bold text-on-surface-variant block mb-1">
            Full Academic Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface outline-none focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">
              Department / Major
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-on-surface-variant block mb-1">
              Academic Standing
            </label>
            <input
              type="text"
              value={standing}
              onChange={(e) => setStanding(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-sm text-on-surface outline-none"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Authenticated Portal Scope
            </p>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {isFaculty
                ? 'Faculty & Operations access is active for this session.'
                : 'Sign out and sign in with Faculty / Staff login to access Faculty screens.'}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold capitalize">
            {isFaculty ? 'Faculty Portal' : 'Student Hub'}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
          <div>
            <p className="text-sm font-bold text-on-surface">Dark Mode Appearance</p>
            <p className="text-xs text-on-surface-variant">
              Switch between warm archival daylight and evening espresso surfaces
            </p>
          </div>
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`w-12 h-6 rounded-full p-0.5 transition-colors ${
              darkMode ? 'bg-primary' : 'bg-surface-container-highest'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full bg-surface-container-lowest block shadow transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-error-container text-on-error-container text-xs font-semibold"
          >
            <span className="material-symbols-outlined text-[16px]">logout</span>
            Sign Out
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-90"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
