import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from '@/layout';

// Page imports
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Engagements from './pages/Engagements';
import EngagementDetail from './pages/EngagementDetail';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import TestCycles from './pages/TestCycles';
import ControlTests from './pages/ControlTests';
import Findings from './pages/Findings';
import RemediationActions from './pages/RemediationActions';
import ReviewerDashboard from './pages/ReviewerDashboard';
import Admin from './pages/Admin';
import AdminRiskLibrary from './pages/AdminRiskLibrary';
import AdminControlLibrary from './pages/AdminControlLibrary';
import AdminMethodologies from './pages/AdminMethodologies';
import AdminNarratives from './pages/AdminNarratives';
import AdminUsers from './pages/AdminUsers';
import AdminInvitations from './pages/AdminInvitations';
import AdminAuditLog from './pages/AdminAuditLog';
import AdminJurisdictions from './pages/AdminJurisdictions';
import AdminIndustries from './pages/AdminIndustries';
import AdminTestScenarios from './pages/AdminTestScenarios';
import AdminRiskProposals from './pages/AdminRiskProposals';
import AdminFeatureFlags from './pages/AdminFeatureFlags';
import AdminReleaseLog from './pages/AdminReleaseLog';
import LibraryReviewDashboard from './pages/LibraryReviewDashboard';
import AdminGovernance from './pages/AdminGovernance';
import ChangeLog from './pages/ChangeLog';
import ArtifactDiagnostics from './pages/ArtifactDiagnostics';
import Feedback from './pages/Feedback';
import Help from './pages/Help';

const LayoutWrapper = ({ children, currentPageName }) => (
  <Layout currentPageName={currentPageName}>{children}</Layout>
);

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Dashboard" replace />} />
      <Route path="/Dashboard" element={<LayoutWrapper currentPageName="Dashboard"><Dashboard /></LayoutWrapper>} />
      <Route path="/Clients" element={<LayoutWrapper currentPageName="Clients"><Clients /></LayoutWrapper>} />
      <Route path="/ClientDetail" element={<LayoutWrapper currentPageName="ClientDetail"><ClientDetail /></LayoutWrapper>} />
      <Route path="/Engagements" element={<LayoutWrapper currentPageName="Engagements"><Engagements /></LayoutWrapper>} />
      <Route path="/EngagementDetail" element={<LayoutWrapper currentPageName="EngagementDetail"><EngagementDetail /></LayoutWrapper>} />
      <Route path="/Tasks" element={<LayoutWrapper currentPageName="Tasks"><Tasks /></LayoutWrapper>} />
      <Route path="/Reports" element={<LayoutWrapper currentPageName="Reports"><Reports /></LayoutWrapper>} />
      <Route path="/TestCycles" element={<LayoutWrapper currentPageName="TestCycles"><TestCycles /></LayoutWrapper>} />
      <Route path="/ControlTests" element={<LayoutWrapper currentPageName="ControlTests"><ControlTests /></LayoutWrapper>} />
      <Route path="/Findings" element={<LayoutWrapper currentPageName="Findings"><Findings /></LayoutWrapper>} />
      <Route path="/RemediationActions" element={<LayoutWrapper currentPageName="RemediationActions"><RemediationActions /></LayoutWrapper>} />
      <Route path="/ReviewerDashboard" element={<LayoutWrapper currentPageName="ReviewerDashboard"><ReviewerDashboard /></LayoutWrapper>} />
      <Route path="/Admin" element={<LayoutWrapper currentPageName="Admin"><Admin /></LayoutWrapper>} />
      <Route path="/AdminRiskLibrary" element={<LayoutWrapper currentPageName="AdminRiskLibrary"><AdminRiskLibrary /></LayoutWrapper>} />
      <Route path="/AdminControlLibrary" element={<LayoutWrapper currentPageName="AdminControlLibrary"><AdminControlLibrary /></LayoutWrapper>} />
      <Route path="/AdminMethodologies" element={<LayoutWrapper currentPageName="AdminMethodologies"><AdminMethodologies /></LayoutWrapper>} />
      <Route path="/AdminNarratives" element={<LayoutWrapper currentPageName="AdminNarratives"><AdminNarratives /></LayoutWrapper>} />
      <Route path="/AdminUsers" element={<LayoutWrapper currentPageName="AdminUsers"><AdminUsers /></LayoutWrapper>} />
      <Route path="/AdminInvitations" element={<LayoutWrapper currentPageName="AdminInvitations"><AdminInvitations /></LayoutWrapper>} />
      <Route path="/AdminAuditLog" element={<LayoutWrapper currentPageName="AdminAuditLog"><AdminAuditLog /></LayoutWrapper>} />
      <Route path="/AdminJurisdictions" element={<LayoutWrapper currentPageName="AdminJurisdictions"><AdminJurisdictions /></LayoutWrapper>} />
      <Route path="/AdminIndustries" element={<LayoutWrapper currentPageName="AdminIndustries"><AdminIndustries /></LayoutWrapper>} />
      <Route path="/AdminTestScenarios" element={<LayoutWrapper currentPageName="AdminTestScenarios"><AdminTestScenarios /></LayoutWrapper>} />
      <Route path="/AdminRiskProposals" element={<LayoutWrapper currentPageName="AdminRiskProposals"><AdminRiskProposals /></LayoutWrapper>} />
      <Route path="/AdminFeatureFlags" element={<LayoutWrapper currentPageName="AdminFeatureFlags"><AdminFeatureFlags /></LayoutWrapper>} />
      <Route path="/AdminReleaseLog" element={<LayoutWrapper currentPageName="AdminReleaseLog"><AdminReleaseLog /></LayoutWrapper>} />
      <Route path="/LibraryReviewDashboard" element={<LayoutWrapper currentPageName="LibraryReviewDashboard"><LibraryReviewDashboard /></LayoutWrapper>} />
      <Route path="/AdminGovernance" element={<LayoutWrapper currentPageName="AdminGovernance"><AdminGovernance /></LayoutWrapper>} />
      <Route path="/ChangeLog" element={<LayoutWrapper currentPageName="ChangeLog"><ChangeLog /></LayoutWrapper>} />
      <Route path="/ArtifactDiagnostics" element={<LayoutWrapper currentPageName="ArtifactDiagnostics"><ArtifactDiagnostics /></LayoutWrapper>} />
      <Route path="/Feedback" element={<LayoutWrapper currentPageName="Feedback"><Feedback /></LayoutWrapper>} />
      <Route path="/Help" element={<LayoutWrapper currentPageName="Help"><Help /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App