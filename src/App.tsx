import React from 'react';
import { EduTrackProvider, useEduTrack } from './context/EduTrackContext.tsx';
import { AppShell } from './components/AppShell.tsx';
import { LoginView } from './components/LoginView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { AssignmentsView } from './components/AssignmentsView.tsx';
import { SubmissionView } from './components/SubmissionView.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { AiAssistantView } from './components/AiAssistantView.tsx';
import { DocumentsView } from './components/DocumentsView.tsx';
import { AnnouncementsView } from './components/AnnouncementsView.tsx';
import { StudyPlannerView } from './components/StudyPlannerView.tsx';
import { FacultyView } from './components/FacultyView.tsx';
import {
  AccountSettingsView,
  AnnouncementsManagerView,
  AssignmentPublisherView,
  GradebookView,
} from './components/FacultySecondaryViews.tsx';
import SupportChatbot from './components/SupportChatbot.tsx';

const EduTrackRouter: React.FC = () => {
  const { activeScreen, authLoading, userProfile } = useEduTrack();
  const isFaculty = userProfile.role === 'faculty' || userProfile.role === 'staff';

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface text-on-surface flex flex-col items-center justify-center gap-3">
        <span className="material-symbols-outlined text-[36px] text-primary animate-spin">
          progress_activity
        </span>
        <p className="text-sm font-semibold text-on-surface-variant">
          Initializing EduTrack AI workspace...
        </p>
      </div>
    );
  }

  return (
    <AppShell>
      {activeScreen === 'login' && <LoginView />}
      {activeScreen === 'dashboard' && <DashboardView />}
      {activeScreen === 'assignments' && <AssignmentsView />}
      {activeScreen === 'submission' && <SubmissionView />}
      {activeScreen === 'calendar' && <CalendarView />}
      {activeScreen === 'ai-assistant' && <AiAssistantView />}
      {activeScreen === 'my-documents' && <DocumentsView />}
      {activeScreen === 'announcements' && <AnnouncementsView />}
      {activeScreen === 'ai-study-planner' && <StudyPlannerView />}
      {activeScreen === 'academic-management' && (isFaculty ? <FacultyView /> : <DashboardView />)}
      {activeScreen === 'gradebook' && (isFaculty ? <GradebookView /> : <DashboardView />)}
      {activeScreen === 'assignment-publisher' &&
        (isFaculty ? <AssignmentPublisherView /> : <DashboardView />)}
      {activeScreen === 'announcements-manager' &&
        (isFaculty ? <AnnouncementsManagerView /> : <DashboardView />)}
      {activeScreen === 'account-settings' && <AccountSettingsView />}
      {activeScreen === 'support-chatbot' && <SupportChatbot />}
    </AppShell>
  );
};

export default function App() {
  return (
    <EduTrackProvider>
      <EduTrackRouter />
    </EduTrackProvider>
  );
}
