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
import Help from './pages/Help';
import ImplementationSummary from './pages/ImplementationSummary';
import InfrastructureLayerOverview from './pages/InfrastructureLayerOverview';
import LibraryReviewDashboard from './pages/LibraryReviewDashboard';
import NightwatchAuditReport from './pages/NightwatchAuditReport';
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
import NightwatchVerificationReport from './pages/NightwatchVerificationReport';
import PromptTemplateSystemSummary from './pages/PromptTemplateSystemSummary';
import Reports from './pages/Reports';
import ReviewerDashboard from './pages/ReviewerDashboard';
import SystemAuditReportH7314 from './pages/SystemAuditReportH7314';
import SystemAuditReportNW11 from './pages/SystemAuditReportNW11';
import Tasks from './pages/Tasks';
import VerificationReportA1847 from './pages/VerificationReportA1847';
import VerificationReportA7364 from './pages/VerificationReportA7364';
import VerificationReportB6142 from './pages/VerificationReportB6142';
import VerificationReportC4186 from './pages/VerificationReportC4186';
import VerificationReportH7314 from './pages/VerificationReportH7314';
import VerificationReportM4827 from './pages/VerificationReportM4827';
import VerificationReportNW11 from './pages/VerificationReportNW11';
import VerificationReportU4827 from './pages/VerificationReportU4827';
import NightwatchV09Summary from './pages/NightwatchV09Summary';
import NightwatchV09VerificationReport from './pages/NightwatchV09VerificationReport';
import NightwatchV09InternalAudit from './pages/NightwatchV09InternalAudit';
import NightwatchV09DeliveryGateSummary from './pages/NightwatchV09DeliveryGateSummary';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "AdminAuditLog": AdminAuditLog,
    "AdminControlLibrary": AdminControlLibrary,
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
    "Help": Help,
    "ImplementationSummary": ImplementationSummary,
    "InfrastructureLayerOverview": InfrastructureLayerOverview,
    "LibraryReviewDashboard": LibraryReviewDashboard,
    "NightwatchAuditReport": NightwatchAuditReport,
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
    "NightwatchVerificationReport": NightwatchVerificationReport,
    "PromptTemplateSystemSummary": PromptTemplateSystemSummary,
    "Reports": Reports,
    "ReviewerDashboard": ReviewerDashboard,
    "SystemAuditReportH7314": SystemAuditReportH7314,
    "SystemAuditReportNW11": SystemAuditReportNW11,
    "Tasks": Tasks,
    "VerificationReportA1847": VerificationReportA1847,
    "VerificationReportA7364": VerificationReportA7364,
    "VerificationReportB6142": VerificationReportB6142,
    "VerificationReportC4186": VerificationReportC4186,
    "VerificationReportH7314": VerificationReportH7314,
    "VerificationReportM4827": VerificationReportM4827,
    "VerificationReportNW11": VerificationReportNW11,
    "VerificationReportU4827": VerificationReportU4827,
    "NightwatchV09Summary": NightwatchV09Summary,
    "NightwatchV09VerificationReport": NightwatchV09VerificationReport,
    "NightwatchV09InternalAudit": NightwatchV09InternalAudit,
    "NightwatchV09DeliveryGateSummary": NightwatchV09DeliveryGateSummary,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};