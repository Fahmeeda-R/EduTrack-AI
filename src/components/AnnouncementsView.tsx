import React, { useMemo, useState } from 'react';
import { useEduTrack } from '../context/EduTrackContext.tsx';
import type { AnnouncementItem } from '../types/edutrack.ts';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'official', label: 'Official Campus' },
  { id: 'cs', label: 'CS Department' },
  { id: 'exams', label: 'Exams & Proctors' },
  { id: 'urgent', label: 'Urgent/Alerts' },
];

export const AnnouncementsView: React.FC = () => {
  const {
    announcements,
    toggleAnnouncementBookmark,
    toggleAnnouncementRsvp,
    createCalendarEvent,
    setActiveScreen,
    showToast,
  } = useEduTrack();

  const [pushAlerts, setPushAlerts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [detailBulletin, setDetailBulletin] = useState<AnnouncementItem | null>(null);

  const pinnedNotice = useMemo(
    () => announcements.find((a) => a.isPinned) || null,
    [announcements]
  );

  const filteredFeed = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return announcements.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.body.toLowerCase().includes(q) ||
        item.author.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q)
      );
    });
  }, [announcements, activeCategory, searchQuery]);

  const handleDownloadProctoringPdf = (item: AnnouncementItem) => {
    const blob = new Blob(
      [
        `EduTrack AI Official Academic Bulletin\nTitle: ${item.title}\nIssued by: ${item.author} (${item.department})\nDate: ${item.dateLabel}\n\n${item.body}\n`,
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.slice(0, 32).replace(/\W+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Bulletin document downloaded', 'success');
  };

  const handleAddToCalendar = async (item: AnnouncementItem) => {
    await createCalendarEvent({
      title: item.title,
      course: item.department,
      date: '2024-10-25',
      timeRange: '09:00 AM – 10:30 AM',
      location: 'Campus / Portal',
      eventType: item.category === 'urgent' ? 'deadline' : 'lecture',
      badgeText: item.tagLabel,
      description: item.body,
    });
  };

  return (
    <div className="py-5 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            Academic Announcements
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Official updates from faculty and departments
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setPushAlerts((v) => !v);
            showToast(
              pushAlerts ? 'Push alerts muted for bulletins' : 'Push alerts enabled',
              'info'
            );
          }}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${
            pushAlerts
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {pushAlerts ? 'notifications_active' : 'notifications_off'}
          </span>
          <span>Push Alerts {pushAlerts ? 'On' : 'Off'}</span>
        </button>
      </div>

      {/* Search & Filters */}
      <div className="space-y-3">
        <div className="relative">
          <span className="material-symbols-outlined text-[20px] text-outline absolute left-3.5 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campus notices, proctoring schedules, seminars..."
            className="w-full pl-11 pr-10 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm text-on-surface placeholder:text-outline outline-none focus:border-primary"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.id === 'all'
                ? announcements.length
                : announcements.filter((a) => a.category === tab.id).length;
            const active = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Pinned Urgent Notice */}
      {pinnedNotice && (activeCategory === 'all' || activeCategory === pinnedNotice.category) && (
        <div className="bg-error-container/35 border border-error/30 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error text-on-error text-[11px] font-bold">
              <span className="material-symbols-outlined text-[14px]">priority_high</span>
              {pinnedNotice.tagLabel}
            </span>
            <span className="text-xs font-semibold text-on-surface-variant">
              {pinnedNotice.dateLabel}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-on-surface">{pinnedNotice.title}</h2>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            {pinnedNotice.body}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
              <span className="material-symbols-outlined text-error text-[18px]">
                picture_as_pdf
              </span>
              <span>{pinnedNotice.metaText || 'Proctoring_Schedule_v3.pdf · 1.2 MB'}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadProctoringPdf(pinnedNotice)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-lowest text-on-surface text-xs font-semibold border border-outline-variant/30 hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Download PDF
              </button>
              <button
                type="button"
                onClick={() => handleAddToCalendar(pinnedNotice)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[16px]">event_available</span>
                Add to Cal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Feed */}
      <div className="space-y-4">
        {filteredFeed
          .filter((a) => !a.isPinned || activeCategory !== 'all')
          .map((item) => (
            <article
              key={item.id}
              className="bg-surface-container-lowest rounded-2xl border border-outline-variant/25 shadow-sm overflow-hidden"
            >
              {item.imageUrl && (
                <div className="h-44 sm:h-52 w-full overflow-hidden bg-surface-container">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold">
                      {item.tagLabel}
                    </span>
                    <span className="text-xs text-on-surface-variant truncate">
                      {item.dateLabel}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label="Bookmark announcement"
                    onClick={() => toggleAnnouncementBookmark(item.id)}
                    className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center text-primary transition-colors"
                  >
                    <span
                      className={`material-symbols-outlined text-[20px] ${
                        item.isBookmarked ? 'material-symbols-filled' : ''
                      }`}
                    >
                      {item.isBookmarked ? 'bookmark' : 'bookmark_border'}
                    </span>
                  </button>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-on-surface leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                  {item.body}
                </p>

                {item.metaText && (
                  <div className="text-xs font-semibold text-secondary flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    <span>{item.metaText}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/15">
                  {item.imageUrl ? (
                    <button
                      type="button"
                      onClick={() => toggleAnnouncementRsvp(item.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        item.isRsvped
                          ? 'bg-secondary-fixed text-on-secondary-fixed'
                          : 'bg-primary text-on-primary shadow-sm'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {item.isRsvped ? 'check_circle' : 'how_to_reg'}
                      </span>
                      {item.isRsvped ? 'Attendance Registered' : 'Register Attendance'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDetailBulletin(item)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                    >
                      <span>Read full bulletin</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddToCalendar(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px]">calendar_add_on</span>
                      Add to Calendar
                    </button>
                    {item.category === 'exams' && (
                      <button
                        type="button"
                        onClick={() => setActiveScreen('calendar')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-primary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                        View Schedule
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
      </div>

      {/* Footer */}
      <div className="bg-surface-container-low rounded-2xl p-4 text-center border border-outline-variant/20 space-y-1">
        <span className="material-symbols-outlined text-primary text-[22px]">done_all</span>
        <p className="text-sm font-bold text-on-surface">You&apos;re completely up to date</p>
        <p className="text-xs text-on-surface-variant">
          All university bulletins for current term enrolled courses read.
        </p>
      </div>

      {/* Bulletin Detail Modal */}
      {detailBulletin && (
        <div
          onClick={() => setDetailBulletin(null)}
          className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-outline-variant/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-bold">
                {detailBulletin.tagLabel}
              </span>
              <button
                type="button"
                onClick={() => setDetailBulletin(null)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <h3 className="text-lg font-bold text-on-surface">{detailBulletin.title}</h3>
            <p className="text-xs font-semibold text-secondary">
              {detailBulletin.author} · {detailBulletin.department} · {detailBulletin.dateLabel}
            </p>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {detailBulletin.body}
            </p>
            {detailBulletin.metaText && (
              <p className="text-xs font-mono bg-surface-container-low p-3 rounded-xl text-on-surface">
                {detailBulletin.metaText}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
