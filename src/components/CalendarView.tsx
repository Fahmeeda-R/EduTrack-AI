import React, { useMemo, useState } from 'react';
import { useEduTrack } from '../context/EduTrackContext.tsx';
import { PROF_VANCE_AVATAR_URL } from '../data/previewSeed.ts';

const WEEK_DAYS = [
  { abbr: 'M', day: '21', date: '2024-10-21', label: 'Monday, October 21' },
  { abbr: 'Tu', day: '22', date: '2024-10-22', label: 'Today, October 22' },
  { abbr: 'W', day: '23', date: '2024-10-23', label: 'Tomorrow, October 23' },
  { abbr: 'Th', day: '24', date: '2024-10-24', label: 'Thursday, October 24' },
  { abbr: 'F', day: '25', date: '2024-10-25', label: 'Friday, October 25' },
  { abbr: 'Sa', day: '26', date: '2024-10-26', label: 'Saturday, October 26' },
  { abbr: 'Su', day: '27', date: '2024-10-27', label: 'Sunday, October 27' },
];

const COURSE_FILTERS = [
  'All Courses',
  'Data Structures',
  'Web Technologies',
  'Java',
  'Python',
  'Operating Systems',
  'DBMS',
  'Deadlines Only',
];

export const CalendarView: React.FC = () => {
  const { calendarEvents, createCalendarEvent, setActiveScreen, showToast } = useEduTrack();

  const [viewMode, setViewMode] = useState<'agenda' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState('All Courses');
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('Operating Systems');
  const [date, setDate] = useState('2024-10-22');
  const [timeRange, setTimeRange] = useState('06:00 PM – 07:00 PM');
  const [location, setLocation] = useState('Library Study Pod 2');

  const filteredEvents = useMemo(() => {
    return calendarEvents.filter((ev) => {
      if (selectedDate !== 'all' && ev.date !== selectedDate) return false;
      if (courseFilter === 'All Courses') return true;
      if (courseFilter === 'Deadlines Only') return ev.eventType === 'deadline';
      return ev.course === courseFilter;
    });
  }, [calendarEvents, selectedDate, courseFilter]);

  const groupedDates = useMemo(() => {
    const groups: Record<string, typeof filteredEvents> = {};
    for (const ev of filteredEvents) {
      if (!groups[ev.date]) groups[ev.date] = [];
      groups[ev.date].push(ev);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredEvents]);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createCalendarEvent({
      title: title.trim(),
      course,
      date,
      timeRange,
      location,
      eventType: 'ai_study',
      badgeText: 'Reminder',
      description: 'Personal study reminder scheduled from Academic Calendar.',
    });
    setTitle('');
    setModalOpen(false);
  };

  return (
    <div className="py-5 space-y-5">
      {/* Month & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedDate('all')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high transition-colors"
          >
            <span className="text-lg font-bold text-on-surface tracking-tight">October 2024</span>
            <span className="material-symbols-outlined text-[18px] text-tertiary">expand_more</span>
          </button>
          <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold">
            Wk 9
          </span>
        </div>

        <div className="flex items-center bg-surface-container p-1 rounded-xl shadow-sm">
          {(['agenda', 'week', 'month'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                viewMode === mode
                  ? 'bg-surface-container-lowest text-primary shadow-sm font-bold'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Sync Banner */}
      <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface-container-low shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[16px]">sync_saved_locally</span>
          </div>
          <p className="text-xs font-semibold text-on-surface truncate">
            Google Calendar & Canvas LMS Connected
          </p>
        </div>
        <button
          type="button"
          onClick={() => showToast('Calendar synced with Google Calendar', 'success')}
          className="font-mono text-xs text-primary font-semibold flex-shrink-0 hover:underline"
        >
          Sync now
        </button>
      </div>

      {/* Weekly Strip */}
      {viewMode !== 'month' ? (
        <div className="bg-surface-container-lowest rounded-2xl p-3 shadow-sm">
          <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
            {WEEK_DAYS.map((d) => {
              const active = selectedDate === d.date;
              const countForDay = calendarEvents.filter((e) => e.date === d.date).length;
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setSelectedDate(active ? 'all' : d.date)}
                  className={`flex flex-col items-center justify-center min-w-[44px] flex-1 py-2 rounded-xl transition-all ${
                    active
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span
                    className={`text-[11px] uppercase font-bold mb-1 ${
                      active ? 'text-primary-fixed' : 'text-outline'
                    }`}
                  >
                    {d.abbr}
                  </span>
                  <span className="text-base font-bold">{d.day}</span>
                  <div className="flex items-center gap-0.5 mt-1 h-1.5">
                    {countForDay > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          active ? 'bg-secondary-fixed' : 'bg-primary'
                        }`}
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* Month Overview Grid */
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-outline mb-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 31 }, (_, i) => {
              const dayNum = i + 1;
              const iso = `2024-10-${String(dayNum).padStart(2, '0')}`;
              const hasEvents = calendarEvents.some((e) => e.date === iso);
              const active = selectedDate === iso;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => setSelectedDate(active ? 'all' : iso)}
                  className={`h-10 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-colors ${
                    active
                      ? 'bg-primary text-on-primary'
                      : hasEvents
                      ? 'bg-secondary-fixed/50 text-on-secondary-fixed hover:bg-secondary-fixed'
                      : 'bg-surface-container-low/60 text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span>{dayNum}</span>
                  {hasEvents && (
                    <span
                      className={`w-1 h-1 rounded-full mt-0.5 ${
                        active ? 'bg-on-primary' : 'bg-primary'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Course Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {COURSE_FILTERS.map((cf) => {
          const active = courseFilter === cf;
          return (
            <button
              key={cf}
              type="button"
              onClick={() => setCourseFilter(cf)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-colors ${
                active
                  ? 'bg-primary text-on-primary shadow-sm'
                  : cf === 'Deadlines Only'
                  ? 'bg-secondary-fixed text-on-secondary-fixed hover:opacity-90'
                  : 'bg-surface-container-high text-on-surface hover:bg-surface-container'
              }`}
            >
              {cf}
            </button>
          );
        })}
      </div>

      {/* Timeline Flow */}
      <div className="space-y-6">
        {groupedDates.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-8 text-center shadow-sm">
            <span className="material-symbols-outlined text-3xl text-outline">event_busy</span>
            <p className="text-sm font-semibold text-on-surface mt-2">
              No scheduled events match this filter
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedDate('all');
                setCourseFilter('All Courses');
              }}
              className="mt-3 px-4 py-2 rounded-lg bg-surface-container text-primary text-xs font-semibold"
            >
              Show All Events
            </button>
          </div>
        ) : (
          groupedDates.map(([dateKey, items]) => {
            const dayInfo = WEEK_DAYS.find((d) => d.date === dateKey);
            return (
              <div key={dateKey} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-on-surface tracking-tight">
                    {dayInfo ? dayInfo.label : dateKey}
                  </h2>
                  <span className="text-xs font-semibold text-secondary bg-secondary-container/40 px-2.5 py-0.5 rounded-md">
                    {items.length} Event{items.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="relative pl-5 space-y-3">
                  <div className="absolute left-1.5 top-3 bottom-3 w-0.5 bg-surface-container-highest rounded-full" />
                  {items.map((ev) => {
                    const isDeadline = ev.eventType === 'deadline';
                    const isAi = ev.eventType === 'ai_study';
                    const isOffice = ev.eventType === 'office_hours';
                    return (
                      <div
                        key={ev.id}
                        className={`relative rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md ${
                          isAi
                            ? 'bg-surface-container-low'
                            : 'bg-surface-container-lowest'
                        } ${isDeadline ? 'ring-1 ring-primary/25' : ''}`}
                      >
                        <div
                          className={`absolute -left-[19px] top-5 w-3 h-3 rounded-full ring-4 ${
                            isDeadline
                              ? 'bg-error ring-error-container'
                              : isAi
                              ? 'bg-primary-container ring-primary-fixed-dim'
                              : 'bg-primary ring-primary-fixed'
                          }`}
                        />

                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold ${
                                  isDeadline
                                    ? 'bg-error-container text-on-error-container font-bold'
                                    : isAi
                                    ? 'bg-primary/10 text-primary font-bold'
                                    : 'bg-surface-container-high text-on-surface-variant'
                                }`}
                              >
                                {isAi ? `AI Recommended · ${ev.badgeText || '94% Fit'}` : ev.course}
                              </span>
                              <span
                                className={`text-xs font-semibold ${
                                  isDeadline ? 'text-error font-mono font-bold' : 'text-secondary'
                                }`}
                              >
                                {ev.timeRange}
                              </span>
                            </div>

                            <h3 className="text-sm sm:text-base font-bold text-on-surface">
                              {ev.title}
                            </h3>

                            {ev.description && (
                              <p className="text-xs text-on-surface-variant">{ev.description}</p>
                            )}

                            {ev.location && (
                              <p className="text-xs text-on-surface-variant flex items-center gap-1 pt-0.5">
                                <span className="material-symbols-outlined text-[15px] text-tertiary">
                                  location_on
                                </span>
                                <span>{ev.location}</span>
                              </p>
                            )}

                            {isDeadline && (
                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={() => setActiveScreen('submission')}
                                  className="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors shadow-sm"
                                >
                                  Upload Submission
                                </button>
                              </div>
                            )}
                          </div>

                          {isOffice && (
                            <img
                              alt="Prof. Marcus Vance"
                              src={PROF_VANCE_AVATAR_URL}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Reminder Floating Button */}
      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-on-primary shadow-lg hover:bg-primary-container transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span className="text-sm font-semibold">Add Reminder</span>
        </button>
      </div>

      {/* Add Reminder Modal */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleAddReminder}
            className="w-full max-w-md bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-on-surface">Add Calendar Reminder</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. OS Semaphore Review Session"
                  className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-sm outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                    Course
                  </label>
                  <select
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full h-11 px-2.5 bg-surface-container-low rounded-lg text-sm outline-none"
                  >
                    <option>Operating Systems</option>
                    <option>Data Structures</option>
                    <option>Web Technologies</option>
                    <option>Java</option>
                    <option>Python</option>
                    <option>DBMS</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-11 px-2.5 bg-surface-container-low rounded-lg text-sm outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                    Time Slot
                  </label>
                  <input
                    type="text"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full h-11 px-3 bg-surface-container-low rounded-lg text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 h-11 rounded-lg bg-surface-container text-on-surface text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 h-11 rounded-lg bg-primary text-on-primary text-sm font-semibold"
              >
                Save Event
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
