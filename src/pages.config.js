/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Admin from './pages/Admin';
import AdminAuditLog from './pages/AdminAuditLog';
import AdminChangeManagement from './pages/AdminChangeManagement';
import AdminControlLibrary from './pages/AdminControlLibrary';
import AdminEngagementSetup from './pages/AdminEngagementSetup';
import AdminGovernance from './pages/AdminGovernance';
import AdminGovernanceDocumentation from './pages/AdminGovernanceDocumentation';
import AdminIndustries from './pages/AdminIndustries';
import AdminInvitations from './pages/AdminInvitations';
import AdminJurisdictions from './pages/AdminJurisdictions';
import AdminMethodologies from './pages/AdminMethodologies';
import AdminNarratives from './pages/AdminNarratives';
import AdminRiskLibrary from './pages/AdminRiskLibrary';
import AdminRiskProposals from './pages/AdminRiskProposals';
import AdminSuggestions from './pages/AdminSuggestions';
import AdminTestScenarios from './pages/AdminTestScenarios';
import AdminTestTemplates from './pages/AdminTestTemplates';
import AdminUsers from './pages/AdminUsers';
import ArtifactDiagnostics from './pages/ArtifactDiagnostics';
import BuildVerificationDashboard from './pages/BuildVerificationDashboard';
import ChangeLog from './pages/ChangeLog';
import ClientDetail from './pages/ClientDetail';
import Clients from './pages/Clients';
import ComplianceOperations from './pages/ComplianceOperations';
import ControlCoverageMap from './pages/ControlCoverageMap';
import ControlTests from './pages/ControlTests';
import Dashboard from './pages/Dashboard';
import DeterministicEngineArchitecture from './pages/DeterministicEngineArchitecture';
import DeterministicEngineUpgradeSummary from './pages/DeterministicEngineUpgradeSummary';
import EngagementControlTesting from './pages/EngagementControlTesting';
import EngagementDetail from './pages/EngagementDetail';
import EngagementDetailV2 from './pages/EngagementDetailV2';
import Engagements from './pages/Engagements';
import EngagementsV2 from './pages/EngagementsV2';
import Feedback from './pages/Feedback';
import Findings from './pages/Findings';
import GovernanceDeliveryGateSummary from './pages/GovernanceDeliveryGateSummary';
import Help from './pages/Help';
import HistoricalNormalizationSummary from './pages/HistoricalNormalizationSummary';
import InfrastructureLayerOverview from './pages/InfrastructureLayerOverview';
import LibraryReviewDashboard from './pages/LibraryReviewDashboard';
import NW010DeliveryGateSummary from './pages/NW010DeliveryGateSummary';
import NW013DeliveryGateFinal from './pages/NW013DeliveryGateFinal';
import NW040UpgradeSummary from './pages/NW040UpgradeSummary';
import PageInventoryAudit from './pages/PageInventoryAudit';
import PromptTemplateSystemSummary from './pages/PromptTemplateSystemSummary';
import PublishNW013 from './pages/PublishNW013';
import RegressionTestDashboard from './pages/RegressionTestDashboard';
import RemediationActions from './pages/RemediationActions';
import ReportPublicationDebug from './pages/ReportPublicationDebug';
import Reports from './pages/Reports';
import ReviewerDashboard from './pages/ReviewerDashboard';
import RunNW040Verification from './pages/RunNW040Verification';
import Tasks from './pages/Tasks';
import TestCycles from './pages/TestCycles';
import AdminAudits from './pages/AdminAudits';
import AuditDetail from './pages/AuditDetail';
import AuditProcedureExecution from './pages/AuditProcedureExecution';
import AuditReview from './pages/AuditReview';
import AuditReport from './pages/AuditReport';
import AdminAuditPrograms from './pages/AdminAuditPrograms';
import AdminAuditTemplates from './pages/AdminAuditTemplates';
import AuditFindings from './pages/AuditFindings';


export const PAGES = {
    "Admin": Admin,
    "AdminAuditLog": AdminAuditLog,
    "AdminChangeManagement": AdminChangeManagement,
    "AdminControlLibrary": AdminControlLibrary,
    "AdminEngagementSetup": AdminEngagementSetup,
    "AdminGovernance": AdminGovernance,
    "AdminGovernanceDocumentation": AdminGovernanceDocumentation,
    "AdminIndustries": AdminIndustries,
    "AdminInvitations": AdminInvitations,
    "AdminJurisdictions": AdminJurisdictions,
    "AdminMethodologies": AdminMethodologies,
    "AdminNarratives": AdminNarratives,
    "AdminRiskLibrary": AdminRiskLibrary,
    "AdminRiskProposals": AdminRiskProposals,
    "AdminSuggestions": AdminSuggestions,
    "AdminTestScenarios": AdminTestScenarios,
    "AdminTestTemplates": AdminTestTemplates,
    "AdminUsers": AdminUsers,
    "ArtifactDiagnostics": ArtifactDiagnostics,
    "BuildVerificationDashboard": BuildVerificationDashboard,
    "ChangeLog": ChangeLog,
    "ClientDetail": ClientDetail,
    "Clients": Clients,
    "ComplianceOperations": ComplianceOperations,
    "ControlCoverageMap": ControlCoverageMap,
    "ControlTests": ControlTests,
    "Dashboard": Dashboard,
    "DeterministicEngineArchitecture": DeterministicEngineArchitecture,
    "DeterministicEngineUpgradeSummary": DeterministicEngineUpgradeSummary,
    "EngagementControlTesting": EngagementControlTesting,
    "EngagementDetail": EngagementDetail,
    "EngagementDetailV2": EngagementDetailV2,
    "Engagements": Engagements,
    "EngagementsV2": EngagementsV2,
    "Feedback": Feedback,
    "Findings": Findings,
    "GovernanceDeliveryGateSummary": GovernanceDeliveryGateSummary,
    "Help": Help,
    "HistoricalNormalizationSummary": HistoricalNormalizationSummary,
    "InfrastructureLayerOverview": InfrastructureLayerOverview,
    "LibraryReviewDashboard": LibraryReviewDashboard,
    "NW010DeliveryGateSummary": NW010DeliveryGateSummary,
    "NW013DeliveryGateFinal": NW013DeliveryGateFinal,
    "NW040UpgradeSummary": NW040UpgradeSummary,
    "PageInventoryAudit": PageInventoryAudit,
    "PromptTemplateSystemSummary": PromptTemplateSystemSummary,
    "PublishNW013": PublishNW013,
    "RegressionTestDashboard": RegressionTestDashboard,
    "RemediationActions": RemediationActions,
    "ReportPublicationDebug": ReportPublicationDebug,
    "Reports": Reports,
    "ReviewerDashboard": ReviewerDashboard,
    "RunNW040Verification": RunNW040Verification,
    "Tasks": Tasks,
    "TestCycles": TestCycles,
    "AdminAudits": AdminAudits,
    "AuditDetail": AuditDetail,
    "AuditProcedureExecution": AuditProcedureExecution,
    "AuditReview": AuditReview,
    "AuditReport": AuditReport,
    "AdminAuditPrograms": AdminAuditPrograms,
    "AdminAuditTemplates": AdminAuditTemplates,
    "AuditFindings": AuditFindings,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
};