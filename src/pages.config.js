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
import AdminControlLibrary from './pages/AdminControlLibrary';
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
import AdminUsers from './pages/AdminUsers';
import ClientDetail from './pages/ClientDetail';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import DeterministicEngineArchitecture from './pages/DeterministicEngineArchitecture';
import DeterministicEngineUpgradeSummary from './pages/DeterministicEngineUpgradeSummary';
import DeterministicEngineVerification from './pages/DeterministicEngineVerification';
import EngagementDetail from './pages/EngagementDetail';
import Engagements from './pages/Engagements';
import Feedback from './pages/Feedback';
import FeedbackImplementationSummary from './pages/FeedbackImplementationSummary';
import FeedbackTestingReport from './pages/FeedbackTestingReport';
import GovernanceDeliveryGateSummary from './pages/GovernanceDeliveryGateSummary';
import Help from './pages/Help';
import HistoricalNormalizationSummary from './pages/HistoricalNormalizationSummary';
import ImplementationSummary from './pages/ImplementationSummary';
import InfrastructureLayerOverview from './pages/InfrastructureLayerOverview';
import LibraryReviewDashboard from './pages/LibraryReviewDashboard';
import NW010DeliveryGateSummary from './pages/NW010DeliveryGateSummary';
import NightwatchAuditReport from './pages/NightwatchAuditReport';
import NightwatchV09DeliveryGateSummary from './pages/NightwatchV09DeliveryGateSummary';
import NightwatchV09InternalAudit from './pages/NightwatchV09InternalAudit';
import NightwatchV09Summary from './pages/NightwatchV09Summary';
import NightwatchV09VerificationReport from './pages/NightwatchV09VerificationReport';
import NightwatchV14FinalSummary from './pages/NightwatchV14FinalSummary';
import NightwatchV15InternalAudit from './pages/NightwatchV15InternalAudit';
import NightwatchV15Summary from './pages/NightwatchV15Summary';
import NightwatchV15VerificationReport from './pages/NightwatchV15VerificationReport';
import NightwatchV17DeliveryGateSummary from './pages/NightwatchV17DeliveryGateSummary';
import NightwatchV17InternalAudit from './pages/NightwatchV17InternalAudit';
import NightwatchV17Summary from './pages/NightwatchV17Summary';
import NightwatchV17VerificationReport from './pages/NightwatchV17VerificationReport';
import NightwatchV18DeliveryGateSummary from './pages/NightwatchV18DeliveryGateSummary';
import NightwatchV18InternalAudit from './pages/NightwatchV18InternalAudit';
import NightwatchV18Summary from './pages/NightwatchV18Summary';
import NightwatchV18VerificationReport from './pages/NightwatchV18VerificationReport';
import PromptTemplateSystemSummary from './pages/PromptTemplateSystemSummary';
import RegressionTestDashboard from './pages/RegressionTestDashboard';
import ReportPublicationDebug from './pages/ReportPublicationDebug';
import Reports from './pages/Reports';
import ReviewerDashboard from './pages/ReviewerDashboard';
import Tasks from './pages/Tasks';
import PageInventoryAudit from './pages/PageInventoryAudit';
import AdminChangeManagement from './pages/AdminChangeManagement';
import PublishNW013 from './pages/PublishNW013';
import NW013DeliveryGateFinal from './pages/NW013DeliveryGateFinal';
import NW014DeliveryGateSummary from './pages/NW014DeliveryGateSummary';
import NW014ArchitectureVerification from './pages/NW014ArchitectureVerification';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "AdminAuditLog": AdminAuditLog,
    "AdminControlLibrary": AdminControlLibrary,
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
    "AdminUsers": AdminUsers,
    "ClientDetail": ClientDetail,
    "Clients": Clients,
    "Dashboard": Dashboard,
    "DeterministicEngineArchitecture": DeterministicEngineArchitecture,
    "DeterministicEngineUpgradeSummary": DeterministicEngineUpgradeSummary,
    "DeterministicEngineVerification": DeterministicEngineVerification,
    "EngagementDetail": EngagementDetail,
    "Engagements": Engagements,
    "Feedback": Feedback,
    "FeedbackImplementationSummary": FeedbackImplementationSummary,
    "FeedbackTestingReport": FeedbackTestingReport,
    "GovernanceDeliveryGateSummary": GovernanceDeliveryGateSummary,
    "Help": Help,
    "HistoricalNormalizationSummary": HistoricalNormalizationSummary,
    "ImplementationSummary": ImplementationSummary,
    "InfrastructureLayerOverview": InfrastructureLayerOverview,
    "LibraryReviewDashboard": LibraryReviewDashboard,
    "NW010DeliveryGateSummary": NW010DeliveryGateSummary,
    "NightwatchAuditReport": NightwatchAuditReport,
    "NightwatchV09DeliveryGateSummary": NightwatchV09DeliveryGateSummary,
    "NightwatchV09InternalAudit": NightwatchV09InternalAudit,
    "NightwatchV09Summary": NightwatchV09Summary,
    "NightwatchV09VerificationReport": NightwatchV09VerificationReport,
    "NightwatchV14FinalSummary": NightwatchV14FinalSummary,
    "NightwatchV15InternalAudit": NightwatchV15InternalAudit,
    "NightwatchV15Summary": NightwatchV15Summary,
    "NightwatchV15VerificationReport": NightwatchV15VerificationReport,
    "NightwatchV17DeliveryGateSummary": NightwatchV17DeliveryGateSummary,
    "NightwatchV17InternalAudit": NightwatchV17InternalAudit,
    "NightwatchV17Summary": NightwatchV17Summary,
    "NightwatchV17VerificationReport": NightwatchV17VerificationReport,
    "NightwatchV18DeliveryGateSummary": NightwatchV18DeliveryGateSummary,
    "NightwatchV18InternalAudit": NightwatchV18InternalAudit,
    "NightwatchV18Summary": NightwatchV18Summary,
    "NightwatchV18VerificationReport": NightwatchV18VerificationReport,
    "PromptTemplateSystemSummary": PromptTemplateSystemSummary,
    "RegressionTestDashboard": RegressionTestDashboard,
    "ReportPublicationDebug": ReportPublicationDebug,
    "Reports": Reports,
    "ReviewerDashboard": ReviewerDashboard,
    "Tasks": Tasks,
    "PageInventoryAudit": PageInventoryAudit,
    "AdminChangeManagement": AdminChangeManagement,
    "PublishNW013": PublishNW013,
    "NW013DeliveryGateFinal": NW013DeliveryGateFinal,
    "NW014DeliveryGateSummary": NW014DeliveryGateSummary,
    "NW014ArchitectureVerification": NW014ArchitectureVerification,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};